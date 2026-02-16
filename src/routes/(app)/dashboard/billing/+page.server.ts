import { redirect } from '@sveltejs/kit';
import { getSubscription } from '$lib/billing/subscription-manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = event.locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	// Get user's subscription from database
	const subscription = await getSubscription(session.telegramId);

	// Determine if user has an active subscription
	const hasActiveSubscription = subscription?.status === 'active';
	const isGracePeriod = subscription?.status === 'grace_period';
	const isCanceled = subscription?.status === 'canceled' || subscription?.status === 'none';

	return {
		subscription,
		hasActiveSubscription,
		isGracePeriod,
		isCanceled
	};
};
