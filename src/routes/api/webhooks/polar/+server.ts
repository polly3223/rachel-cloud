/**
 * POST /api/webhooks/polar
 *
 * Receives Polar webhook events for subscription lifecycle management.
 * Validates the webhook signature and dispatches to appropriate handlers.
 *
 * Uses the @polar-sh/sdk webhook validation.
 *
 * @module polar-webhook
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { updateSubscriptionStatus, scheduleGracePeriod } from '$lib/billing/subscription-manager';
import { cancelGracePeriodJob } from '$lib/jobs/grace-period-enforcer';

/**
 * Extract telegram_id from subscription metadata or customer external ID.
 */
function extractTelegramId(data: Record<string, unknown>): number | null {
	// Try metadata first
	const metadata = data.metadata as Record<string, string> | undefined;
	if (metadata?.telegram_id) {
		return Number(metadata.telegram_id);
	}

	// Try customer external ID (format: "tg_123456")
	const customer = data.customer as Record<string, unknown> | undefined;
	const externalId = customer?.externalId as string | undefined;
	if (externalId?.startsWith('tg_')) {
		return Number(externalId.replace('tg_', ''));
	}

	return null;
}

async function handleSubscriptionActive(data: Record<string, unknown>) {
	const telegramId = extractTelegramId(data);
	if (!telegramId) {
		console.error('[polar-webhook] No telegram_id found in subscription.active event');
		return;
	}

	// Cancel any pending grace period job
	cancelGracePeriodJob(telegramId);

	await updateSubscriptionStatus({
		telegramId,
		polarCustomerId: (data.customer as Record<string, unknown>)?.id as string,
		polarSubscriptionId: data.id as string,
		status: 'active',
		currentPeriodEnd: data.currentPeriodEnd
			? new Date(data.currentPeriodEnd as string)
			: undefined,
		gracePeriodEndsAt: null,
	});

	console.log(`[polar-webhook] Subscription activated for telegramId=${telegramId}`);
}

async function handleSubscriptionCanceled(data: Record<string, unknown>) {
	const telegramId = extractTelegramId(data);
	if (!telegramId) {
		console.error('[polar-webhook] No telegram_id found in subscription.canceled event');
		return;
	}

	// Schedule grace period (3 days before deprovisioning)
	await scheduleGracePeriod(telegramId, data.id as string);

	console.log(`[polar-webhook] Subscription canceled for telegramId=${telegramId}, grace period started`);
}

async function handleSubscriptionRevoked(data: Record<string, unknown>) {
	const telegramId = extractTelegramId(data);
	if (!telegramId) {
		console.error('[polar-webhook] No telegram_id found in subscription.revoked event');
		return;
	}

	await updateSubscriptionStatus({
		telegramId,
		status: 'canceled',
		gracePeriodEndsAt: null,
	});

	console.log(`[polar-webhook] Subscription revoked for telegramId=${telegramId}`);
}

async function handleSubscriptionUncanceled(data: Record<string, unknown>) {
	const telegramId = extractTelegramId(data);
	if (!telegramId) {
		console.error('[polar-webhook] No telegram_id found in subscription.uncanceled event');
		return;
	}

	// Cancel grace period job
	cancelGracePeriodJob(telegramId);

	await updateSubscriptionStatus({
		telegramId,
		status: 'active',
		gracePeriodEndsAt: null,
	});

	console.log(`[polar-webhook] Subscription uncanceled for telegramId=${telegramId}`);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const headers = {
		'webhook-id': request.headers.get('webhook-id') ?? '',
		'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
		'webhook-signature': request.headers.get('webhook-signature') ?? '',
	};

	let event: { type: string; data: Record<string, unknown> };
	try {
		event = validateEvent(
			body,
			headers,
			process.env.POLAR_WEBHOOK_SECRET!
		) as typeof event;
	} catch (err) {
		if (err instanceof WebhookVerificationError) {
			console.error('[polar-webhook] Invalid signature');
			return json({ error: 'Invalid signature' }, { status: 400 });
		}
		console.error('[polar-webhook] Invalid payload:', err);
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	console.log(`[polar-webhook] Received event: ${event.type}`);

	try {
		switch (event.type) {
			case 'subscription.active':
				await handleSubscriptionActive(event.data);
				break;
			case 'subscription.canceled':
				await handleSubscriptionCanceled(event.data);
				break;
			case 'subscription.revoked':
				await handleSubscriptionRevoked(event.data);
				break;
			case 'subscription.uncanceled':
				await handleSubscriptionUncanceled(event.data);
				break;
			default:
				console.log(`[polar-webhook] Unhandled event type: ${event.type}`);
		}
	} catch (error) {
		console.error(`[polar-webhook] Error handling ${event.type}:`, error);
		// Still return 200 to avoid retries for handler errors
	}

	return json({ received: true });
};
