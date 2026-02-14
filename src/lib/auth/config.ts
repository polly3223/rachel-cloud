import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { polarClient } from '$lib/billing/polar-client';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';

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
						console.log('TODO: Handle subscription active', payload);
					},
					onSubscriptionCanceled: async (payload) => {
						console.log('TODO: Handle subscription canceled', payload);
					},
					onSubscriptionRevoked: async (payload) => {
						console.log('TODO: Handle subscription revoked', payload);
					},
					onPaymentFailed: async (payload) => {
						console.log('TODO: Handle payment failed', payload);
					}
				})
			]
		})
	]
});
