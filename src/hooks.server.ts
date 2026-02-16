import { getSessionFromCookie } from '$lib/auth/session';
import { isAdmin } from '$lib/admin/guard';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Attach Telegram session from signed cookie
	event.locals.session = getSessionFromCookie(event.cookies);

	// Admin route guard: redirect non-admin users away from /admin/*
	if (event.url.pathname.startsWith('/admin')) {
		const session = event.locals.session;
		if (!session || !isAdmin(session.telegramId)) {
			throw redirect(302, '/dashboard');
		}
	}

	return resolve(event);
};
