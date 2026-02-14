import { auth } from '$lib/auth/config';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export type Session = {
	user: {
		id: string;
		email: string;
		name: string | null;
		image: string | null;
		emailVerified: boolean;
	};
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
		ipAddress?: string;
		userAgent?: string;
	};
} | null;

/**
 * Get the current session from Better Auth
 * @param event - SvelteKit RequestEvent
 * @returns Session object or null if not authenticated
 */
export async function getSession(event: RequestEvent): Promise<Session> {
	try {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		return session as Session;
	} catch (error) {
		// Session validation failed or no session exists
		return null;
	}
}

/**
 * Require authentication for a route
 * Redirects to /login if user is not authenticated
 * @param event - SvelteKit RequestEvent
 * @returns Session object (guaranteed non-null)
 * @throws redirect(302, "/login") if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<NonNullable<Session>> {
	const session = await getSession(event);

	if (!session) {
		throw redirect(302, '/login');
	}

	return session;
}
