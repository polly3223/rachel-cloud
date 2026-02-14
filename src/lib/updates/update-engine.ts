/**
 * Per-VPS update engine for Rachel8 deployments.
 *
 * Handles the atomic update/rollback cycle for a single VPS:
 *   1. Capture current version (git commit hash)
 *   2. Pull latest code from GitHub
 *   3. Install dependencies
 *   4. Restart the rachel8 systemd service
 *   5. Verify service is running
 *   6. Persist new version to DB
 *
 * On any failure, automatically rolls back to the previous commit hash.
 *
 * @module updates/update-engine
 */

import { execSSHCommand } from '$lib/provisioning/ssh-exec';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** SSH connect timeout for update operations (30s, longer than health check's 10s). */
const UPDATE_CONNECT_TIMEOUT_MS = 30_000;

/** SSH command timeout for quick commands like git rev-parse (30s). */
const QUICK_COMMAND_TIMEOUT_MS = 30_000;

/** SSH command timeout for git pull (60s). */
const GIT_PULL_TIMEOUT_MS = 60_000;

/** SSH command timeout for bun install (120s, can be slow). */
const BUN_INSTALL_TIMEOUT_MS = 120_000;

/** Time to wait after restarting the service before verification (5s). */
const SERVICE_STARTUP_WAIT_MS = 5_000;

/** Directory where Rachel8 is cloned on user VPSs. */
const RACHEL_DIR = '/home/rachel/rachel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of an update or rollback operation. */
export interface UpdateResult {
	success: boolean;
	previousVersion: string | null;
	newVersion: string | null;
	error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the current Rachel8 git commit hash from a VPS.
 *
 * @param host - VPS IP address
 * @param privateKey - Decrypted SSH private key
 * @returns Current commit hash, or null if unable to retrieve
 */
export async function getVPSVersion(
	host: string,
	privateKey: string
): Promise<string | null> {
	try {
		const result = await execSSHCommand({
			host,
			privateKey,
			command: `cd ${RACHEL_DIR} && git rev-parse HEAD`,
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: QUICK_COMMAND_TIMEOUT_MS
		});

		if (result.exitCode === 0 && result.stdout.trim()) {
			return result.stdout.trim();
		}

		return null;
	} catch (error) {
		console.error(
			`[update-engine] Failed to get version from ${host}:`,
			error instanceof Error ? error.message : error
		);
		return null;
	}
}

/**
 * Update a single VPS to the latest Rachel8 version.
 *
 * Performs: git pull -> bun install -> restart rachel8 -> verify.
 * On any failure, automatically rolls back to the previous commit hash.
 * Persists version state to the subscriptions table throughout.
 *
 * @param host - VPS IP address
 * @param privateKey - Decrypted SSH private key
 * @param userId - User ID for DB updates
 * @returns UpdateResult with success/failure and version info
 */
export async function updateVPS(
	host: string,
	privateKey: string,
	userId: string
): Promise<UpdateResult> {
	let previousVersion: string | null = null;

	try {
		// Step 1: Capture current version for rollback
		console.log(`[update-engine] ${host}: capturing current version`);
		previousVersion = await getVPSVersion(host, privateKey);

		if (!previousVersion) {
			console.warn(
				`[update-engine] ${host}: could not capture current version, proceeding anyway`
			);
		}

		// Step 2: Mark as updating in DB
		await db
			.update(subscriptions)
			.set({
				updateStatus: 'updating',
				targetVersion: null,
				updatedAt: new Date()
			})
			.where(eq(subscriptions.userId, userId));

		// Step 3: Pull latest code
		console.log(`[update-engine] ${host}: pulling latest code`);
		const pullResult = await execSSHCommand({
			host,
			privateKey,
			command: `cd ${RACHEL_DIR} && git pull origin main`,
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: GIT_PULL_TIMEOUT_MS
		});

		if (pullResult.exitCode !== 0) {
			throw new Error(
				`git pull failed (exit ${pullResult.exitCode}): ${pullResult.stderr || pullResult.stdout}`
			);
		}

		// Step 4: Install dependencies
		console.log(`[update-engine] ${host}: installing dependencies`);
		const installResult = await execSSHCommand({
			host,
			privateKey,
			command: `cd ${RACHEL_DIR} && bun install`,
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: BUN_INSTALL_TIMEOUT_MS
		});

		if (installResult.exitCode !== 0) {
			throw new Error(
				`bun install failed (exit ${installResult.exitCode}): ${installResult.stderr || installResult.stdout}`
			);
		}

		// Step 5: Restart service
		console.log(`[update-engine] ${host}: restarting rachel8 service`);
		const restartResult = await execSSHCommand({
			host,
			privateKey,
			command: 'sudo systemctl restart rachel8',
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: QUICK_COMMAND_TIMEOUT_MS
		});

		if (restartResult.exitCode !== 0) {
			throw new Error(
				`systemctl restart failed (exit ${restartResult.exitCode}): ${restartResult.stderr}`
			);
		}

		// Step 6: Wait for service startup
		console.log(
			`[update-engine] ${host}: waiting ${SERVICE_STARTUP_WAIT_MS}ms for service startup`
		);
		await sleep(SERVICE_STARTUP_WAIT_MS);

		// Step 7: Verify service is active
		console.log(`[update-engine] ${host}: verifying service is active`);
		const verifyResult = await execSSHCommand({
			host,
			privateKey,
			command: 'sudo systemctl is-active rachel8',
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: QUICK_COMMAND_TIMEOUT_MS
		});

		if (verifyResult.exitCode !== 0 || verifyResult.stdout.trim() !== 'active') {
			throw new Error(
				`Service verification failed: status="${verifyResult.stdout.trim()}" (expected "active")`
			);
		}

		// Step 8: Get new version
		const newVersion = await getVPSVersion(host, privateKey);

		// Step 9: Persist success to DB
		const now = new Date();
		await db
			.update(subscriptions)
			.set({
				currentVersion: newVersion,
				previousVersion: previousVersion,
				updateStatus: 'success',
				targetVersion: null,
				lastUpdateAt: now,
				updatedAt: now
			})
			.where(eq(subscriptions.userId, userId));

		console.log(
			`[update-engine] ${host}: update successful (${previousVersion?.slice(0, 7) ?? '???'} -> ${newVersion?.slice(0, 7) ?? '???'})`
		);

		return {
			success: true,
			previousVersion,
			newVersion
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[update-engine] ${host}: update failed: ${errorMsg}`);

		// Attempt rollback if we have a previous version
		if (previousVersion) {
			console.log(
				`[update-engine] ${host}: attempting rollback to ${previousVersion.slice(0, 7)}`
			);
			const rollbackResult = await rollbackVPS(host, privateKey, previousVersion);

			const rollbackStatus = rollbackResult.success ? 'rolled_back' : 'failed';
			await db
				.update(subscriptions)
				.set({
					updateStatus: rollbackStatus,
					currentVersion: rollbackResult.success ? previousVersion : undefined,
					updatedAt: new Date()
				})
				.where(eq(subscriptions.userId, userId));

			return {
				success: false,
				previousVersion,
				newVersion: null,
				error: `Update failed: ${errorMsg}. Rollback ${rollbackResult.success ? 'succeeded' : 'also failed: ' + rollbackResult.error}`
			};
		}

		// No previous version to rollback to
		await db
			.update(subscriptions)
			.set({
				updateStatus: 'failed',
				updatedAt: new Date()
			})
			.where(eq(subscriptions.userId, userId));

		return {
			success: false,
			previousVersion: null,
			newVersion: null,
			error: `Update failed (no rollback possible): ${errorMsg}`
		};
	}
}

/**
 * Rollback a VPS to a previous Rachel8 version.
 *
 * Performs: git checkout <hash> -> bun install -> restart -> verify.
 * Does NOT recurse on failure (prevents infinite rollback loops).
 *
 * @param host - VPS IP address
 * @param privateKey - Decrypted SSH private key
 * @param previousHash - Git commit hash to revert to
 * @returns UpdateResult with success/failure
 */
export async function rollbackVPS(
	host: string,
	privateKey: string,
	previousHash: string
): Promise<UpdateResult> {
	try {
		// Step 1: Checkout previous version
		console.log(
			`[update-engine] ${host}: rolling back to ${previousHash.slice(0, 7)}`
		);
		const checkoutResult = await execSSHCommand({
			host,
			privateKey,
			command: `cd ${RACHEL_DIR} && git checkout ${previousHash}`,
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: QUICK_COMMAND_TIMEOUT_MS
		});

		if (checkoutResult.exitCode !== 0) {
			throw new Error(
				`git checkout failed (exit ${checkoutResult.exitCode}): ${checkoutResult.stderr || checkoutResult.stdout}`
			);
		}

		// Step 2: Install dependencies (in case they changed)
		console.log(`[update-engine] ${host}: reinstalling dependencies for rollback`);
		const installResult = await execSSHCommand({
			host,
			privateKey,
			command: `cd ${RACHEL_DIR} && bun install`,
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: BUN_INSTALL_TIMEOUT_MS
		});

		if (installResult.exitCode !== 0) {
			throw new Error(
				`bun install during rollback failed (exit ${installResult.exitCode}): ${installResult.stderr || installResult.stdout}`
			);
		}

		// Step 3: Restart service
		console.log(`[update-engine] ${host}: restarting service after rollback`);
		const restartResult = await execSSHCommand({
			host,
			privateKey,
			command: 'sudo systemctl restart rachel8',
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: QUICK_COMMAND_TIMEOUT_MS
		});

		if (restartResult.exitCode !== 0) {
			throw new Error(
				`systemctl restart during rollback failed (exit ${restartResult.exitCode}): ${restartResult.stderr}`
			);
		}

		// Step 4: Wait for service startup
		await sleep(SERVICE_STARTUP_WAIT_MS);

		// Step 5: Verify service is active
		const verifyResult = await execSSHCommand({
			host,
			privateKey,
			command: 'sudo systemctl is-active rachel8',
			connectTimeoutMs: UPDATE_CONNECT_TIMEOUT_MS,
			commandTimeoutMs: QUICK_COMMAND_TIMEOUT_MS
		});

		if (verifyResult.exitCode !== 0 || verifyResult.stdout.trim() !== 'active') {
			throw new Error(
				`Service verification after rollback failed: status="${verifyResult.stdout.trim()}"`
			);
		}

		// Step 6: Verify version
		const currentVersion = await getVPSVersion(host, privateKey);

		console.log(
			`[update-engine] ${host}: rollback successful (now at ${currentVersion?.slice(0, 7) ?? '???'})`
		);

		return {
			success: true,
			previousVersion: previousHash,
			newVersion: currentVersion
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(
			`[update-engine] ${host}: rollback failed: ${errorMsg}`
		);

		// Do NOT recurse -- prevent infinite rollback loops
		return {
			success: false,
			previousVersion: previousHash,
			newVersion: null,
			error: errorMsg
		};
	}
}
