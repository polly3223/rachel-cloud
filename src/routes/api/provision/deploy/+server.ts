/**
 * Provisioning deploy endpoint.
 *
 * POST /api/provision/deploy
 *
 * Triggers VPS provisioning for the authenticated user. The provisioning
 * runs asynchronously in the background — the endpoint returns 202 Accepted
 * immediately and the client polls the subscription status for progress.
 *
 * Prerequisites:
 * - User must be authenticated
 * - User must have an active subscription (status = 'active')
 * - User must have a validated Telegram bot token
 * - VPS must not already be provisioned
 *
 * @module provision-deploy
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { db } from '$lib/db';
import { subscriptions, telegramBots } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { provisionVPS } from '$lib/provisioning/provision-vps';

export const POST: RequestHandler = async (event) => {
	// Require authentication
	const session = await requireAuth(event);
	const userId = session.user.id;

	try {
		// Get user's subscription
		const subscription = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.userId, userId),
		});

		if (!subscription) {
			return json(
				{ error: 'No subscription found. Please subscribe first.' },
				{ status: 400 },
			);
		}

		if (subscription.status !== 'active') {
			return json(
				{ error: 'Subscription is not active. Please subscribe or reactivate.' },
				{ status: 400 },
			);
		}

		// Check if already provisioned
		if (subscription.vpsProvisioned) {
			return json(
				{ error: 'VPS already provisioned.' },
				{ status: 400 },
			);
		}

		// Check if provisioning is already in progress
		if (
			subscription.provisioningStatus === 'pending' ||
			subscription.provisioningStatus === 'creating' ||
			subscription.provisioningStatus === 'cloud_init' ||
			subscription.provisioningStatus === 'injecting_secrets'
		) {
			return json(
				{ error: 'Provisioning is already in progress.' },
				{ status: 400 },
			);
		}

		// Validate user has completed onboarding (Telegram bot token exists)
		const telegramBot = await db.query.telegramBots.findFirst({
			where: eq(telegramBots.userId, userId),
		});

		if (!telegramBot || !telegramBot.validated) {
			return json(
				{ error: 'Please complete Telegram bot setup in onboarding first.' },
				{ status: 400 },
			);
		}

		// Fire and forget — run provisioning in background
		void provisionVPS(userId).catch((err) => {
			console.error(`[deploy] Background provisioning failed for userId=${userId}:`, err);
		});

		return json(
			{ message: 'Provisioning started' },
			{ status: 202 },
		);
	} catch (error) {
		console.error(`[deploy] Error for userId=${userId}:`, error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
};
