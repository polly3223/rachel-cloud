import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateReferralCode, getReferralLink } from '$lib/referral/service';

/**
 * POST /api/referral/code
 *
 * Generates (or retrieves) a referral code for the logged-in user.
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		const session = locals.session;

		if (!session || !session.user) {
			return json(
				{
					error: 'Unauthorized',
					message: 'You must be logged in to generate a referral code'
				},
				{ status: 401 }
			);
		}

		const code = await generateReferralCode(session.user.id);
		const link = getReferralLink(code);

		return json({
			success: true,
			referralCode: code,
			referralLink: link
		});
	} catch (error) {
		console.error('Error generating referral code:', error);

		return json(
			{
				error: 'Internal Server Error',
				message: 'Failed to generate referral code. Please try again.'
			},
			{ status: 500 }
		);
	}
};
