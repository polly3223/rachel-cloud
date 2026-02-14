// @ts-nocheck
import { requireAuth } from '$lib/auth/session';
import { db } from '$lib/db';
import { claudeTokens } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Load Claude connection status for the dashboard
 */
export const load = async (event: Parameters<PageServerLoad>[0]) => {
	// Ensure user is authenticated
	const session = await requireAuth(event);
	const userId = session.user.id;

	// Check if user has connected their Claude account
	const records = await db
		.select()
		.from(claudeTokens)
		.where(eq(claudeTokens.userId, userId))
		.limit(1);

	// Return connection status
	return {
		connected: records.length > 0,
		expiresAt: records.length > 0 ? records[0].expiresAt.toISOString() : null
	};
};
