/**
 * GET /api/provision/status
 *
 * Returns the current provisioning status for the authenticated user.
 * Used by the dashboard to poll deployment progress.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSubscription } from '$lib/billing/subscription-manager';

export const GET: RequestHandler = async (event) => {
	const session = event.locals.session;
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const subscription = await getSubscription(session.telegramId);
	if (!subscription) {
		return json({ error: 'No subscription found' }, { status: 404 });
	}

	return json({
		provisioningStatus: subscription.provisioningStatus,
		containerId: subscription.containerId,
		containerProvisioned: subscription.containerProvisioned,
		provisioningError: subscription.provisioningError,
	});
};
