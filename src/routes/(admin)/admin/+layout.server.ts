import { requireAdmin } from '$lib/admin/guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Require admin authentication - redirects to /login if not authenticated,
	// or /dashboard if not admin
	const session = requireAdmin(event);

	return {
		user: {
			telegramId: session.telegramId,
			firstName: session.firstName,
			lastName: session.lastName,
			username: session.username,
			photoUrl: session.photoUrl,
		}
	};
};
