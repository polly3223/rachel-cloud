// @ts-nocheck
import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import type { PageServerLoad } from './$types';

export const load = async (event: Parameters<PageServerLoad>[0]) => {
	// Require authentication
	const session = await requireAuth(event);

	// Get user's subscription from database
	const subscription = await getSubscription(session.user.id);

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
