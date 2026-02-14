import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { polarClient } from '$lib/billing/polar-client';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateSubscriptionStatus, scheduleGracePeriod } from '$lib/billing/subscription-manager';
import { cancelGracePeriodJob } from '$lib/jobs/grace-period-enforcer';
import { sendSubscriptionCanceledEmail } from '$lib/email/sender';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts
		}
	}),
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
			enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
		}
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24 // Refresh daily
	},
	basePath: '/api/auth',
	baseURL: process.env.PUBLIC_BASE_URL || 'http://localhost:5173',
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({
					products: [
						{
							productId: process.env.POLAR_PRODUCT_ID!,
							slug: 'rachel-cloud-monthly'
						}
					],
					successUrl: '/onboarding?checkout_id={CHECKOUT_ID}',
					authenticatedUsersOnly: true
				}),
				portal(),
				webhooks({
					secret: process.env.POLAR_WEBHOOK_SECRET!,
					onSubscriptionActive: async (payload) => {
						try {
							console.log('Webhook: subscription.active', payload);

							const customerId = payload.data.customerId;

							// Find user by searching for subscription with this Polar customer ID
							const existingSub = await db.query.subscriptions.findFirst({
								where: eq(schema.subscriptions.polarCustomerId, customerId)
							});

							if (!existingSub) {
								console.error('No subscription found for customer:', customerId);
								return;
							}

							await updateSubscriptionStatus({
								userId: existingSub.userId,
								polarCustomerId: customerId,
								polarSubscriptionId: payload.data.id,
								status: 'active',
								currentPeriodEnd: payload.data.currentPeriodEnd ? new Date(payload.data.currentPeriodEnd) : undefined,
								gracePeriodEndsAt: null // Clear grace period
							});

							console.log('Subscription activated for user:', existingSub.userId);
						} catch (error) {
							console.error('Error handling subscription.active webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onSubscriptionCanceled: async (payload) => {
						try {
							console.log('Webhook: subscription.canceled', payload);

							const customerId = payload.data.customerId;

							// Find user by searching for subscription with this Polar customer ID
							const existingSub = await db.query.subscriptions.findFirst({
								where: eq(schema.subscriptions.polarCustomerId, customerId)
							});

							if (!existingSub) {
								console.error('No subscription found for customer:', customerId);
								return;
							}

							// Get user details for email
							const user = await db.query.users.findFirst({
								where: eq(schema.users.id, existingSub.userId)
							});

							// Schedule grace period (3 days)
							const gracePeriodEnd = await scheduleGracePeriod(existingSub.userId, payload.data.id);

							// Send email notification
							if (user?.email) {
								await sendSubscriptionCanceledEmail(user.email, user.name || 'User', gracePeriodEnd);
							}

							console.log('Grace period scheduled for user:', existingSub.userId);
						} catch (error) {
							console.error('Error handling subscription.canceled webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onSubscriptionRevoked: async (payload) => {
						try {
							console.log('Webhook: subscription.revoked', payload);

							const customerId = payload.data.customerId;

							// Find user by searching for subscription with this Polar customer ID
							const existingSub = await db.query.subscriptions.findFirst({
								where: eq(schema.subscriptions.polarCustomerId, customerId)
							});

							if (!existingSub) {
								console.error('No subscription found for customer:', customerId);
								return;
							}

							// Revoked = immediate deprovision (no grace period)
							await updateSubscriptionStatus({
								userId: existingSub.userId,
								polarCustomerId: customerId,
								polarSubscriptionId: payload.data.id,
								status: 'canceled',
								gracePeriodEndsAt: null
							});

							// Set VPS to not provisioned immediately
							await db.update(schema.subscriptions)
								.set({ vpsProvisioned: false, updatedAt: new Date() })
								.where(eq(schema.subscriptions.userId, existingSub.userId));

							console.log('Subscription revoked for user:', existingSub.userId);
						} catch (error) {
							console.error('Error handling subscription.revoked webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onSubscriptionUncanceled: async (payload) => {
						try {
							console.log('Webhook: subscription.uncanceled', payload);

							const customerId = payload.data.customerId;

							// Find user by searching for subscription with this Polar customer ID
							const existingSub = await db.query.subscriptions.findFirst({
								where: eq(schema.subscriptions.polarCustomerId, customerId)
							});

							if (!existingSub) {
								console.error('No subscription found for customer:', customerId);
								return;
							}

							// CRITICAL: Cancel scheduled grace period job to prevent data loss
							cancelGracePeriodJob(existingSub.userId);

							// Update subscription back to active, clear grace period
							await updateSubscriptionStatus({
								userId: existingSub.userId,
								polarCustomerId: customerId,
								polarSubscriptionId: payload.data.id,
								status: 'active',
								currentPeriodEnd: payload.data.currentPeriodEnd ? new Date(payload.data.currentPeriodEnd) : undefined,
								gracePeriodEndsAt: null
							});

							console.log('Subscription uncanceled for user:', existingSub.userId);
						} catch (error) {
							console.error('Error handling subscription.uncanceled webhook:', error);
							// Don't throw - webhook must return 200
						}
					}
				})
			]
		})
	]
});
