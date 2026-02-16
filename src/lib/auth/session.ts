/**
 * Telegram session management via signed cookies.
 *
 * Replaces Better Auth's session management with lightweight HMAC-signed cookies.
 * The session cookie contains the Telegram user data, signed with SESSION_SECRET.
 *
 * TODO (Plan 14-02): Implement full HMAC signing/verification.
 * For now, provides the type definitions and cookie helpers used by hooks.server.ts.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestEvent, Cookies } from '@sveltejs/kit';
import { createHmac } from 'crypto';

export type TelegramSession = {
	telegramId: number;
	firstName: string;
	lastName?: string;
	username?: string;
	photoUrl?: string;
};

const COOKIE_NAME = 'rachel_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSessionSecret(): string {
	const secret = process.env.SESSION_SECRET;
	if (!secret) {
		throw new Error('SESSION_SECRET env var is required');
	}
	return secret;
}

/**
 * Sign session data with HMAC-SHA256.
 */
function signSession(data: TelegramSession): string {
	const payload = JSON.stringify(data);
	const hmac = createHmac('sha256', getSessionSecret())
		.update(payload)
		.digest('hex');
	return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64');
}

/**
 * Verify and decode a signed session cookie.
 */
function verifySession(cookie: string): TelegramSession | null {
	try {
		const decoded = JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
		const { payload, hmac } = decoded;

		const expectedHmac = createHmac('sha256', getSessionSecret())
			.update(payload)
			.digest('hex');

		if (hmac !== expectedHmac) {
			return null;
		}

		return JSON.parse(payload) as TelegramSession;
	} catch {
		return null;
	}
}

/**
 * Create a session cookie for the given Telegram user data.
 */
export function createSessionCookie(cookies: Cookies, session: TelegramSession): void {
	const signed = signSession(session);
	cookies.set(COOKIE_NAME, signed, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: COOKIE_MAX_AGE,
	});
}

/**
 * Read and verify the session cookie.
 */
export function getSessionFromCookie(cookies: Cookies): TelegramSession | null {
	const cookie = cookies.get(COOKIE_NAME);
	if (!cookie) return null;
	return verifySession(cookie);
}

/**
 * Clear the session cookie (logout).
 */
export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

/**
 * Require authentication — redirect to /login if no session.
 */
export function requireAuth(event: RequestEvent): TelegramSession {
	const session = event.locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}
	return session;
}
