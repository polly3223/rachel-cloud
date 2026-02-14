import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processReferral } from '$lib/referral/service';

/**
 * POST /api/referral/process
 *
 * Process a referral after a new user signs up.
 * Called from the signup page with the referral code and new user ID.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;

		if (!session || !session.user) {
			return json(
				{
					error: 'Unauthorized',
					message: 'You must be logged in to process a referral'
				},
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { referralCode } = body;

		if (!referralCode || typeof referralCode !== 'string') {
			return json(
				{
					error: 'Bad Request',
					message: 'Referral code is required'
				},
				{ status: 400 }
			);
		}

		// Use the authenticated user's ID (not the one from the request body for security)
		const success = await processReferral(session.user.id, referralCode);

		return json({
			success,
			message: success
				? 'Referral processed successfully'
				: 'Could not process referral. Code may be invalid or already used.'
		});
	} catch (error) {
		console.error('Error processing referral:', error);

		return json(
			{
				error: 'Internal Server Error',
				message: 'Failed to process referral. Please try again.'
			},
			{ status: 500 }
		);
	}
};
