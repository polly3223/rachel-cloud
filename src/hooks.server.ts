import { auth } from '$lib/auth/config';
import { getSession } from '$lib/auth/session';
import { isAdmin } from '$lib/admin/guard';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Only route /api/auth/* requests through Better Auth handler
	if (event.url.pathname.startsWith('/api/auth')) {
		const authResponse = await auth.handler(event.request);
		if (authResponse) {
			return authResponse;
		}
	}

	// Attach session to event.locals for all other requests
	event.locals.session = await getSession(event);

	// Admin route guard: redirect non-admin users away from /admin/*
	if (event.url.pathname.startsWith('/admin')) {
		const session = event.locals.session;
		if (!session || !isAdmin(session.user.email)) {
			throw redirect(302, '/dashboard');
		}
	}

	return resolve(event);
};
