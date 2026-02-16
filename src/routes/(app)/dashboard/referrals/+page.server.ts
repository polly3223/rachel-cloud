import { redirect } from '@sveltejs/kit';
import { getReferralStats } from '$lib/referral/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = event.locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	const stats = await getReferralStats(String(session.telegramId));

	return {
		referralStats: stats
	};
};
