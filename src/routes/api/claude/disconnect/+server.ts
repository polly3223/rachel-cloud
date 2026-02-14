import { requireAuth } from '$lib/auth/session';
import { db } from '$lib/db';
import { claudeTokens } from '$lib/db/schema';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

/**
 * Disconnect Claude account (delete stored tokens)
 * POST /api/claude/disconnect
 */
export async function POST(event: RequestEvent) {
	try {
		// Ensure user is authenticated
		const session = await requireAuth(event);
		const userId = session.user.id;

		// Delete user's Claude tokens from database
		await db.delete(claudeTokens).where(eq(claudeTokens.userId, userId));

		return json({
			success: true,
			message: 'Claude account disconnected successfully'
		});
	} catch (err) {
		// Handle SvelteKit errors (redirect, error())
		if (err instanceof Response) {
			throw err;
		}

		console.error('Disconnect error:', err);
		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to disconnect'
			},
			{ status: 500 }
		);
	}
}
