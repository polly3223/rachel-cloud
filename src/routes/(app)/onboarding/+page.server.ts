import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/auth/session';
import { db } from '$lib/db';
import { subscriptions, telegramBots } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	// Require authentication
	const session = await requireAuth(event);
	const userId = session.user.id;

	// Query subscription status
	const subscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.userId, userId)
	});

	// Query telegram bot status
	const bot = await db.query.telegramBots.findFirst({
		where: eq(telegramBots.userId, userId)
	});

	// Determine current onboarding step
	let step: 'payment' | 'telegram_bot' | 'provisioning';

	if (!subscription || subscription.status === 'none') {
		step = 'payment';
	} else if (!bot || !bot.validated) {
		step = 'telegram_bot';
	} else {
		step = 'provisioning';
	}

	return {
		step,
		hasSubscription: subscription?.status === 'active',
		hasBot: bot?.validated || false,
		botUsername: bot?.botUsername || null
	};
};
