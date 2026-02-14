import { auth } from '$lib/auth/config';
import { rateLimitMiddleware } from '$lib/auth/rate-limit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Better Auth catch-all handler for all auth endpoints
 * Handles: sign-up, sign-in, sign-out, session, callback, etc.
 */
async function handleAuthRequest(event: RequestEvent) {
	// Apply rate limiting: 10 requests per minute per IP
	rateLimitMiddleware(event, 10, 60000);

	// Delegate to Better Auth handler
	return auth.handler(event.request);
}

export async function GET(event: RequestEvent) {
	return handleAuthRequest(event);
}

export async function POST(event: RequestEvent) {
	return handleAuthRequest(event);
}
