/**
 * VPS deprovisioning — delete Hetzner resources and clean up database.
 *
 * Called by:
 * - Grace period enforcer (after subscription cancellation + 3-day grace)
 * - Admin actions (manual cleanup)
 *
 * Idempotent: safe to call multiple times for the same user.
 * Resilient: always updates the database even if Hetzner API calls fail,
 * preventing zombie records.
 *
 * @module deprovision-vps
 */

import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { HetznerClient } from './hetzner-client';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Deprovision a user's VPS by deleting Hetzner resources and updating the database.
 *
 * This function:
 * 1. Looks up the subscription to find Hetzner resource IDs
 * 2. Deletes the Hetzner server (if it exists)
 * 3. Deletes the Hetzner SSH key (if it exists)
 * 4. Resets all VPS-related fields in the database
 *
 * Handles all error cases gracefully:
 * - No subscription found: logs warning and returns
 * - VPS not provisioned: logs warning and returns
 * - Hetzner API 404 (already deleted): logs and continues
 * - Other Hetzner API errors: logs but still updates database
 *
 * @param userId - The user ID whose VPS should be deprovisioned
 */
export async function deprovisionVPS(userId: string): Promise<void> {
	console.log(`[deprovision-vps] Starting deprovisioning for userId=${userId}`);

	// Get subscription from database
	const subscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.userId, userId),
	});

	if (!subscription) {
		console.warn(`[deprovision-vps] No subscription found for userId=${userId}, skipping`);
		return;
	}

	if (!subscription.vpsProvisioned && !subscription.hetznerServerId) {
		console.warn(
			`[deprovision-vps] VPS not provisioned for userId=${userId}, skipping`,
		);
		return;
	}

	const hetznerClient = new HetznerClient({
		apiToken: process.env.HETZNER_API_TOKEN!,
	});

	// Delete Hetzner server
	if (subscription.hetznerServerId) {
		try {
			await hetznerClient.deleteServer(subscription.hetznerServerId);
			console.log(
				`[deprovision-vps] Deleted server ${subscription.hetznerServerId} for userId=${userId}`,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('404') || message.includes('not found')) {
				console.log(
					`[deprovision-vps] Server ${subscription.hetznerServerId} already deleted for userId=${userId}`,
				);
			} else {
				console.error(
					`[deprovision-vps] Failed to delete server ${subscription.hetznerServerId} for userId=${userId}:`,
					err,
				);
				// Continue to update database even if Hetzner API fails
			}
		}
	}

	// Delete Hetzner SSH key
	if (subscription.hetznerSshKeyId) {
		try {
			await hetznerClient.deleteSSHKey(subscription.hetznerSshKeyId);
			console.log(
				`[deprovision-vps] Deleted SSH key ${subscription.hetznerSshKeyId} for userId=${userId}`,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('404') || message.includes('not found')) {
				console.log(
					`[deprovision-vps] SSH key ${subscription.hetznerSshKeyId} already deleted for userId=${userId}`,
				);
			} else {
				console.error(
					`[deprovision-vps] Failed to delete SSH key ${subscription.hetznerSshKeyId} for userId=${userId}:`,
					err,
				);
				// Continue to update database even if Hetzner API fails
			}
		}
	}

	// Always update database to prevent zombie records
	await db
		.update(subscriptions)
		.set({
			vpsProvisioned: false,
			hetznerServerId: null,
			hetznerSshKeyId: null,
			vpsIpAddress: null,
			vpsHostname: null,
			provisioningStatus: null,
			sshPrivateKey: null,
			deprovisionedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(subscriptions.userId, userId));

	console.log(`[deprovision-vps] Deprovisioning completed for userId=${userId}`);
}
