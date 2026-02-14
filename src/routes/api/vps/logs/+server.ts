/**
 * GET /api/vps/logs
 *
 * Fetches recent log lines from the rachel8 service on the user's VPS via SSH.
 *
 * Query parameters:
 *   - lines: Number of log lines to fetch (default: 100, max: 500)
 *
 * Requires: authenticated session + active subscription with provisioned VPS.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { fetchServiceLogs } from '$lib/provisioning/vps-status';

export const GET: RequestHandler = async (event) => {
	try {
		// Require authenticated session
		const session = await requireAuth(event);

		// Get user's subscription
		const subscription = await getSubscription(session.user.id);

		if (!subscription) {
			return json(
				{ logs: '', success: false, message: 'No subscription found' },
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
				{ logs: '', success: false, message: 'VPS is not provisioned' },
				{ status: 400 }
			);
		}

		// Parse lines parameter (default 100, max 500)
		const lines = Math.min(
			parseInt(event.url.searchParams.get('lines') || '100', 10) || 100,
			500
		);

		// Fetch logs via SSH
		const result = await fetchServiceLogs(
			subscription.vpsIpAddress,
			subscription.sshPrivateKey,
			lines
		);

		return json({
			logs: result.logs,
			success: result.success,
		});
	} catch (error) {
		console.error('VPS log fetch failed:', error);
		return json(
			{ logs: '', success: false, message: 'Failed to fetch logs' },
			{ status: 500 }
		);
	}
};
