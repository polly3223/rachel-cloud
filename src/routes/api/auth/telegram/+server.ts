/**
 * POST /api/auth/telegram
 *
 * Verifies Telegram Login Widget data and creates a session cookie.
 * Uses HMAC-SHA256 verification as specified by Telegram:
 *   https://core.telegram.org/widgets/login#checking-authorization
 *
 * @module auth-telegram
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHmac, createHash } from 'crypto';
import { createSessionCookie } from '$lib/auth/session';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

/**
 * Verify Telegram Login Widget data using HMAC-SHA256.
 */
function verifyTelegramAuth(data: Record<string, string>): boolean {
	const { hash, ...rest } = data;
	if (!hash) return false;

	// Build the data-check-string: sorted key=value pairs joined by newline
	const dataCheckString = Object.keys(rest)
		.sort()
		.map((key) => `${key}=${rest[key]}`)
		.join('\n');

	// Secret key = SHA256(bot_token)
	const secretKey = createHash('sha256').update(BOT_TOKEN).digest();

	// HMAC = HMAC-SHA256(data_check_string, secret_key)
	const hmac = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

	return hmac === hash;
}

/**
 * GET /api/auth/telegram?id=...&first_name=...&hash=...
 * Redirect mode: Telegram sends user data as query params after login.
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const data: Record<string, string> = {};
		for (const [key, value] of url.searchParams.entries()) {
			data[key] = value;
		}

		if (!verifyTelegramAuth(data)) {
			return new Response('Invalid Telegram authentication data', { status: 401 });
		}

		const authDate = parseInt(data.auth_date, 10);
		const now = Math.floor(Date.now() / 1000);
		if (now - authDate > 300) {
			return new Response('Authentication data expired', { status: 401 });
		}

		const telegramId = parseInt(data.id, 10);
		const firstName = data.first_name || '';
		const lastName = data.last_name || undefined;
		const username = data.username || undefined;
		const photoUrl = data.photo_url || undefined;

		const existingUser = await db.query.users.findFirst({
			where: eq(users.telegramId, telegramId),
		});

		if (existingUser) {
			await db
				.update(users)
				.set({ firstName, lastName, username, photoUrl, updatedAt: new Date() })
				.where(eq(users.telegramId, telegramId));
		} else {
			await db.insert(users).values({
				telegramId, firstName, lastName, username, photoUrl,
				createdAt: new Date(), updatedAt: new Date(),
			});
		}

		createSessionCookie(cookies, { telegramId, firstName, lastName, username, photoUrl });

		// Redirect to dashboard after successful login
		return new Response(null, {
			status: 302,
			headers: { Location: '/dashboard' },
		});
	} catch (error) {
		console.error('[auth/telegram] GET Error:', error);
		return new Response('Authentication failed', { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = await request.json();

		// Verify the Telegram auth data
		if (!verifyTelegramAuth(data)) {
			return json({ error: 'Invalid Telegram authentication data' }, { status: 401 });
		}

		// Check auth_date is not too old (allow up to 5 minutes)
		const authDate = parseInt(data.auth_date, 10);
		const now = Math.floor(Date.now() / 1000);
		if (now - authDate > 300) {
			return json({ error: 'Authentication data expired' }, { status: 401 });
		}

		const telegramId = parseInt(data.id, 10);
		const firstName = data.first_name || '';
		const lastName = data.last_name || undefined;
		const username = data.username || undefined;
		const photoUrl = data.photo_url || undefined;

		// Upsert user in database
		const existingUser = await db.query.users.findFirst({
			where: eq(users.telegramId, telegramId),
		});

		if (existingUser) {
			await db
				.update(users)
				.set({
					firstName,
					lastName,
					username,
					photoUrl,
					updatedAt: new Date(),
				})
				.where(eq(users.telegramId, telegramId));
		} else {
			await db.insert(users).values({
				telegramId,
				firstName,
				lastName,
				username,
				photoUrl,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// Create session cookie
		createSessionCookie(cookies, {
			telegramId,
			firstName,
			lastName,
			username,
			photoUrl,
		});

		return json({ ok: true });
	} catch (error) {
		console.error('[auth/telegram] Error:', error);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};
