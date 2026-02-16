import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const session = event.locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}
	const telegramId = session.telegramId;

	// Query subscription status
	const subscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.telegramId, telegramId)
	});

	// Simplified onboarding: just payment → auto-provisioning
	// No more BotFather setup step — shared bot model
	let step: 'payment' | 'provisioning' | 'ready';

	if (!subscription || subscription.status === 'none' || subscription.status === 'canceled') {
		step = 'payment';
	} else if (!subscription.containerProvisioned || subscription.provisioningStatus !== 'ready') {
		step = 'provisioning';
	} else {
		step = 'ready';
	}

	return {
		step,
		hasSubscription: subscription?.status === 'active',
		containerReady: subscription?.provisioningStatus === 'ready',
		provisioningStatus: subscription?.provisioningStatus ?? null,
	};
};
