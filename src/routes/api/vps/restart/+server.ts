/**
 * POST /api/vps/restart
 *
 * Restarts the rachel8 systemd service on the user's VPS via SSH.
 *
 * Requires: authenticated session + active subscription with provisioned VPS.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { restartRachelService } from '$lib/provisioning/vps-status';

export const POST: RequestHandler = async (event) => {
	try {
		// Require authenticated session
		const session = await requireAuth(event);

		// Get user's subscription
		const subscription = await getSubscription(session.user.id);

		if (!subscription) {
			return json(
				{ success: false, message: 'No subscription found' },
				{ status: 403 }
			);
		}

		// Validate VPS is provisioned with required fields
		if (
			!subscription.vpsProvisioned ||
			!subscription.vpsIpAddress ||
			!subscription.sshPrivateKey
		) {
			return json(
				{ success: false, message: 'VPS is not provisioned' },
				{ status: 400 }
			);
		}

		// Restart the service via SSH
		const result = await restartRachelService(
			subscription.vpsIpAddress,
			subscription.sshPrivateKey
		);

		return json({
			success: result.success,
			message: result.message,
		});
	} catch (error) {
		console.error('VPS restart failed:', error);
		return json(
			{ success: false, message: 'Failed to restart service' },
			{ status: 500 }
		);
	}
};
