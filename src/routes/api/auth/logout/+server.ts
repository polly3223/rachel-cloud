/**
 * POST /api/auth/logout
 *
 * Clears the session cookie.
 *
 * @module auth-logout
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSessionCookie } from '$lib/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	clearSessionCookie(cookies);
	return json({ ok: true });
};
