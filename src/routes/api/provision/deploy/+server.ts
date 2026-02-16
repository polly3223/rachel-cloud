/**
 * Provisioning deploy endpoint.
 *
 * POST /api/provision/deploy
 *
 * Triggers container provisioning for the authenticated user via the orchestrator.
 * Provisioning is synchronous (~10 seconds) — returns when the container is ready.
 *
 * Prerequisites:
 * - User must be authenticated
 * - User must have an active subscription (status = 'active')
 * - User must have a validated Telegram bot token
 * - Container must not already be provisioned
 *
 * @module provision-deploy
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { db } from '$lib/db';
import { subscriptions, telegramBots } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { orchestrator } from '$lib/orchestrator/client';
import { decrypt } from '$lib/crypto/encryption';

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
		if (subscription.vpsProvisioned && subscription.containerId) {
			return json(
				{ error: 'Rachel is already deployed.' },
				{ status: 400 },
			);
		}

		// Check if provisioning is already in progress
		if (
			subscription.provisioningStatus === 'pending' ||
			subscription.provisioningStatus === 'creating' ||
			subscription.provisioningStatus === 'starting'
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

		// Set provisioning status to creating
		await db
			.update(subscriptions)
			.set({
				provisioningStatus: 'creating',
				provisioningError: null,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		// Decrypt bot token for the orchestrator
		const botToken = decrypt(telegramBot.encryptedToken);

		// Provision container via orchestrator (synchronous — ~10 seconds)
		const result = await orchestrator.provisionContainer({
			userId,
			telegramBotToken: botToken,
			ownerTelegramUserId: userId,
		});

		// Update DB with container info
		await db
			.update(subscriptions)
			.set({
				containerId: result.container.containerId,
				containerName: result.container.containerName,
				currentImage: result.container.image,
				vpsProvisioned: true,
				provisioningStatus: 'ready',
				provisioningError: null,
				provisionedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		return json({
			message: 'Rachel is ready!',
			container: result.container,
		});
	} catch (error) {
		console.error(`[deploy] Error for userId=${userId}:`, error);

		// Mark provisioning as failed
		await db
			.update(subscriptions)
			.set({
				provisioningStatus: 'failed',
				provisioningError: String(error),
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.userId, userId));

		return json(
			{ error: 'Failed to deploy Rachel. Please try again.' },
			{ status: 500 },
		);
	}
};
