import schedule from 'node-schedule';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { orchestrator } from '$lib/orchestrator/client';

/**
 * Schedule a container deprovisioning job to run after the grace period ends.
 * The job will only deprovision if the subscription is still in grace_period status.
 *
 * @param telegramId - The Telegram user ID whose container should be deprovisioned
 * @param subscriptionId - The subscription ID (for logging)
 */
export async function scheduleGracePeriodDeprovision(
	telegramId: number,
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
			.where(eq(subscriptions.telegramId, telegramId));

		// Schedule the deprovisioning job
		const jobName = `deprovision-${telegramId}`;
		const job = schedule.scheduleJob(jobName, gracePeriodEnd, async () => {
			console.log(`Grace period job running for user ${telegramId}`);

			try {
				// CRITICAL: Check subscription status before deprovisioning
				// The subscription might have been uncanceled during grace period
				const subscription = await db.query.subscriptions.findFirst({
					where: eq(subscriptions.telegramId, telegramId)
				});

				if (!subscription) {
					console.error(`No subscription found for user ${telegramId}`);
					return;
				}

				// Only deprovision if still in grace period
				if (subscription.status === 'grace_period') {
					console.log(`Deprovisioning container for user ${telegramId} (grace period expired)`);

					// Deprovision container via orchestrator (removeData=true since grace period expired)
					await orchestrator.deprovisionContainer(String(telegramId), true);

					// Update subscription status
					await db
						.update(subscriptions)
						.set({
							status: 'canceled',
							containerProvisioned: false,
							containerId: null,
							containerName: null,
							updatedAt: new Date()
						})
						.where(eq(subscriptions.telegramId, telegramId));

					console.log(`Container deprovisioned for user ${telegramId}`);
				} else {
					console.log(
						`Skipping deprovisioning for user ${telegramId} - subscription status is ${subscription.status} (not grace_period)`
					);
				}
			} catch (error) {
				console.error(`Failed to deprovision container for user ${telegramId}:`, error);
			}
		});

		console.log(`Grace period deprovisioning job scheduled for user ${telegramId} at ${gracePeriodEnd.toISOString()}`);

		return job;
	} catch (error) {
		console.error(`Failed to schedule grace period job for user ${telegramId}:`, error);
		throw error;
	}
}

/**
 * Cancel a scheduled grace period deprovisioning job.
 * Call this when a subscription is uncanceled or payment is recovered.
 *
 * @param telegramId - The Telegram user ID whose job should be canceled
 * @returns true if a job was canceled, false if no job was found
 */
export function cancelGracePeriodJob(telegramId: number): boolean {
	const jobName = `deprovision-${telegramId}`;
	const job = schedule.scheduledJobs[jobName];

	if (job) {
		job.cancel();
		console.log(`Canceled grace period job for user ${telegramId}`);
		return true;
	}

	console.log(`No grace period job found for user ${telegramId}`);
	return false;
}
