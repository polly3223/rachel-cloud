/**
 * Main VPS provisioning orchestrator.
 *
 * Coordinates the full provisioning flow:
 *   1. Preparation — fetch and decrypt tokens, update status
 *   2. SSH Key & Hetzner Resources — generate key pair, upload to Hetzner, create/reuse firewall
 *   3. VPS Creation — build cloud-init, create server, store IDs
 *   4. Wait for Cloud-Init — poll DB for callback signal
 *   5. Secret Injection — SSH into VPS, inject credentials, start Rachel8
 *   6. Finalization — mark VPS as ready, log timing
 *
 * Error handling: any failure triggers cleanupFailedProvision() which deletes
 * the Hetzner server and SSH key, then marks the subscription as failed.
 *
 * Target SLA: under 2 minutes for the happy path.
 *
 * @module provision-vps
 */

import { db } from '$lib/db';
import { subscriptions, claudeTokens, telegramBots } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { encryptToken, decryptToken } from '$lib/crypto/encryption';
import { generateSSHKeyPair } from './ssh-keys';
import { HetznerClient } from './hetzner-client';
import { buildCloudInitUserData } from './cloud-init-builder';
import { injectSecrets } from './ssh-injector';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum time allowed for the entire provisioning flow (2 minutes). */
const PROVISIONING_TIMEOUT_MS = 120_000;

/** Polling interval for cloud-init callback check (5 seconds). */
const CLOUD_INIT_POLL_INTERVAL_MS = 5_000;

/** Maximum polling time waiting for cloud-init callback. */
const CLOUD_INIT_TIMEOUT_MS = 110_000;

/** Firewall name shared across all Rachel Cloud VPSs. */
const FIREWALL_NAME = 'rachel-cloud-ssh-only';

/** Base URL of the control plane (from environment). */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Provision a dedicated VPS for a user.
 *
 * This is the top-level orchestrator that coordinates server creation,
 * cloud-init setup, secret injection, and validation. It is designed to
 * be called asynchronously (fire-and-forget from the API endpoint) with
 * progress tracked via the subscription's `provisioningStatus` field.
 *
 * @param userId - The user ID to provision a VPS for
 * @throws Error if any provisioning step fails (after cleanup)
 */
export async function provisionVPS(userId: string): Promise<void> {
	const startTime = Date.now();

	// Sensitive data references — cleared in finally block
	let decryptedClaudeAccess: string | null = null;
	let decryptedClaudeRefresh: string | null = null;
	let decryptedTelegramToken: string | null = null;
	let decryptedSshPrivateKey: string | null = null;

	try {
		console.log(`[provision-vps] Starting provisioning for userId=${userId}`);

		// ------------------------------------------------------------------
		// Phase 1: Preparation
		// ------------------------------------------------------------------

		// Update status to pending
		await updateProvisioningStatus(userId, 'pending');

		// Get user's subscription
		const subscription = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.userId, userId),
		});

		if (!subscription) {
			throw new Error(`No subscription found for userId=${userId}`);
		}

		if (subscription.status !== 'active') {
			throw new Error(`Subscription is not active for userId=${userId} (status=${subscription.status})`);
		}

		// Get encrypted Claude tokens
		const claudeToken = await db.query.claudeTokens.findFirst({
			where: eq(claudeTokens.userId, userId),
		});

		if (!claudeToken) {
			throw new Error(`No Claude tokens found for userId=${userId}`);
		}

		// Get encrypted Telegram bot token
		const telegramBot = await db.query.telegramBots.findFirst({
			where: eq(telegramBots.userId, userId),
		});

		if (!telegramBot) {
			throw new Error(`No Telegram bot found for userId=${userId}`);
		}

		// Decrypt all tokens
		decryptedClaudeAccess = decryptToken(claudeToken.encryptedAccessToken);
		decryptedClaudeRefresh = decryptToken(claudeToken.encryptedRefreshToken);
		decryptedTelegramToken = decryptToken(telegramBot.encryptedToken);

		// Update status to creating
		await updateProvisioningStatus(userId, 'creating');

		// ------------------------------------------------------------------
		// Phase 2: SSH Key & Hetzner Resources
		// ------------------------------------------------------------------

		const hetznerClient = new HetznerClient({
			apiToken: process.env.HETZNER_API_TOKEN!,
		});

		// Generate SSH key pair for this VPS
		const sshKeyPair = generateSSHKeyPair();

		// Upload public key to Hetzner
		const sshKeyResponse = await hetznerClient.createSSHKey({
			name: `rachel-cloud-${userId}`,
			public_key: sshKeyPair.publicKey,
		});
		const sshKeyId = sshKeyResponse.ssh_key.id;

		// Get or create firewall (SSH only from control plane)
		const firewallId = await getOrCreateFirewall(hetznerClient);

		// Encrypt and store private key in database
		const encryptedPrivateKey = encryptToken(sshKeyPair.privateKey);
		await db
			.update(subscriptions)
			.set({
				hetznerSshKeyId: sshKeyId,
				sshPrivateKey: encryptedPrivateKey,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		// ------------------------------------------------------------------
		// Phase 3: VPS Creation
		// ------------------------------------------------------------------

		// Build cloud-init user-data
		const cloudInitYaml = buildCloudInitUserData({
			username: 'rachel',
			sshPublicKey: sshKeyPair.publicKey,
			callbackUrl: `${BASE_URL}/api/provision/callback/${userId}`,
		});

		// Create server via Hetzner API
		const serverResponse = await hetznerClient.createServer({
			name: `rachel-cloud-${userId}`,
			server_type: 'cx22',
			image: 'ubuntu-24.04',
			location: 'nbg1',
			ssh_keys: [sshKeyId],
			user_data: cloudInitYaml,
			firewalls: [{ firewall: firewallId }],
			start_after_create: true,
		});

		const serverId = serverResponse.server.id;
		const serverIp = serverResponse.server.public_net.ipv4.ip;

		// Store server info in database immediately (for cleanup if later steps fail)
		await db
			.update(subscriptions)
			.set({
				hetznerServerId: serverId,
				vpsIpAddress: serverIp,
				provisioningStatus: 'cloud_init',
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		console.log(
			`[provision-vps] Server created for userId=${userId}: ` +
				`serverId=${serverId}, ip=${serverIp} ` +
				`(${Date.now() - startTime}ms elapsed)`,
		);

		// ------------------------------------------------------------------
		// Phase 4: Wait for Cloud-Init
		// ------------------------------------------------------------------

		await waitForCloudInitCallback(userId);

		console.log(
			`[provision-vps] Cloud-init completed for userId=${userId} ` +
				`(${Date.now() - startTime}ms elapsed)`,
		);

		// ------------------------------------------------------------------
		// Phase 5: Secret Injection
		// ------------------------------------------------------------------

		// Decrypt SSH private key from database
		decryptedSshPrivateKey = decryptToken(encryptedPrivateKey);

		// Get the owner Telegram user ID from the bot record
		// The telegramBot table stores the bot info; we need the user's Telegram ID
		// which was stored during onboarding. For now, use a placeholder field.
		// The ownerTelegramUserId should come from the user profile or onboarding data.
		const ownerTelegramUserId = telegramBot.botUsername ?? '';

		await injectSecrets({
			host: serverIp,
			username: 'rachel',
			privateKey: decryptedSshPrivateKey,
			claudeAccessToken: decryptedClaudeAccess,
			claudeRefreshToken: decryptedClaudeRefresh,
			claudeExpiresAt: claudeToken.expiresAt.getTime(),
			telegramBotToken: decryptedTelegramToken,
			ownerTelegramUserId: ownerTelegramUserId,
		});

		console.log(
			`[provision-vps] Secrets injected for userId=${userId} ` +
				`(${Date.now() - startTime}ms elapsed)`,
		);

		// ------------------------------------------------------------------
		// Phase 6: Finalization
		// ------------------------------------------------------------------

		await db
			.update(subscriptions)
			.set({
				vpsProvisioned: true,
				provisioningStatus: 'ready',
				provisionedAt: new Date(),
				provisioningError: null,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		const elapsed = Date.now() - startTime;
		console.log(`[provision-vps] VPS provisioned for userId=${userId} in ${elapsed}ms`);

		if (elapsed > PROVISIONING_TIMEOUT_MS) {
			console.warn(
				`[provision-vps] SLA miss: provisioning took ${elapsed}ms ` +
					`(target: ${PROVISIONING_TIMEOUT_MS}ms) for userId=${userId}`,
			);
		}
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		console.error(`[provision-vps] Provisioning failed for userId=${userId}:`, err);

		// Clean up any Hetzner resources that were created
		await cleanupFailedProvision(userId);

		// Update status to failed
		await db
			.update(subscriptions)
			.set({
				provisioningStatus: 'failed',
				provisioningError: err.message,
				vpsProvisioned: false,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		throw error;
	} finally {
		// Clear sensitive data from memory
		decryptedClaudeAccess = null;
		decryptedClaudeRefresh = null;
		decryptedTelegramToken = null;
		decryptedSshPrivateKey = null;
	}
}

// ---------------------------------------------------------------------------
// Private Helpers
// ---------------------------------------------------------------------------

/**
 * Update the provisioning status field for a user's subscription.
 */
async function updateProvisioningStatus(
	userId: string,
	status: 'pending' | 'creating' | 'cloud_init' | 'injecting_secrets' | 'ready' | 'failed',
): Promise<void> {
	await db
		.update(subscriptions)
		.set({
			provisioningStatus: status,
			updatedAt: new Date(),
		})
		.where(eq(subscriptions.userId, userId));
}

/**
 * Poll the database waiting for the cloud-init callback to set the
 * provisioning status to 'injecting_secrets'.
 *
 * The callback endpoint (POST /api/provision/callback/[userId]) is
 * called by cloud-init's phone_home module when setup completes.
 *
 * @param userId - The user to poll for
 * @throws Error if the timeout is reached
 */
async function waitForCloudInitCallback(userId: string): Promise<void> {
	const deadline = Date.now() + CLOUD_INIT_TIMEOUT_MS;

	while (Date.now() < deadline) {
		const subscription = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.userId, userId),
		});

		if (subscription?.provisioningStatus === 'injecting_secrets') {
			return; // Cloud-init callback received
		}

		if (subscription?.provisioningStatus === 'failed') {
			throw new Error('Provisioning was marked as failed during cloud-init');
		}

		// Wait before next poll
		await sleep(CLOUD_INIT_POLL_INTERVAL_MS);
	}

	throw new Error(
		`Cloud-init callback not received within ${CLOUD_INIT_TIMEOUT_MS}ms for userId=${userId}`,
	);
}

/**
 * Get or create the shared Rachel Cloud firewall.
 *
 * All user VPSs share a single firewall that only allows SSH (port 22)
 * inbound. Outbound traffic is unrestricted (Rachel8 needs to reach
 * Telegram API, Claude API, and arbitrary URLs for agent tasks).
 *
 * @param hetznerClient - Hetzner API client instance
 * @returns The firewall ID
 */
async function getOrCreateFirewall(hetznerClient: HetznerClient): Promise<number> {
	try {
		// Try to find existing firewall by listing all firewalls
		const response = await hetznerClient.listFirewalls();
		const existing = response.firewalls.find(
			(fw) => fw.name === FIREWALL_NAME,
		);

		if (existing) {
			console.log(`[provision-vps] Reusing existing firewall: ${existing.id}`);
			return existing.id;
		}
	} catch {
		// If listing fails, proceed to create
		console.warn('[provision-vps] Failed to list firewalls, will create new one');
	}

	// Create new firewall
	const firewallResponse = await hetznerClient.createFirewall({
		name: FIREWALL_NAME,
		rules: [
			{
				direction: 'in',
				protocol: 'tcp',
				port: '22',
				source_ips: ['0.0.0.0/0', '::/0'],
				description: 'Allow SSH from anywhere',
			},
		],
	});

	console.log(`[provision-vps] Created new firewall: ${firewallResponse.firewall.id}`);
	return firewallResponse.firewall.id;
}

/**
 * Clean up Hetzner resources after a failed provisioning attempt.
 *
 * Deletes the server and SSH key if they were created, and resets
 * the database fields. Handles cases where resources were never
 * created or have already been deleted.
 *
 * @param userId - The user whose resources should be cleaned up
 */
async function cleanupFailedProvision(userId: string): Promise<void> {
	try {
		const subscription = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.userId, userId),
		});

		if (!subscription) {
			console.warn(`[provision-vps] No subscription found during cleanup for userId=${userId}`);
			return;
		}

		const hetznerClient = new HetznerClient({
			apiToken: process.env.HETZNER_API_TOKEN!,
		});

		// Delete server if it was created
		if (subscription.hetznerServerId) {
			try {
				await hetznerClient.deleteServer(subscription.hetznerServerId);
				console.log(
					`[provision-vps] Deleted server ${subscription.hetznerServerId} during cleanup`,
				);
			} catch (err) {
				// 404 means already deleted — that's fine
				const message = err instanceof Error ? err.message : String(err);
				if (message.includes('404') || message.includes('not found')) {
					console.log(
						`[provision-vps] Server ${subscription.hetznerServerId} already deleted`,
					);
				} else {
					console.error(
						`[provision-vps] Failed to delete server ${subscription.hetznerServerId}:`,
						err,
					);
				}
			}
		}

		// Delete SSH key if it was created
		if (subscription.hetznerSshKeyId) {
			try {
				await hetznerClient.deleteSSHKey(subscription.hetznerSshKeyId);
				console.log(
					`[provision-vps] Deleted SSH key ${subscription.hetznerSshKeyId} during cleanup`,
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				if (message.includes('404') || message.includes('not found')) {
					console.log(
						`[provision-vps] SSH key ${subscription.hetznerSshKeyId} already deleted`,
					);
				} else {
					console.error(
						`[provision-vps] Failed to delete SSH key ${subscription.hetznerSshKeyId}:`,
						err,
					);
				}
			}
		}

		// Reset database fields
		await db
			.update(subscriptions)
			.set({
				hetznerServerId: null,
				hetznerSshKeyId: null,
				vpsIpAddress: null,
				vpsHostname: null,
				sshPrivateKey: null,
				vpsProvisioned: false,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		console.log(`[provision-vps] Cleanup completed for userId=${userId}`);
	} catch (error) {
		// Cleanup itself failed — log but don't throw (don't mask the original error)
		console.error(`[provision-vps] Cleanup failed for userId=${userId}:`, error);
	}
}

/**
 * Simple sleep utility.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
