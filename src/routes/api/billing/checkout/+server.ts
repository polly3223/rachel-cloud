/**
 * POST /api/billing/checkout
 *
 * Creates a Polar checkout session for the authenticated user.
 * Returns the checkout URL for the frontend to redirect to.
 *
 * @module billing-checkout
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
		const checkout = await polarClient.checkouts.create({
			products: [process.env.POLAR_PRODUCT_ID!],
			externalCustomerId: `tg_${session.telegramId}`,
			metadata: {
				telegram_id: String(session.telegramId),
			},
			customerMetadata: {
				telegram_id: String(session.telegramId),
			},
			successUrl: `${BASE_URL}/dashboard?checkout=success`,
		});

		return json({ url: checkout.url });
	} catch (error) {
		console.error('[checkout] Error creating checkout:', error);
		return json(
			{ error: 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
};
