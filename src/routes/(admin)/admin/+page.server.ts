import { requireAdmin } from '$lib/admin/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require admin authentication (defense in depth — also checked in layout)
	await requireAdmin(event);

	// Actual data loading comes in Plan 04
	return {};
};
