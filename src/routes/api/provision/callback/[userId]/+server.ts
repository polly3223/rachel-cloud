/**
 * Cloud-init completion callback endpoint.
 *
 * POST /api/provision/callback/[userId]
 *
 * Called by cloud-init's phone_home module when VPS setup completes.
 * Updates the subscription's provisioningStatus from 'cloud_init' to
 * 'injecting_secrets' so the provisioning orchestrator knows it is safe
 * to begin SSH secret injection.
 *
 * Security considerations:
 * - No authentication required (cloud-init cannot hold auth tokens)
 * - userId is validated as a UUID format
 * - Idempotent: subsequent calls for the same userId are accepted but no-op
 *
 * @module provision-callback
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// UUID v4 regex for userId validation
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Handle cloud-init phone_home callback.
 *
 * Expected request body (from cloud-init phone_home module):
 * ```json
 * {
 *   "instance_id": "i-abc123",
 *   "hostname": "rachel-cloud-user123"
 * }
 * ```
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const { userId } = params;

	// Validate userId format
	if (!userId || !UUID_REGEX.test(userId)) {
		console.warn(
			`[provision-callback] Invalid userId format: ${userId ?? '(empty)'}`
		);
		return json(
			{ error: 'Bad Request', message: 'Invalid userId format' },
			{ status: 400 }
		);
	}

	try {
		// Parse request body (cloud-init phone_home sends instance_id, hostname)
		let body: { instance_id?: string; hostname?: string } = {};
		try {
			body = await request.json();
		} catch {
			// phone_home may send form-encoded data; accept empty body gracefully
			console.warn(
				`[provision-callback] Could not parse JSON body for userId ${userId}, proceeding with empty body`
			);
		}

		const hostname = body.hostname ?? null;
		const instanceId = body.instance_id ?? null;

		console.log(
			`[provision-callback] Received callback for userId=${userId} ` +
				`hostname=${hostname ?? '(none)'} instance_id=${instanceId ?? '(none)'}`
		);

		// Look up the subscription for this user
		const existing = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, userId))
			.limit(1);

		if (existing.length === 0) {
			console.warn(
				`[provision-callback] No subscription found for userId=${userId}`
			);
			return json(
				{ error: 'Not Found', message: 'No subscription found for this user' },
				{ status: 404 }
			);
		}

		const subscription = existing[0];

		// Idempotent: if already past cloud_init stage, accept but don't update
		if (
			subscription.provisioningStatus !== 'cloud_init' &&
			subscription.provisioningStatus !== 'creating'
		) {
			console.log(
				`[provision-callback] Subscription for userId=${userId} already at ` +
					`status="${subscription.provisioningStatus}", skipping update`
			);
			return json({
				success: true,
				message: 'Callback already processed'
			});
		}

		// Update provisioning status to indicate cloud-init is done
		await db
			.update(subscriptions)
			.set({
				provisioningStatus: 'injecting_secrets',
				vpsHostname: hostname ?? subscription.vpsHostname,
				updatedAt: new Date()
			})
			.where(eq(subscriptions.userId, userId));

		console.log(
			`[provision-callback] Updated userId=${userId} to provisioningStatus=injecting_secrets`
		);

		return json({
			success: true,
			message: 'Cloud-init completion recorded'
		});
	} catch (error) {
		console.error(
			`[provision-callback] Error processing callback for userId=${userId}:`,
			error
		);

		return json(
			{
				error: 'Internal Server Error',
				message: 'Failed to process cloud-init callback'
			},
			{ status: 500 }
		);
	}
};
