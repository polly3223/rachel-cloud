import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { scheduleGracePeriodDeprovision } from '$lib/jobs/grace-period-enforcer';

/**
 * Update or insert a subscription record in the database.
 * Uses upsert pattern to handle both new subscriptions and updates.
 */
export async function updateSubscriptionStatus(params: {
	userId: string;
	polarCustomerId?: string;
	polarSubscriptionId?: string;
	status: 'none' | 'active' | 'grace_period' | 'canceled';
	currentPeriodEnd?: Date;
	gracePeriodEndsAt?: Date | null;
}) {
	const { userId, polarCustomerId, polarSubscriptionId, status, currentPeriodEnd, gracePeriodEndsAt } = params;

	try {
		// Check if subscription exists
		const existing = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.userId, userId)
		});

		if (existing) {
			// Update existing subscription
			await db
				.update(subscriptions)
				.set({
					polarCustomerId: polarCustomerId ?? existing.polarCustomerId,
					polarSubscriptionId: polarSubscriptionId ?? existing.polarSubscriptionId,
					status,
					currentPeriodEnd: currentPeriodEnd ?? existing.currentPeriodEnd,
					gracePeriodEndsAt: gracePeriodEndsAt === null ? null : (gracePeriodEndsAt ?? existing.gracePeriodEndsAt),
					updatedAt: new Date()
				})
				.where(eq(subscriptions.userId, userId));
		} else {
			// Insert new subscription
			await db.insert(subscriptions).values({
				id: crypto.randomUUID(),
				userId,
				polarCustomerId: polarCustomerId ?? null,
				polarSubscriptionId: polarSubscriptionId ?? null,
				status,
				currentPeriodEnd: currentPeriodEnd ?? null,
				gracePeriodEndsAt: gracePeriodEndsAt ?? null,
				vpsProvisioned: false,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		console.log(`Subscription updated for user ${userId}: status=${status}`);
	} catch (error) {
		console.error('Failed to update subscription status:', error);
		throw error;
	}
}

/**
 * Get a user's subscription record from the database.
 */
export async function getSubscription(userId: string) {
	try {
		const subscription = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.userId, userId)
		});

		return subscription ?? null;
	} catch (error) {
		console.error('Failed to get subscription:', error);
		return null;
	}
}

/**
 * Schedule a grace period for a subscription.
 * Sets the subscription status to 'grace_period' and calculates the end date (3 days from now).
 * Also schedules the deprovisioning job.
 *
 * @returns The grace period end date
 */
export async function scheduleGracePeriod(userId: string, subscriptionId: string) {
	try {
		const gracePeriodEnd = new Date();
		gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 days grace period

		// Update subscription status to grace_period
		await db
			.update(subscriptions)
			.set({
				status: 'grace_period',
				gracePeriodEndsAt: gracePeriodEnd,
				updatedAt: new Date()
			})
			.where(eq(subscriptions.userId, userId));

		// Schedule the deprovisioning job
		await scheduleGracePeriodDeprovision(userId, subscriptionId);

		console.log(`Grace period scheduled for user ${userId}, ends at ${gracePeriodEnd.toISOString()}`);

		return gracePeriodEnd;
	} catch (error) {
		console.error('Failed to schedule grace period:', error);
		throw error;
	}
}
