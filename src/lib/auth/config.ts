import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { polarClient } from '$lib/billing/polar-client';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { updateSubscriptionStatus, scheduleGracePeriod } from '$lib/billing/subscription-manager';
import { cancelGracePeriodJob } from '$lib/jobs/grace-period-enforcer';
import { sendPaymentFailedEmail, sendSubscriptionCanceledEmail } from '$lib/email/sender';

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

							// Extract user ID from the session/user mapping
							const customerId = payload.data.customerId;

							// Get user from Better Auth session mapping
							// The Polar plugin should have stored the mapping
							const user = await db.query.users.findFirst({
								where: (users, { eq }) => eq(users.id, payload.data.userId || customerId)
							});

							if (!user) {
								console.error('User not found for customer:', customerId);
								return;
							}

							await updateSubscriptionStatus({
								userId: user.id,
								polarCustomerId: customerId,
								polarSubscriptionId: payload.data.id,
								status: 'active',
								currentPeriodEnd: payload.data.currentPeriodEnd ? new Date(payload.data.currentPeriodEnd) : undefined,
								gracePeriodEndsAt: null // Clear grace period
							});

							console.log('Subscription activated for user:', user.id);
						} catch (error) {
							console.error('Error handling subscription.active webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onSubscriptionCanceled: async (payload) => {
						try {
							console.log('Webhook: subscription.canceled', payload);

							const customerId = payload.data.customerId;

							// Get user from Better Auth session mapping
							const user = await db.query.users.findFirst({
								where: (users, { eq }) => eq(users.id, payload.data.userId || customerId)
							});

							if (!user) {
								console.error('User not found for customer:', customerId);
								return;
							}

							// Schedule grace period (3 days)
							const gracePeriodEnd = await scheduleGracePeriod(user.id, payload.data.id);

							// Send email notification
							if (user.email) {
								await sendSubscriptionCanceledEmail(user.email, user.name || 'User', gracePeriodEnd);
							}

							console.log('Grace period scheduled for user:', user.id);
						} catch (error) {
							console.error('Error handling subscription.canceled webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onSubscriptionRevoked: async (payload) => {
						try {
							console.log('Webhook: subscription.revoked', payload);

							const customerId = payload.data.customerId;

							// Get user from Better Auth session mapping
							const user = await db.query.users.findFirst({
								where: (users, { eq }) => eq(users.id, payload.data.userId || customerId)
							});

							if (!user) {
								console.error('User not found for customer:', customerId);
								return;
							}

							// Revoked = immediate deprovision (no grace period)
							await updateSubscriptionStatus({
								userId: user.id,
								polarCustomerId: customerId,
								polarSubscriptionId: payload.data.id,
								status: 'canceled',
								gracePeriodEndsAt: null
							});

							// Set VPS to not provisioned immediately
							await db.update(schema.subscriptions)
								.set({ vpsProvisioned: false, updatedAt: new Date() })
								.where((subscriptions, { eq }) => eq(subscriptions.userId, user.id));

							console.log('Subscription revoked for user:', user.id);
						} catch (error) {
							console.error('Error handling subscription.revoked webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onPaymentFailed: async (payload) => {
						try {
							console.log('Webhook: payment.failed', payload);

							const customerId = payload.data.customerId;

							// Get user from Better Auth session mapping
							const user = await db.query.users.findFirst({
								where: (users, { eq }) => eq(users.id, payload.data.userId || customerId)
							});

							if (!user) {
								console.error('User not found for customer:', customerId);
								return;
							}

							// Send payment failed email notification
							if (user.email) {
								await sendPaymentFailedEmail(user.email, user.name || 'User');
							}

							console.log('Payment failed notification sent for user:', user.id);
						} catch (error) {
							console.error('Error handling payment.failed webhook:', error);
							// Don't throw - webhook must return 200
						}
					},
					onSubscriptionUncanceled: async (payload) => {
						try {
							console.log('Webhook: subscription.uncanceled', payload);

							const customerId = payload.data.customerId;

							// Get user from Better Auth session mapping
							const user = await db.query.users.findFirst({
								where: (users, { eq }) => eq(users.id, payload.data.userId || customerId)
							});

							if (!user) {
								console.error('User not found for customer:', customerId);
								return;
							}

							// CRITICAL: Cancel scheduled grace period job to prevent data loss
							cancelGracePeriodJob(user.id);

							// Update subscription back to active, clear grace period
							await updateSubscriptionStatus({
								userId: user.id,
								polarCustomerId: customerId,
								polarSubscriptionId: payload.data.id,
								status: 'active',
								currentPeriodEnd: payload.data.currentPeriodEnd ? new Date(payload.data.currentPeriodEnd) : undefined,
								gracePeriodEndsAt: null
							});

							console.log('Subscription uncanceled for user:', user.id);
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
