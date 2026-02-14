import { auth } from '$lib/auth/config';
import { getSession } from '$lib/auth/session';
import type { Handle } from '@sveltejs/kit';

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

	return resolve(event);
};
