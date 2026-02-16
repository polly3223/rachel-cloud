import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { TelegramSession } from '$lib/auth/session';

/**
 * Check if the given Telegram user ID matches the ADMIN_TELEGRAM_ID env var.
 * Returns false if ADMIN_TELEGRAM_ID is not set.
 */
export function isAdmin(telegramId: number): boolean {
	const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
	if (!adminTelegramId) {
		return false;
	}
	return telegramId === Number(adminTelegramId);
}

/**
 * Require admin authentication for a route.
 * Redirects to /login if not authenticated, or /dashboard if not admin.
 * @param event - SvelteKit RequestEvent
 * @returns TelegramSession object (guaranteed non-null, guaranteed admin)
 * @throws redirect(302, "/login") if not authenticated
 * @throws redirect(302, "/dashboard") if not admin
 */
export function requireAdmin(event: RequestEvent): TelegramSession {
	const session = event.locals.session;

	if (!session) {
		throw redirect(302, '/login');
	}

	if (!isAdmin(session.telegramId)) {
		throw redirect(302, '/dashboard');
	}

	return session;
}
