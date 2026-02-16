/**
 * GET /api/vps/status
 *
 * Returns the current container status for the authenticated user.
 * Uses the orchestrator API to get Docker container health and state.
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
			return json({ status: 'no_subscription' }, { status: 403 });
		}

		// Check if container is provisioned
		if (!subscription.vpsProvisioned || !subscription.containerId) {
			return json({ status: 'not_provisioned' });
		}

		// Get container status from orchestrator
		const result = await orchestrator.getContainerStatus(session.user.id);

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
