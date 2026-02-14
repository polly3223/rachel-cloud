import { requireAuth } from '$lib/auth/session';
import { getValidToken } from '$lib/auth/claude-token-manager';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/db';
import { claudeTokens } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Manually refresh Claude OAuth tokens
 * POST /api/claude/refresh
 */
export async function POST(event: RequestEvent) {
	try {
		// Ensure user is authenticated
		const session = await requireAuth(event);
		const userId = session.user.id;

		// Attempt to get valid token (will auto-refresh if needed)
		const token = await getValidToken(userId);

		if (!token) {
			throw error(404, 'Claude account not connected');
		}

		// Fetch updated token info from database
		const records = await db
			.select()
			.from(claudeTokens)
			.where(eq(claudeTokens.userId, userId))
			.limit(1);

		if (records.length === 0) {
			throw error(404, 'Claude account not connected');
		}

		const record = records[0];

		return json({
			success: true,
			expiresAt: record.expiresAt.toISOString(),
			message: 'Token refreshed successfully'
		});
	} catch (err) {
		// Handle SvelteKit errors (redirect, error())
		if (err instanceof Response) {
			throw err;
		}

		console.error('Token refresh error:', err);
		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to refresh token'
			},
			{ status: 500 }
		);
	}
}
