import { db } from '$lib/db';
import { claudeTokens } from '$lib/db/schema';
import { refreshToken as refreshClaudeToken } from '$lib/auth/claude-oauth';
import { encryptToken, decryptToken } from '$lib/crypto/encryption';
import { eq } from 'drizzle-orm';

/**
 * Get a valid Claude access token for a user
 * Automatically refreshes the token if it's expired
 * @param userId - The user ID to fetch tokens for
 * @returns Valid access token or null if no tokens exist
 */
export async function getValidToken(userId: string): Promise<string | null> {
	try {
		// Fetch user's Claude tokens from database
		const records = await db
			.select()
			.from(claudeTokens)
			.where(eq(claudeTokens.userId, userId))
			.limit(1);

		if (records.length === 0) {
			// User hasn't connected their Claude account
			return null;
		}

		const record = records[0];
		const now = new Date();

		// Check if token is expired (with 5 minute buffer for safety)
		const isExpired = record.expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

		if (!isExpired) {
			// Token is still valid, decrypt and return
			return decryptToken(record.encryptedAccessToken);
		}

		// Token is expired, need to refresh
		console.log(`Claude token expired for user ${userId}, refreshing...`);

		// Decrypt refresh token
		const refreshTokenValue = decryptToken(record.encryptedRefreshToken);

		// Call Claude OAuth to refresh tokens
		const newTokens = await refreshClaudeToken(refreshTokenValue);

		// Encrypt new tokens
		const encryptedAccessToken = encryptToken(newTokens.access_token);
		const encryptedRefreshToken = encryptToken(newTokens.refresh_token);

		// Calculate new expiration time
		const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

		// Update database with new tokens
		await db
			.update(claudeTokens)
			.set({
				encryptedAccessToken,
				encryptedRefreshToken,
				expiresAt,
				updatedAt: new Date()
			})
			.where(eq(claudeTokens.userId, userId));

		console.log(`Successfully refreshed Claude token for user ${userId}`);

		// Return new access token
		return newTokens.access_token;
	} catch (error) {
		console.error(`Failed to get valid Claude token for user ${userId}:`, error);
		return null;
	}
}
