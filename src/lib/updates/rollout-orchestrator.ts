/**
 * Gradual rollout orchestrator for Rachel8 fleet updates.
 *
 * Deploys updates across all active VPSs in three stages:
 *   Stage 1: 10% of VPSs (canary)
 *   Stage 2: 50% of VPSs (early majority)
 *   Stage 3: 100% of VPSs (full fleet)
 *
 * Between each stage, checks the failure rate. If more than 30% of a
 * stage's VPSs fail, the rollout halts automatically.
 *
 * Only one rollout can run at a time. Admin polls getRolloutStatus()
 * for real-time progress.
 *
 * @module updates/rollout-orchestrator
 */

import { updateVPS } from './update-engine';
import { db } from '$lib/db';
import { subscriptions, users } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptToken } from '$lib/crypto/encryption';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Rollout stages: fraction of total VPSs to update in each stage. */
const ROLLOUT_STAGES = [0.1, 0.5, 1.0];

/** Stage names for human-readable status. */
const STAGE_NAMES: Record<number, RolloutStage> = {
	0: 'stage_10',
	1: 'stage_50',
	2: 'stage_100'
};

/** Halt rollout if more than 30% of a stage's VPSs fail. */
const STAGE_FAILURE_THRESHOLD = 0.3;

/** Maximum concurrent SSH connections during rollout. */
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

/** Per-VPS update tracking during rollout. */
export interface VPSUpdateStatus {
	userId: string;
	email: string;
	ipAddress: string;
	status: 'pending' | 'updating' | 'success' | 'failed' | 'rolled_back' | 'skipped';
	previousVersion: string | null;
	newVersion: string | null;
	error: string | null;
}

/** Overall rollout state, returned by getRolloutStatus(). */
export interface RolloutState {
	inProgress: boolean;
	stage: RolloutStage;
	startedAt: Date | null;
	completedAt: Date | null;
	totalVPSs: number;
	updatedCount: number;
	failedCount: number;
	rolledBackCount: number;
	currentStageProgress: number;
	error: string | null;
	vpsStatuses: VPSUpdateStatus[];
}

// ---------------------------------------------------------------------------
// Module state (in-memory singleton)
// ---------------------------------------------------------------------------

let rolloutState: RolloutState = createIdleState();

function createIdleState(): RolloutState {
	return {
		inProgress: false,
		stage: 'idle',
		startedAt: null,
		completedAt: null,
		totalVPSs: 0,
		updatedCount: 0,
		failedCount: 0,
		rolledBackCount: 0,
		currentStageProgress: 0,
		error: null,
		vpsStatuses: []
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shuffle an array in-place using Fisher-Yates algorithm.
 * Random distribution ensures no bias in which VPSs are in the canary group.
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
 * Uses Promise.allSettled so one failure doesn't abort the batch.
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
// Internal: VPS query
// ---------------------------------------------------------------------------

interface UpdatableVPS {
	userId: string;
	email: string;
	vpsIpAddress: string;
	sshPrivateKey: string;
}

/**
 * Query all active, provisioned VPSs eligible for updates.
 */
async function getUpdatableVPSs(): Promise<UpdatableVPS[]> {
	const results = await db
		.select({
			userId: subscriptions.userId,
			email: users.email,
			vpsIpAddress: subscriptions.vpsIpAddress,
			sshPrivateKey: subscriptions.sshPrivateKey
		})
		.from(subscriptions)
		.innerJoin(users, eq(subscriptions.userId, users.id))
		.where(
			and(
				eq(subscriptions.status, 'active'),
				eq(subscriptions.vpsProvisioned, true),
				eq(subscriptions.provisioningStatus, 'ready')
			)
		);

	return results.filter(
		(r): r is UpdatableVPS =>
			r.vpsIpAddress !== null &&
			r.vpsIpAddress !== '' &&
			r.sshPrivateKey !== null &&
			r.sshPrivateKey !== ''
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
 * Returns a snapshot (clone) of the rollout state.
 */
export function getRolloutStatus(): RolloutState {
	return { ...rolloutState, vpsStatuses: [...rolloutState.vpsStatuses] };
}

/**
 * Start a gradual rollout across all active VPSs.
 *
 * Runs fire-and-forget -- the caller kicks it off, then polls
 * getRolloutStatus() for progress.
 *
 * @throws Error if a rollout is already in progress
 */
export async function startRollout(): Promise<void> {
	if (rolloutState.inProgress) {
		throw new Error('Rollout already in progress');
	}

	try {
		// Query all updatable VPSs
		const allVPSs = await getUpdatableVPSs();

		if (allVPSs.length === 0) {
			console.log('[rollout] No active VPSs to update');
			rolloutState = {
				...createIdleState(),
				stage: 'completed',
				completedAt: new Date(),
				error: 'No active VPSs to update'
			};
			return;
		}

		// Shuffle for random stage distribution
		shuffleArray(allVPSs);

		// Initialize rollout state
		rolloutState = {
			inProgress: true,
			stage: 'stage_10',
			startedAt: new Date(),
			completedAt: null,
			totalVPSs: allVPSs.length,
			updatedCount: 0,
			failedCount: 0,
			rolledBackCount: 0,
			currentStageProgress: 0,
			error: null,
			vpsStatuses: allVPSs.map((vps) => ({
				userId: vps.userId,
				email: vps.email,
				ipAddress: vps.vpsIpAddress,
				status: 'pending',
				previousVersion: null,
				newVersion: null,
				error: null
			}))
		};

		console.log(
			`[rollout] Starting rollout for ${allVPSs.length} VPS${allVPSs.length === 1 ? '' : 's'}`
		);

		// Track how many VPSs have been processed across stages
		let processedCount = 0;

		for (let stageIdx = 0; stageIdx < ROLLOUT_STAGES.length; stageIdx++) {
			const stageFraction = ROLLOUT_STAGES[stageIdx];
			const stageName = STAGE_NAMES[stageIdx];

			// Calculate VPSs for this stage (cumulative)
			const cumulativeTarget = Math.max(1, Math.ceil(allVPSs.length * stageFraction));
			const stageVPSs = allVPSs.slice(processedCount, cumulativeTarget);

			if (stageVPSs.length === 0) {
				continue;
			}

			rolloutState.stage = stageName;
			rolloutState.currentStageProgress = 0;

			console.log(
				`[rollout] Stage ${stageName}: updating ${stageVPSs.length} VPS${stageVPSs.length === 1 ? '' : 's'} (${processedCount + stageVPSs.length}/${allVPSs.length} cumulative)`
			);

			let stageCompleted = 0;
			let stageFailures = 0;

			// Process this stage's VPSs with concurrency limit
			await processInBatches(stageVPSs, CONCURRENCY_LIMIT, async (vps) => {
				const statusIdx = rolloutState.vpsStatuses.findIndex(
					(s) => s.userId === vps.userId
				);

				if (statusIdx !== -1) {
					rolloutState.vpsStatuses[statusIdx].status = 'updating';
				}

				const result = await updateVPS(
					vps.vpsIpAddress,
					decryptToken(vps.sshPrivateKey),
					vps.userId
				);

				stageCompleted++;

				if (statusIdx !== -1) {
					rolloutState.vpsStatuses[statusIdx].previousVersion =
						result.previousVersion;
					rolloutState.vpsStatuses[statusIdx].newVersion = result.newVersion;

					if (result.success) {
						rolloutState.vpsStatuses[statusIdx].status = 'success';
						rolloutState.updatedCount++;
					} else {
						// Check if it was rolled back or just failed
						const hasRolledBack = result.error?.includes('Rollback succeeded');
						rolloutState.vpsStatuses[statusIdx].status = hasRolledBack
							? 'rolled_back'
							: 'failed';
						rolloutState.vpsStatuses[statusIdx].error = result.error ?? null;

						if (hasRolledBack) {
							rolloutState.rolledBackCount++;
						}
						rolloutState.failedCount++;
						stageFailures++;
					}
				}

				rolloutState.currentStageProgress = Math.round(
					(stageCompleted / stageVPSs.length) * 100
				);
			});

			processedCount = cumulativeTarget;

			// Check failure threshold
			const failureRate =
				stageVPSs.length > 0 ? stageFailures / stageVPSs.length : 0;

			if (failureRate > STAGE_FAILURE_THRESHOLD) {
				console.error(
					`[rollout] Stage ${stageName}: failure rate ${(failureRate * 100).toFixed(0)}% exceeds threshold ${(STAGE_FAILURE_THRESHOLD * 100).toFixed(0)}%. Halting rollout.`
				);

				// Mark remaining VPSs as skipped
				for (let i = processedCount; i < allVPSs.length; i++) {
					const skipIdx = rolloutState.vpsStatuses.findIndex(
						(s) => s.userId === allVPSs[i].userId
					);
					if (skipIdx !== -1) {
						rolloutState.vpsStatuses[skipIdx].status = 'skipped';
					}
				}

				rolloutState.stage = 'halted';
				rolloutState.completedAt = new Date();
				rolloutState.inProgress = false;
				rolloutState.error = `Halted at ${stageName}: ${(failureRate * 100).toFixed(0)}% failure rate exceeds ${(STAGE_FAILURE_THRESHOLD * 100).toFixed(0)}% threshold`;

				return;
			}

			console.log(
				`[rollout] Stage ${stageName} completed (${stageFailures} failures out of ${stageVPSs.length})`
			);

			// Inter-stage delay (except after last stage)
			if (stageIdx < ROLLOUT_STAGES.length - 1 && processedCount < allVPSs.length) {
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
