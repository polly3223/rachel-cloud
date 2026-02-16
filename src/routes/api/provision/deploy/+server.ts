/**
 * Provisioning deploy endpoint.
 *
 * POST /api/provision/deploy
 *
 * Triggers container provisioning for the authenticated user via the orchestrator.
 * Provisioning is synchronous (~10 seconds) — returns when the container is ready.
 *
 * In the Telegram-first model, the shared bot token is used for all containers.
 * No per-user bot setup is needed.
 *
 * Prerequisites:
 * - User must be authenticated (Telegram session)
 * - User must have an active subscription (status = 'active')
 * - Container must not already be provisioned
 *
 * @module provision-deploy
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { orchestrator } from '$lib/orchestrator/client';

export const POST: RequestHandler = async (event) => {
	const session = event.locals.session;
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}
	const telegramId = session.telegramId;

	try {
		// Get user's subscription
		const subscription = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.telegramId, telegramId),
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
		if (subscription.containerProvisioned && subscription.containerId) {
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

		// Set provisioning status to creating
		await db
			.update(subscriptions)
			.set({
				provisioningStatus: 'creating',
				provisioningError: null,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.telegramId, telegramId));

		// Provision container via orchestrator (synchronous — ~10 seconds)
		// In shared bot model, the bot token comes from env (TELEGRAM_BOT_TOKEN)
		const result = await orchestrator.provisionContainer({
			userId: String(telegramId),
			telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
			ownerTelegramUserId: String(telegramId),
		});

		// Update DB with container info
		await db
			.update(subscriptions)
			.set({
				containerId: result.container.containerId,
				containerName: result.container.containerName,
				currentImage: result.container.image,
				containerProvisioned: true,
				provisioningStatus: 'ready',
				provisioningError: null,
				provisionedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.telegramId, telegramId));

		return json({
			message: 'Rachel is ready!',
			container: result.container,
		});
	} catch (error) {
		console.error(`[deploy] Error for telegramId=${telegramId}:`, error);

		// Mark provisioning as failed
		await db
			.update(subscriptions)
			.set({
				provisioningStatus: 'failed',
				provisioningError: String(error),
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.telegramId, telegramId));

		return json(
			{ error: 'Failed to deploy Rachel. Please try again.' },
			{ status: 500 },
		);
	}
};
