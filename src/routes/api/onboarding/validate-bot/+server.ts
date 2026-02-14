import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth/session';
import { validateTelegramBotToken } from '$lib/onboarding/telegram-validator';
import { encryptToken } from '$lib/crypto/encryption';
import { db } from '$lib/db';
import { telegramBots } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// TODO: Add rate limiting (max 5 validation attempts per hour per user)

/**
 * Validate and store a Telegram bot token
 * POST /api/onboarding/validate-bot
 */
export async function POST(event: RequestEvent) {
	try {
		// Require authentication
		const session = await requireAuth(event);
		const userId = session.user.id;

		// Parse request body
		const body = await event.request.json();
		const { token } = body;

		// Validate input
		if (!token || typeof token !== 'string' || token.trim().length === 0) {
			return json({ error: 'Token is required' }, { status: 400 });
		}

		// Validate token with Telegram API
		const validation = await validateTelegramBotToken(token.trim());

		if (!validation.valid) {
			return json({ error: validation.error }, { status: 400 });
		}

		// Encrypt the token
		const encryptedToken = encryptToken(token.trim());

		// Store in database (upsert)
		await db
			.insert(telegramBots)
			.values({
				id: randomUUID(),
				userId,
				botUsername: validation.botUsername || null,
				encryptedToken,
				validated: true,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: telegramBots.userId,
				set: {
					botUsername: validation.botUsername || null,
					encryptedToken,
					validated: true,
					updatedAt: new Date()
				}
			});

		// Return success
		return json({
			success: true,
			botUsername: validation.botUsername
		});
	} catch (error) {
		// Handle unexpected errors
		console.error('Bot validation error:', error);

		// If this is a redirect (from requireAuth), re-throw it
		if (error instanceof Response) {
			throw error;
		}

		return json(
			{ error: 'An unexpected error occurred. Please try again.' },
			{ status: 500 }
		);
	}
}
