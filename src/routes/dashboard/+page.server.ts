import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require authentication
	const session = await requireAuth(event);

	// Get user's subscription from database
	const subscription = await getSubscription(session.user.id);

	return {
		subscription,
		hasActiveSubscription: subscription?.status === 'active',
		isGracePeriod: subscription?.status === 'grace_period',
	};
};
