import { auth } from '$lib/auth/config';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Require authentication for a route.
 * Returns the session if the user is authenticated, otherwise redirects to login.
 */
export async function requireAuth(event: RequestEvent) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session || !session.user) {
		throw redirect(302, '/api/auth/login');
	}

	return session;
}
