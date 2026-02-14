import { exchangeCode } from '$lib/auth/claude-oauth';
import { encryptToken } from '$lib/crypto/encryption';
import { db } from '$lib/db';
import { claudeTokens } from '$lib/db/schema';
import { requireAuth } from '$lib/auth/session';
import { redirect, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

/**
 * Handle Claude OAuth callback
 * GET /api/claude/callback?code=...
 */
export async function GET(event: RequestEvent) {
	try {
		// Ensure user is authenticated
		const session = await requireAuth(event);
		const userId = session.user.id;

		// Extract authorization code from query params
		const code = event.url.searchParams.get('code');
		if (!code) {
			throw error(400, 'Missing authorization code');
		}

		// Retrieve PKCE code verifier from cookie
		const codeVerifier = event.cookies.get('pkce_verifier');
		if (!codeVerifier) {
			throw error(400, 'PKCE flow incomplete: missing code verifier');
		}

		// Exchange authorization code for tokens
		const tokens = await exchangeCode(code, codeVerifier);

		// Encrypt access and refresh tokens
		const encryptedAccessToken = encryptToken(tokens.access_token);
		const encryptedRefreshToken = encryptToken(tokens.refresh_token);

		// Calculate token expiration timestamp
		const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

		// Check if user already has Claude tokens (update) or create new
		const existing = await db
			.select()
			.from(claudeTokens)
			.where(eq(claudeTokens.userId, userId))
			.limit(1);

		if (existing.length > 0) {
			// Update existing tokens
			await db
				.update(claudeTokens)
				.set({
					encryptedAccessToken,
					encryptedRefreshToken,
					expiresAt,
					updatedAt: new Date()
				})
				.where(eq(claudeTokens.userId, userId));
		} else {
			// Insert new tokens
			await db.insert(claudeTokens).values({
				id: crypto.randomUUID(),
				userId,
				encryptedAccessToken,
				encryptedRefreshToken,
				expiresAt,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		// Clear PKCE verifier cookie (one-time use)
		event.cookies.delete('pkce_verifier', { path: '/' });

		// Redirect to Claude dashboard with success message
		throw redirect(302, '/dashboard/claude?success=true');
	} catch (err) {
		// Clear PKCE verifier on error
		event.cookies.delete('pkce_verifier', { path: '/' });

		// Handle different error types
		if (err instanceof Response) {
			throw err;
		}

		console.error('Claude OAuth callback error:', err);
		throw error(500, `OAuth callback failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
}
