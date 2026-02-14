import schedule from 'node-schedule';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { deprovisionVPS } from '$lib/provisioning/deprovision-vps';

/**
 * Schedule a VPS deprovisioning job to run after the grace period ends.
 * The job will only deprovision if the subscription is still in grace_period status.
 *
 * @param userId - The user ID whose VPS should be deprovisioned
 * @param subscriptionId - The subscription ID (for logging)
 */
export async function scheduleGracePeriodDeprovision(
	userId: string,
	subscriptionId: string
) {
	try {
		const gracePeriodEnd = new Date();
		gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 days from now

		// Update subscription in database
		await db
			.update(subscriptions)
			.set({
				status: 'grace_period',
				gracePeriodEndsAt: gracePeriodEnd,
				updatedAt: new Date()
			})
			.where(eq(subscriptions.userId, userId));

		// Schedule the deprovisioning job
		const jobName = `deprovision-${userId}`;
		const job = schedule.scheduleJob(jobName, gracePeriodEnd, async () => {
			console.log(`Grace period job running for user ${userId}`);

			try {
				// CRITICAL: Check subscription status before deprovisioning
				// The subscription might have been uncanceled during grace period
				const subscription = await db.query.subscriptions.findFirst({
					where: eq(subscriptions.userId, userId)
				});

				if (!subscription) {
					console.error(`No subscription found for user ${userId}`);
					return;
				}

				// Only deprovision if still in grace period
				if (subscription.status === 'grace_period') {
					console.log(`Deprovisioning VPS for user ${userId} (grace period expired)`);

					// Call deprovision function
					await deprovisionVPS(userId);

					// Update subscription status
					await db
						.update(subscriptions)
						.set({
							status: 'canceled',
							vpsProvisioned: false,
							updatedAt: new Date()
						})
						.where(eq(subscriptions.userId, userId));

					console.log(`VPS deprovisioned for user ${userId}`);
				} else {
					console.log(
						`Skipping deprovisioning for user ${userId} - subscription status is ${subscription.status} (not grace_period)`
					);
				}
			} catch (error) {
				console.error(`Failed to deprovision VPS for user ${userId}:`, error);
				// TODO: Send alert to monitoring system
			}
		});

		console.log(`Grace period deprovisioning job scheduled for user ${userId} at ${gracePeriodEnd.toISOString()}`);

		return job;
	} catch (error) {
		console.error(`Failed to schedule grace period job for user ${userId}:`, error);
		throw error;
	}
}

/**
 * Cancel a scheduled grace period deprovisioning job.
 * Call this when a subscription is uncanceled or payment is recovered.
 *
 * @param userId - The user ID whose job should be canceled
 * @returns true if a job was canceled, false if no job was found
 */
export function cancelGracePeriodJob(userId: string): boolean {
	const jobName = `deprovision-${userId}`;
	const job = schedule.scheduledJobs[jobName];

	if (job) {
		job.cancel();
		console.log(`Canceled grace period job for user ${userId}`);
		return true;
	}

	console.log(`No grace period job found for user ${userId}`);
	return false;
}

