/**
 * GET /api/vps/status
 *
 * Returns the current container status for the authenticated user.
 * Uses the orchestrator API to get Docker container health and state.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSubscription } from '$lib/billing/subscription-manager';
import { orchestrator } from '$lib/orchestrator/client';

export const GET: RequestHandler = async (event) => {
	try {
		const session = event.locals.session;
		if (!session) {
			return json({ status: 'not_authenticated' }, { status: 401 });
		}

		// Get user's subscription
		const subscription = await getSubscription(session.telegramId);

		if (!subscription) {
			return json({ status: 'no_subscription' }, { status: 403 });
		}

		// Check if container is provisioned
		if (!subscription.containerProvisioned || !subscription.containerId) {
			return json({ status: 'not_provisioned' });
		}

		// Get container status from orchestrator
		const result = await orchestrator.getContainerStatus(String(session.telegramId));

		if (!result) {
			return json({
				status: 'not_found',
				message: 'Container not found in orchestrator',
			});
		}

		return json({
			status: result.container.state,
			health: result.container.health,
			uptime: result.container.uptime,
			image: result.container.image,
			containerName: result.container.containerName,
		});
	} catch (error) {
		console.error('Container status check failed:', error);
		return json(
			{ status: 'error', message: 'Failed to check container status' },
			{ status: 500 }
		);
	}
};
