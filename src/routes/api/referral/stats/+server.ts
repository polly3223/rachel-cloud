import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReferralStats } from '$lib/referral/service';

/**
 * GET /api/referral/stats
 *
 * Returns referral statistics for the logged-in user.
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = locals.session;

		if (!session) {
			return json(
				{
					error: 'Unauthorized',
					message: 'You must be logged in to view referral stats'
				},
				{ status: 401 }
			);
		}

		const stats = await getReferralStats(String(session.telegramId));

		return json({
			success: true,
			...stats
		});
	} catch (error) {
		console.error('Error fetching referral stats:', error);

		return json(
			{
				error: 'Internal Server Error',
				message: 'Failed to fetch referral stats. Please try again.'
			},
			{ status: 500 }
		);
	}
};
