import { auth } from '$lib/auth/config';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	return auth.handler(event.request) || (await resolve(event));
};
