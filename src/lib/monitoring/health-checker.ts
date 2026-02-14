/**
 * Health check sweep service for monitoring user VPS instances.
 *
 * Runs a background cron job every 60 seconds that:
 * 1. Queries all active, provisioned VPSs from the database
 * 2. SSH-checks each VPS to verify the rachel8 service is running
 * 3. Attempts auto-restart for unhealthy services (if circuit breaker allows)
 * 4. Persists health state (including circuit breaker) to the database
 *
 * Concurrency is limited to 5 parallel SSH connections to avoid storms.
 * A sweep-in-progress guard prevents overlapping sweeps.
 *
 * @module health-checker
 */

import schedule from 'node-schedule';
import { db } from '$lib/db';
import { healthChecks, subscriptions, users } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { execSSHCommand } from '$lib/provisioning/ssh-exec';
import { restartRachelService } from '$lib/provisioning/vps-status';
import { decryptToken } from '$lib/crypto/encryption';
import {
	getStateAfterFailure,
	getStateAfterSuccess,
	getEffectiveCircuitState,
	shouldAttemptRestart,
	type CircuitBreakerInput
} from './circuit-breaker';
import {
	sendInstanceDownEmail,
	sendInstanceRecoveredEmail,
	sendCircuitBreakerAlert
} from './health-notifications';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cron expression: every 60 seconds. */
const SWEEP_CRON = '*/1 * * * *';

/** Maximum concurrent SSH connections per sweep. */
const CONCURRENCY_LIMIT = 5;

/** SSH connect timeout for health checks (10 seconds). */
const HEALTH_CHECK_CONNECT_TIMEOUT_MS = 10_000;

/** SSH command timeout for health checks (10 seconds). */
const HEALTH_CHECK_COMMAND_TIMEOUT_MS = 10_000;

/** Minimum interval between same notification type per user (5 minutes). */
const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let sweepInProgress = false;
let scheduledJob: schedule.Job | null = null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveVPS {
	userId: string;
	vpsIpAddress: string;
	sshPrivateKey: string;
	userEmail: string;
	userName: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the health monitor background job.
 * Schedules a sweep every 60 seconds via node-schedule.
 * Safe to call multiple times -- subsequent calls are no-ops.
 */
export function startHealthMonitor(): void {
	if (scheduledJob) {
		console.log('[health-checker] Health monitor already running, skipping duplicate start');
		return;
	}

	scheduledJob = schedule.scheduleJob('health-sweep', SWEEP_CRON, async () => {
		try {
			await runHealthSweep();
		} catch (error) {
			console.error('[health-checker] Unhandled error in health sweep:', error);
		}
	});

	console.log('[health-checker] Health monitor started (every 60s)');
}

/**
 * Stop the health monitor background job.
 * Cancels the scheduled cron job. Safe to call if not running.
 */
export function stopHealthMonitor(): void {
	if (scheduledJob) {
		scheduledJob.cancel();
		scheduledJob = null;
		console.log('[health-checker] Health monitor stopped');
	}
}

/**
 * Run a single health check sweep across all active VPSs.
 * Exposed for testing -- normally called by the cron job.
 */
export async function runHealthSweep(): Promise<void> {
	if (sweepInProgress) {
		console.log('[health-checker] Sweep already in progress, skipping');
		return;
	}

	sweepInProgress = true;
	const sweepStart = Date.now();

	try {
		// Query all active, provisioned VPSs
		const activeVPSs = await getActiveVPSs();

		if (activeVPSs.length === 0) {
			console.log('[health-checker] Sweep started: 0 active VPSs');
			return;
		}

		console.log(`[health-checker] Sweep started: ${activeVPSs.length} active VPS${activeVPSs.length === 1 ? '' : 's'}`);

		let healthyCount = 0;
		let unhealthyCount = 0;

		// Process VPSs in batches with concurrency limit
		await processInBatches(activeVPSs, CONCURRENCY_LIMIT, async (vps) => {
			const isHealthy = await checkAndRecoverVPS(vps);
			if (isHealthy) {
				healthyCount++;
			} else {
				unhealthyCount++;
			}
		});

		const duration = ((Date.now() - sweepStart) / 1000).toFixed(1);
		console.log(
			`[health-checker] Sweep completed in ${duration}s (${activeVPSs.length} checked, ${healthyCount} healthy, ${unhealthyCount} unhealthy)`
		);
	} finally {
		sweepInProgress = false;
	}
}

// ---------------------------------------------------------------------------
// Internal: VPS query
// ---------------------------------------------------------------------------

/**
 * Query all active, provisioned VPSs that should be health-checked.
 */
async function getActiveVPSs(): Promise<ActiveVPS[]> {
	const results = await db
		.select({
			userId: subscriptions.userId,
			vpsIpAddress: subscriptions.vpsIpAddress,
			sshPrivateKey: subscriptions.sshPrivateKey,
			userEmail: users.email,
			userName: users.name
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

	// Filter out any records with missing IP or SSH key
	return results.filter(
		(r): r is ActiveVPS =>
			r.vpsIpAddress !== null &&
			r.vpsIpAddress !== '' &&
			r.sshPrivateKey !== null &&
			r.sshPrivateKey !== ''
	);
}

// ---------------------------------------------------------------------------
// Internal: Per-VPS check and recovery
// ---------------------------------------------------------------------------

/**
 * Check a single VPS health and attempt recovery if needed.
 * Returns true if the VPS is healthy after the check.
 */
async function checkAndRecoverVPS(vps: ActiveVPS): Promise<boolean> {
	// Load or initialize health check record
	let healthRecord = await db.query.healthChecks.findFirst({
		where: eq(healthChecks.userId, vps.userId)
	});

	const now = new Date();

	// Try the SSH health check
	let sshSucceeded = false;
	let serviceActive = false;
	let sshError: string | null = null;

	try {
		const result = await execSSHCommand({
			host: vps.vpsIpAddress,
			privateKey: decryptToken(vps.sshPrivateKey),
			command: 'sudo systemctl is-active rachel8',
			connectTimeoutMs: HEALTH_CHECK_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: HEALTH_CHECK_COMMAND_TIMEOUT_MS
		});
		sshSucceeded = true;
		serviceActive = result.exitCode === 0 && result.stdout.trim() === 'active';
	} catch (error) {
		sshError = error instanceof Error ? error.message : String(error);
	}

	// Build circuit breaker input from current record
	const cbInput: CircuitBreakerInput = {
		circuitState: (healthRecord?.circuitState as CircuitBreakerInput['circuitState']) ?? 'closed',
		consecutiveFailures: healthRecord?.consecutiveFailures ?? 0,
		circuitOpenedAt: healthRecord?.circuitOpenedAt ?? null
	};

	const effectiveState = getEffectiveCircuitState(cbInput);
	const totalChecks = (healthRecord?.totalChecks ?? 0) + 1;

	if (sshSucceeded && serviceActive) {
		// --- HEALTHY ---
		const afterSuccess = getStateAfterSuccess({
			...cbInput,
			circuitState: effectiveState
		});

		// Send recovery notification if previously notified user of downtime
		const recoveryUpdate: HealthCheckUpdate = {
			status: 'healthy',
			consecutiveFailures: afterSuccess.consecutiveFailures,
			circuitState: afterSuccess.circuitState,
			circuitOpenedAt: afterSuccess.circuitOpenedAt,
			lastCheckAt: now,
			lastHealthyAt: now,
			lastError: null,
			totalChecks,
			totalRecoveries: afterSuccess.recovered
				? (healthRecord?.totalRecoveries ?? 0) + 1
				: (healthRecord?.totalRecoveries ?? 0)
		};

		if (afterSuccess.recovered && healthRecord?.lastNotifiedDownAt) {
			// Only send recovery email if we previously told user their instance was down
			const downtimeMs = now.getTime() - (healthRecord.lastFailureAt?.getTime() ?? now.getTime());
			const downtimeMinutes = Math.round(downtimeMs / 60_000);

			recoveryUpdate.lastNotifiedUpAt = now;

			// Fire-and-forget: email failure must not break health monitoring
			sendInstanceRecoveredEmail(vps.userEmail, vps.userName || 'there', downtimeMinutes).catch(() => {});
			console.log(`[health-checker] ${vps.userId}: recovered, sending recovery email (downtime ~${downtimeMinutes}m)`);
		}

		await upsertHealthCheck(vps.userId, recoveryUpdate);

		if (afterSuccess.recovered) {
			console.log(`[health-checker] ${vps.userId}: recovered (check #${totalChecks})`);
		} else {
			console.log(`[health-checker] ${vps.userId}: healthy (check #${totalChecks})`);
		}

		return true;
	}

	// --- UNHEALTHY ---
	const totalFailures = (healthRecord?.totalFailures ?? 0) + 1;
	const errorMsg = sshError ?? 'Service not active';

	// If SSH failed entirely, mark unhealthy but do NOT attempt restart
	// (the VPS itself may be unreachable -- restart won't help)
	if (!sshSucceeded) {
		const afterFailure = getStateAfterFailure({
			...cbInput,
			circuitState: effectiveState
		});

		const displayStatus: HealthStatus = afterFailure.circuitState === 'open' ? 'circuit_open' : 'down';

		const sshFailUpdate: HealthCheckUpdate = {
			status: displayStatus,
			consecutiveFailures: afterFailure.consecutiveFailures,
			circuitState: afterFailure.circuitState,
			circuitOpenedAt: afterFailure.circuitOpenedAt,
			lastCheckAt: now,
			lastFailureAt: now,
			lastError: errorMsg,
			totalChecks,
			totalFailures
		};

		// Send down notification on first failure (transition from healthy)
		if (cbInput.consecutiveFailures === 0 && canSendDownNotification(healthRecord?.lastNotifiedDownAt ?? null)) {
			sshFailUpdate.lastNotifiedDownAt = now;
			sendInstanceDownEmail(vps.userEmail, vps.userName || 'there').catch(() => {});
			console.log(`[health-checker] ${vps.userId}: sending instance down email (SSH unreachable)`);
		}

		// Send circuit breaker alert to admin when circuit trips
		if (afterFailure.tripped) {
			const adminEmail = process.env.ADMIN_EMAIL;
			if (adminEmail) {
				sendCircuitBreakerAlert(
					adminEmail, vps.userId, vps.userEmail,
					vps.vpsIpAddress, afterFailure.consecutiveFailures, errorMsg
				).catch(() => {});
			}
			console.log(
				`[health-checker] ${vps.userId}: circuit breaker TRIPPED (${afterFailure.consecutiveFailures} consecutive failures, SSH unreachable)`
			);
		} else {
			console.log(
				`[health-checker] ${vps.userId}: unreachable (consecutive: ${afterFailure.consecutiveFailures})`
			);
		}

		await upsertHealthCheck(vps.userId, sshFailUpdate);

		return false;
	}

	// SSH succeeded but service is not active -- attempt restart if circuit allows
	const canRestart = shouldAttemptRestart({
		...cbInput,
		circuitState: effectiveState
	});

	if (canRestart) {
		console.log(
			`[health-checker] ${vps.userId}: unhealthy (consecutive: ${cbInput.consecutiveFailures + 1}, attempting restart)`
		);

		const restartResult = await restartRachelService(vps.vpsIpAddress, vps.sshPrivateKey);

		if (restartResult.success) {
			// Restart succeeded -- mark as healthy
			const afterSuccess = getStateAfterSuccess({
				...cbInput,
				circuitState: effectiveState
			});

			const restartSuccessUpdate: HealthCheckUpdate = {
				status: 'healthy',
				consecutiveFailures: afterSuccess.consecutiveFailures,
				circuitState: afterSuccess.circuitState,
				circuitOpenedAt: afterSuccess.circuitOpenedAt,
				lastCheckAt: now,
				lastHealthyAt: now,
				lastRestartAttemptAt: now,
				lastError: null,
				totalChecks,
				totalFailures,
				totalRecoveries: (healthRecord?.totalRecoveries ?? 0) + 1
			};

			// If user was previously notified of downtime, send recovery email
			if (healthRecord?.lastNotifiedDownAt) {
				const downtimeMs = now.getTime() - (healthRecord.lastFailureAt?.getTime() ?? now.getTime());
				const downtimeMinutes = Math.round(downtimeMs / 60_000);
				restartSuccessUpdate.lastNotifiedUpAt = now;
				sendInstanceRecoveredEmail(vps.userEmail, vps.userName || 'there', downtimeMinutes).catch(() => {});
				console.log(`[health-checker] ${vps.userId}: restart successful, sending recovery email (downtime ~${downtimeMinutes}m)`);
			}

			await upsertHealthCheck(vps.userId, restartSuccessUpdate);

			console.log(`[health-checker] ${vps.userId}: restart successful, marking healthy`);
			return true;
		}

		// Restart failed
		const afterFailure = getStateAfterFailure({
			...cbInput,
			circuitState: effectiveState
		});

		const displayStatus: HealthStatus = afterFailure.circuitState === 'open' ? 'circuit_open' : 'unhealthy';

		const restartFailUpdate: HealthCheckUpdate = {
			status: displayStatus,
			consecutiveFailures: afterFailure.consecutiveFailures,
			circuitState: afterFailure.circuitState,
			circuitOpenedAt: afterFailure.circuitOpenedAt,
			lastCheckAt: now,
			lastFailureAt: now,
			lastRestartAttemptAt: now,
			lastError: restartResult.message,
			totalChecks,
			totalFailures
		};

		// Send down notification on first failure (restart attempted and failed)
		if (cbInput.consecutiveFailures === 0 && canSendDownNotification(healthRecord?.lastNotifiedDownAt ?? null)) {
			restartFailUpdate.lastNotifiedDownAt = now;
			sendInstanceDownEmail(vps.userEmail, vps.userName || 'there').catch(() => {});
			console.log(`[health-checker] ${vps.userId}: sending instance down email (restart failed)`);
		}

		// Send circuit breaker alert to admin when circuit trips
		if (afterFailure.tripped) {
			const adminEmail = process.env.ADMIN_EMAIL;
			if (adminEmail) {
				sendCircuitBreakerAlert(
					adminEmail, vps.userId, vps.userEmail,
					vps.vpsIpAddress, afterFailure.consecutiveFailures, restartResult.message
				).catch(() => {});
			}
			console.log(
				`[health-checker] ${vps.userId}: circuit breaker TRIPPED (${afterFailure.consecutiveFailures} consecutive failures)`
			);
		} else {
			console.log(
				`[health-checker] ${vps.userId}: restart failed (consecutive: ${afterFailure.consecutiveFailures})`
			);
		}

		await upsertHealthCheck(vps.userId, restartFailUpdate);

		return false;
	}

	// Circuit breaker is open -- skip restart
	await upsertHealthCheck(vps.userId, {
		status: 'circuit_open',
		lastCheckAt: now,
		lastError: errorMsg,
		totalChecks,
		totalFailures
	});

	console.log(
		`[health-checker] ${vps.userId}: circuit open, skipping restart (consecutive: ${cbInput.consecutiveFailures})`
	);

	return false;
}

// ---------------------------------------------------------------------------
// Internal: DB persistence (upsert)
// ---------------------------------------------------------------------------

/** Valid health status values. */
type HealthStatus = 'healthy' | 'unhealthy' | 'down' | 'circuit_open';

/** Valid circuit state values. */
type CircuitStateValue = 'closed' | 'open' | 'half_open';

/** Fields that can be updated in a health check upsert. */
interface HealthCheckUpdate {
	status?: HealthStatus;
	consecutiveFailures?: number;
	circuitState?: CircuitStateValue;
	circuitOpenedAt?: Date | null;
	lastCheckAt?: Date;
	lastHealthyAt?: Date;
	lastFailureAt?: Date;
	lastRestartAttemptAt?: Date;
	lastNotifiedDownAt?: Date;
	lastNotifiedUpAt?: Date;
	lastError?: string | null;
	totalChecks?: number;
	totalFailures?: number;
	totalRecoveries?: number;
}

/**
 * Upsert a health check record -- insert if none exists, update otherwise.
 */
async function upsertHealthCheck(userId: string, updates: HealthCheckUpdate): Promise<void> {
	const now = new Date();

	const status: HealthStatus = updates.status ?? 'healthy';
	const circuitState: CircuitStateValue = updates.circuitState ?? 'closed';

	await db
		.insert(healthChecks)
		.values({
			id: randomUUID(),
			userId,
			status,
			consecutiveFailures: updates.consecutiveFailures ?? 0,
			circuitState,
			circuitOpenedAt: updates.circuitOpenedAt ?? undefined,
			lastCheckAt: updates.lastCheckAt ?? now,
			lastHealthyAt: updates.lastHealthyAt ?? undefined,
			lastFailureAt: updates.lastFailureAt ?? undefined,
			lastRestartAttemptAt: updates.lastRestartAttemptAt ?? undefined,
			lastNotifiedDownAt: updates.lastNotifiedDownAt ?? undefined,
			lastNotifiedUpAt: updates.lastNotifiedUpAt ?? undefined,
			lastError: updates.lastError ?? undefined,
			totalChecks: updates.totalChecks ?? 1,
			totalFailures: updates.totalFailures ?? 0,
			totalRecoveries: updates.totalRecoveries ?? 0,
			createdAt: now,
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: healthChecks.userId,
			set: {
				...(updates.status !== undefined && { status }),
				...(updates.consecutiveFailures !== undefined && {
					consecutiveFailures: updates.consecutiveFailures
				}),
				...(updates.circuitState !== undefined && { circuitState }),
				...(updates.circuitOpenedAt !== undefined && {
					circuitOpenedAt: updates.circuitOpenedAt
				}),
				...(updates.lastCheckAt !== undefined && { lastCheckAt: updates.lastCheckAt }),
				...(updates.lastHealthyAt !== undefined && { lastHealthyAt: updates.lastHealthyAt }),
				...(updates.lastFailureAt !== undefined && { lastFailureAt: updates.lastFailureAt }),
				...(updates.lastRestartAttemptAt !== undefined && {
					lastRestartAttemptAt: updates.lastRestartAttemptAt
				}),
				...(updates.lastNotifiedDownAt !== undefined && {
					lastNotifiedDownAt: updates.lastNotifiedDownAt
				}),
				...(updates.lastNotifiedUpAt !== undefined && {
					lastNotifiedUpAt: updates.lastNotifiedUpAt
				}),
				...(updates.lastError !== undefined && { lastError: updates.lastError }),
				...(updates.totalChecks !== undefined && { totalChecks: updates.totalChecks }),
				...(updates.totalFailures !== undefined && { totalFailures: updates.totalFailures }),
				...(updates.totalRecoveries !== undefined && {
					totalRecoveries: updates.totalRecoveries
				}),
				updatedAt: now
			}
		});
}

// ---------------------------------------------------------------------------
// Internal: Notification spam guard
// ---------------------------------------------------------------------------

/**
 * Check if enough time has elapsed to send another "down" notification.
 * Returns true if lastNotifiedDownAt is null or older than NOTIFICATION_COOLDOWN_MS.
 */
function canSendDownNotification(lastNotifiedDownAt: Date | null): boolean {
	if (!lastNotifiedDownAt) return true;
	return Date.now() - lastNotifiedDownAt.getTime() >= NOTIFICATION_COOLDOWN_MS;
}

// ---------------------------------------------------------------------------
// Internal: Batch processing with concurrency limit
// ---------------------------------------------------------------------------

/**
 * Process items in parallel batches with a concurrency limit.
 * Uses Promise.allSettled so one failure doesn't abort the entire batch.
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
