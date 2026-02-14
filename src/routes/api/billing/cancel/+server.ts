import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { polarClient } from '$lib/billing/polar-client';
import { getSubscription } from '$lib/billing/subscription-manager';

/**
 * POST /api/billing/cancel
 *
 * Cancel the user's active subscription.
 * This triggers a 3-day grace period before VPS deprovisioning.
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Get session from Better Auth
		const session = locals.session;

		if (!session || !session.user) {
			return json(
				{
					error: 'Unauthorized',
					message: 'You must be logged in to cancel your subscription'
				},
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		// Get user's subscription from database
		const subscription = await getSubscription(userId);

		if (!subscription) {
			return json(
				{
					error: 'Not Found',
					message: 'No active subscription found'
				},
				{ status: 404 }
			);
		}

		if (!subscription.polarSubscriptionId) {
			return json(
				{
					error: 'Invalid State',
					message: 'Subscription has no Polar ID'
				},
				{ status: 400 }
			);
		}

		if (subscription.status === 'canceled' || subscription.status === 'grace_period') {
			return json(
				{
					error: 'Already Canceled',
					message: 'This subscription is already canceled or in grace period'
				},
				{ status: 400 }
			);
		}

		// Call Polar API to cancel subscription at period end
		// Using update() with cancelAtPeriodEnd = true to schedule cancellation
		await polarClient.subscriptions.update({
			id: subscription.polarSubscriptionId,
			subscriptionUpdate: {
				cancelAtPeriodEnd: true
			}
		});

		// The webhook handler will update the database and schedule grace period
		console.log(`Subscription scheduled for cancellation at period end for user ${userId}`);

		return json({
			success: true,
			message: 'Subscription canceled successfully. You have a 3-day grace period.',
			gracePeriodDays: 3
		});
	} catch (error) {
		console.error('Error canceling subscription:', error);

		return json(
			{
				error: 'Internal Server Error',
				message: 'Failed to cancel subscription. Please try again or contact support.'
			},
			{ status: 500 }
		);
	}
};
