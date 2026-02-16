/**
 * POST /api/billing/portal
 *
 * Creates a Polar customer portal session for the authenticated user.
 * Returns the portal URL for managing subscriptions/billing.
 *
 * @module billing-portal
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { polarClient } from '$lib/billing/polar-client';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://get-rachel.com';

export const POST: RequestHandler = async ({ locals }) => {
	const session = locals.session;

	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const portalSession = await polarClient.customerSessions.create({
			externalCustomerId: `tg_${session.telegramId}`,
			returnUrl: `${BASE_URL}/dashboard/billing`,
		});

		return json({ url: portalSession.customerPortalUrl });
	} catch (error) {
		console.error('[portal] Error creating portal session:', error);
		return json(
			{ error: 'Failed to create billing portal session' },
			{ status: 500 }
		);
	}
};
