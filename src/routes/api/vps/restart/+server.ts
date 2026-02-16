/**
 * POST /api/vps/restart
 *
 * Restarts the user's Rachel container via the orchestrator.
 *
 * Requires: authenticated session + active subscription with provisioned container.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { orchestrator } from '$lib/orchestrator/client';

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

		// Validate container is provisioned
		if (!subscription.vpsProvisioned || !subscription.containerId) {
			return json(
				{ success: false, message: 'Rachel is not deployed' },
				{ status: 400 }
			);
		}

		// Restart container via orchestrator
		const result = await orchestrator.restartContainer(session.user.id);

		console.log(`[restart] Container restarted for userId=${session.user.id}`);

		return json({
			success: true,
			message: 'Rachel restarted successfully.',
			container: result.container,
		});
	} catch (error) {
		console.error('Container restart failed:', error);
		return json(
			{ success: false, message: 'Failed to restart Rachel' },
			{ status: 500 }
		);
	}
};
