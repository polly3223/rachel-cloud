import { auth } from '$lib/auth/config';
import { getSession } from '$lib/auth/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Check if this is an auth API request
	const authResponse = auth.handler(event.request);
	if (authResponse) {
		return authResponse;
	}

	// Attach session to event.locals for all other requests
	event.locals.session = await getSession(event);

	return resolve(event);
};
