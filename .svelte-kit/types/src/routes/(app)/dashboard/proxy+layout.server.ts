// @ts-nocheck
import { requireAuth } from '$lib/auth/session';
import type { LayoutServerLoad } from './$types';

export const load = async (event: Parameters<LayoutServerLoad>[0]) => {
	// Require authentication - redirects to /login if not authenticated
	const session = await requireAuth(event);

	return {
		user: session.user
	};
};
