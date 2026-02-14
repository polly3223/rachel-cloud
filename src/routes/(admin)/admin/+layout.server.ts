import { requireAdmin } from '$lib/admin/guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Require admin authentication - redirects to /login if not authenticated,
	// or /dashboard if not admin
	const session = await requireAdmin(event);

	return {
		user: session.user
	};
};
