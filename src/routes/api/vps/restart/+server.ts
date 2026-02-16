/**
 * POST /api/vps/restart
 *
 * Restarts the user's Rachel container via the orchestrator.
 *
 * Requires: authenticated session + active subscription with provisioned container.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSubscription } from '$lib/billing/subscription-manager';
import { orchestrator } from '$lib/orchestrator/client';

export const POST: RequestHandler = async (event) => {
	try {
		const session = event.locals.session;
		if (!session) {
			return json({ success: false, message: 'Not authenticated' }, { status: 401 });
		}

		// Get user's subscription
		const subscription = await getSubscription(session.telegramId);

		if (!subscription) {
			return json(
				{ success: false, message: 'No subscription found' },
				{ status: 403 }
			);
		}

		// Validate container is provisioned
		if (!subscription.containerProvisioned || !subscription.containerId) {
			return json(
				{ success: false, message: 'Rachel is not deployed' },
				{ status: 400 }
			);
		}

		// Restart container via orchestrator
		const result = await orchestrator.restartContainer(String(session.telegramId));

		console.log(`[restart] Container restarted for telegramId=${session.telegramId}`);

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
