import { requireAuth } from '$lib/auth/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Require authentication - redirects to /login if not authenticated
	const session = await requireAuth(event);

	return {
		user: session.user
	};
};
