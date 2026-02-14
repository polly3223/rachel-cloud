import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth, type Session } from '$lib/auth/session';

/**
 * Check if the given email matches the ADMIN_EMAIL env var.
 * Comparison is case-insensitive per RFC 5321.
 * Returns false if ADMIN_EMAIL is not set.
 */
export function isAdmin(email: string): boolean {
	const adminEmail = process.env.ADMIN_EMAIL;
	if (!adminEmail) {
		return false;
	}
	return email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Require admin authentication for a route.
 * Redirects to /login if not authenticated, or /dashboard if not admin.
 * @param event - SvelteKit RequestEvent
 * @returns Session object (guaranteed non-null, guaranteed admin)
 * @throws redirect(302, "/login") if not authenticated
 * @throws redirect(302, "/dashboard") if not admin
 */
export async function requireAdmin(event: RequestEvent): Promise<NonNullable<Session>> {
	const session = await requireAuth(event);

	if (!isAdmin(session.user.email)) {
		throw redirect(302, '/dashboard');
	}

	return session;
}
