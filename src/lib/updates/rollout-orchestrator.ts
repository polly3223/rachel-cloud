/**
 * Gradual rollout orchestrator for Rachel Cloud fleet updates.
 *
 * Triggers container image updates via the Docker orchestrator API.
 * The orchestrator handles the actual Docker pull/recreate/healthcheck cycle.
 * This module manages the rollout state for the admin UI.
 *
 * Deploys updates across all active containers in three stages:
 *   Stage 1: 10% of containers (canary)
 *   Stage 2: 50% of containers (early majority)
 *   Stage 3: 100% of containers (full fleet)
 *
 * Between each stage, checks the failure rate. If more than 30% of a
 * stage's containers fail, the rollout halts automatically.
 *
 * Only one rollout can run at a time. Admin polls getRolloutStatus()
 * for real-time progress.
 *
 * @module updates/rollout-orchestrator
 */

import { orchestrator, type UpdateResult } from '$lib/orchestrator/client';
import { db } from '$lib/db';
import { subscriptions, users } from '$lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Rollout stages: fraction of total containers to update in each stage. */
const ROLLOUT_STAGES = [0.1, 0.5, 1.0];

/** Stage names for human-readable status. */
const STAGE_NAMES: Record<number, RolloutStage> = {
	0: 'stage_10',
	1: 'stage_50',
	2: 'stage_100'
};

/** Halt rollout if more than 30% of a stage's containers fail. */
const STAGE_FAILURE_THRESHOLD = 0.3;

/** Maximum concurrent container updates during rollout. */
const CONCURRENCY_LIMIT = 5;

/** Pause between stages (10 seconds). */
const INTER_STAGE_DELAY_MS = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Current stage of the rollout. */
export type RolloutStage =
	| 'idle'
	| 'stage_10'
	| 'stage_50'
	| 'stage_100'
	| 'completed'
	| 'failed'
	| 'halted';

/** Per-container update tracking during rollout. */
export interface ContainerUpdateStatus {
	userId: string;
	email: string;
	containerName: string;
	status: 'pending' | 'updating' | 'success' | 'failed' | 'rolled_back' | 'skipped';
	previousImage: string | null;
	newImage: string | null;
	error: string | null;
}

/** Overall rollout state, returned by getRolloutStatus(). */
export interface RolloutState {
	inProgress: boolean;
	stage: RolloutStage;
	startedAt: Date | null;
	completedAt: Date | null;
	totalContainers: number;
	updatedCount: number;
	failedCount: number;
	rolledBackCount: number;
	currentStageProgress: number;
	error: string | null;
	containerStatuses: ContainerUpdateStatus[];
	/** @deprecated Alias for containerStatuses, kept for admin UI compat */
	vpsStatuses: ContainerUpdateStatus[];
}

// ---------------------------------------------------------------------------
// Module state (in-memory singleton)
// ---------------------------------------------------------------------------

let rolloutState: RolloutState = createIdleState();

function createIdleState(): RolloutState {
	const state: RolloutState = {
		inProgress: false,
		stage: 'idle',
		startedAt: null,
		completedAt: null,
		totalContainers: 0,
		updatedCount: 0,
		failedCount: 0,
		rolledBackCount: 0,
		currentStageProgress: 0,
		error: null,
		containerStatuses: [],
		get vpsStatuses() { return this.containerStatuses; }
	};
	return state;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shuffle an array in-place using Fisher-Yates algorithm.
 */
function shuffleArray<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Process items in parallel batches with a concurrency limit.
 */
async function processInBatches<T>(
	items: T[],
	concurrency: number,
	fn: (item: T) => Promise<void>
): Promise<void> {
	for (let i = 0; i < items.length; i += concurrency) {
		const batch = items.slice(i, i + concurrency);
		await Promise.allSettled(batch.map(fn));
	}
}

// ---------------------------------------------------------------------------
// Internal: Container query
// ---------------------------------------------------------------------------

interface UpdatableContainer {
	userId: string;
	email: string;
	containerName: string;
}

/**
 * Query all active, provisioned containers eligible for updates.
 */
async function getUpdatableContainers(): Promise<UpdatableContainer[]> {
	const results = await db
		.select({
			userId: subscriptions.userId,
			email: users.email,
			containerName: subscriptions.containerName,
		})
		.from(subscriptions)
		.innerJoin(users, eq(subscriptions.userId, users.id))
		.where(
			and(
				eq(subscriptions.status, 'active'),
				eq(subscriptions.vpsProvisioned, true),
				eq(subscriptions.provisioningStatus, 'ready'),
				isNotNull(subscriptions.containerId)
			)
		);

	return results.filter(
		(r): r is UpdatableContainer =>
			r.containerName !== null && r.containerName !== ''
	);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a rollout is currently in progress.
 */
export function isRolloutInProgress(): boolean {
	return rolloutState.inProgress;
}

/**
 * Get the current rollout status.
 * Returns a snapshot of the rollout state.
 */
export function getRolloutStatus(): RolloutState {
	return {
		...rolloutState,
		containerStatuses: [...rolloutState.containerStatuses],
		vpsStatuses: [...rolloutState.containerStatuses],
		totalVPSs: rolloutState.totalContainers, // Legacy compat
	} as RolloutState & { totalVPSs: number };
}

/**
 * Start a gradual rollout across all active containers.
 *
 * Runs fire-and-forget -- the caller kicks it off, then polls
 * getRolloutStatus() for progress.
 *
 * @param image Optional target image. If not specified, orchestrator uses latest.
 * @throws Error if a rollout is already in progress
 */
export async function startRollout(image?: string): Promise<void> {
	if (rolloutState.inProgress) {
		throw new Error('Rollout already in progress');
	}

	try {
		// Query all updatable containers
		const allContainers = await getUpdatableContainers();

		if (allContainers.length === 0) {
			console.log('[rollout] No active containers to update');
			rolloutState = {
				...createIdleState(),
				stage: 'completed',
				completedAt: new Date(),
				error: 'No active containers to update'
			};
			return;
		}

		// Shuffle for random stage distribution
		shuffleArray(allContainers);

		// Initialize rollout state
		rolloutState = {
			inProgress: true,
			stage: 'stage_10',
			startedAt: new Date(),
			completedAt: null,
			totalContainers: allContainers.length,
			updatedCount: 0,
			failedCount: 0,
			rolledBackCount: 0,
			currentStageProgress: 0,
			error: null,
			containerStatuses: allContainers.map((c) => ({
				userId: c.userId,
				email: c.email,
				containerName: c.containerName,
				status: 'pending',
				previousImage: null,
				newImage: null,
				error: null
			})),
			get vpsStatuses() { return this.containerStatuses; }
		};

		console.log(
			`[rollout] Starting rollout for ${allContainers.length} container${allContainers.length === 1 ? '' : 's'}`
		);

		let processedCount = 0;

		for (let stageIdx = 0; stageIdx < ROLLOUT_STAGES.length; stageIdx++) {
			const stageFraction = ROLLOUT_STAGES[stageIdx];
			const stageName = STAGE_NAMES[stageIdx];

			// Calculate containers for this stage (cumulative)
			const cumulativeTarget = Math.max(1, Math.ceil(allContainers.length * stageFraction));
			const stageContainers = allContainers.slice(processedCount, cumulativeTarget);

			if (stageContainers.length === 0) {
				continue;
			}

			rolloutState.stage = stageName;
			rolloutState.currentStageProgress = 0;

			console.log(
				`[rollout] Stage ${stageName}: updating ${stageContainers.length} container${stageContainers.length === 1 ? '' : 's'} (${processedCount + stageContainers.length}/${allContainers.length} cumulative)`
			);

			let stageCompleted = 0;
			let stageFailures = 0;

			// Process this stage's containers via orchestrator
			await processInBatches(stageContainers, CONCURRENCY_LIMIT, async (container) => {
				const statusIdx = rolloutState.containerStatuses.findIndex(
					(s) => s.userId === container.userId
				);

				if (statusIdx !== -1) {
					rolloutState.containerStatuses[statusIdx].status = 'updating';
				}

				try {
					const response = await orchestrator.updateContainer(container.userId, image);
					const result = response.result;

					stageCompleted++;

					if (statusIdx !== -1) {
						rolloutState.containerStatuses[statusIdx].previousImage = result.previousImage;
						rolloutState.containerStatuses[statusIdx].newImage = result.newImage;

						if (result.success) {
							rolloutState.containerStatuses[statusIdx].status = 'success';
							rolloutState.updatedCount++;
						} else {
							rolloutState.containerStatuses[statusIdx].status = result.rolledBack
								? 'rolled_back'
								: 'failed';
							rolloutState.containerStatuses[statusIdx].error = result.error ?? null;

							if (result.rolledBack) {
								rolloutState.rolledBackCount++;
							}
							rolloutState.failedCount++;
							stageFailures++;
						}
					}
				} catch (err) {
					stageCompleted++;
					const errorMsg = err instanceof Error ? err.message : String(err);

					if (statusIdx !== -1) {
						rolloutState.containerStatuses[statusIdx].status = 'failed';
						rolloutState.containerStatuses[statusIdx].error = errorMsg;
					}

					rolloutState.failedCount++;
					stageFailures++;
				}

				rolloutState.currentStageProgress = Math.round(
					(stageCompleted / stageContainers.length) * 100
				);
			});

			processedCount = cumulativeTarget;

			// Check failure threshold
			const failureRate =
				stageContainers.length > 0 ? stageFailures / stageContainers.length : 0;

			if (failureRate > STAGE_FAILURE_THRESHOLD) {
				console.error(
					`[rollout] Stage ${stageName}: failure rate ${(failureRate * 100).toFixed(0)}% exceeds threshold ${(STAGE_FAILURE_THRESHOLD * 100).toFixed(0)}%. Halting rollout.`
				);

				// Mark remaining containers as skipped
				for (let i = processedCount; i < allContainers.length; i++) {
					const skipIdx = rolloutState.containerStatuses.findIndex(
						(s) => s.userId === allContainers[i].userId
					);
					if (skipIdx !== -1) {
						rolloutState.containerStatuses[skipIdx].status = 'skipped';
					}
				}

				rolloutState.stage = 'halted';
				rolloutState.completedAt = new Date();
				rolloutState.inProgress = false;
				rolloutState.error = `Halted at ${stageName}: ${(failureRate * 100).toFixed(0)}% failure rate exceeds ${(STAGE_FAILURE_THRESHOLD * 100).toFixed(0)}% threshold`;

				return;
			}

			console.log(
				`[rollout] Stage ${stageName} completed (${stageFailures} failures out of ${stageContainers.length})`
			);

			// Inter-stage delay (except after last stage)
			if (stageIdx < ROLLOUT_STAGES.length - 1 && processedCount < allContainers.length) {
				console.log(
					`[rollout] Waiting ${INTER_STAGE_DELAY_MS / 1000}s before next stage`
				);
				await sleep(INTER_STAGE_DELAY_MS);
			}
		}

		// All stages completed
		rolloutState.stage = 'completed';
		rolloutState.completedAt = new Date();
		rolloutState.inProgress = false;
		rolloutState.currentStageProgress = 100;

		console.log(
			`[rollout] Rollout completed: ${rolloutState.updatedCount} updated, ${rolloutState.failedCount} failed, ${rolloutState.rolledBackCount} rolled back`
		);
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[rollout] Rollout failed: ${errorMsg}`);

		rolloutState.stage = 'failed';
		rolloutState.completedAt = new Date();
		rolloutState.inProgress = false;
		rolloutState.error = errorMsg;
	}
}
