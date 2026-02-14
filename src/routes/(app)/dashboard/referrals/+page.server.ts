import { requireAuth } from '$lib/auth/session';
import { getReferralStats } from '$lib/referral/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);

	const stats = await getReferralStats(session.user.id);

	return {
		referralStats: stats
	};
};
