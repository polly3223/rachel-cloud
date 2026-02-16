/**
 * GET /api/vps/logs
 *
 * Fetches recent log lines from the user's Rachel container via the orchestrator.
 *
 * Query parameters:
 *   - lines: Number of log lines to fetch (default: 100, max: 500)
 *
 * Requires: authenticated session + active subscription with provisioned container.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { orchestrator } from '$lib/orchestrator/client';

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

		// Validate container is provisioned
		if (!subscription.vpsProvisioned || !subscription.containerId) {
			return json(
				{ logs: '', success: false, message: 'Rachel is not deployed' },
				{ status: 400 }
			);
		}

		// Parse lines parameter (default 100, max 500)
		const lines = Math.min(
			parseInt(event.url.searchParams.get('lines') || '100', 10) || 100,
			500
		);

		// Fetch logs via orchestrator
		const result = await orchestrator.getContainerLogs(session.user.id, {
			tail: lines,
		});

		return json({
			logs: result.logs,
			success: true,
		});
	} catch (error) {
		console.error('Container log fetch failed:', error);
		return json(
			{ logs: '', success: false, message: 'Failed to fetch logs' },
			{ status: 500 }
		);
	}
};
