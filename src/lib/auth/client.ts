import { createAuthClient } from 'better-auth/svelte';

/**
 * Better Auth client for frontend/browser use.
 * Provides authentication methods and Polar plugin functionality:
 * - Sign in/out
 * - Session management
 * - Polar checkout: authClient.checkout({ slug: 'product-slug' })
 * - Polar customer portal: authClient.customer.portal()
 */
export const authClient = createAuthClient({
	baseURL: '/api/auth'
});
