import { requireAdmin } from '$lib/admin/guard';
import { getAdminOverview } from '$lib/admin/data';
import { PRICING } from '$lib/config/pricing';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require admin authentication (defense in depth -- also checked in layout)
	await requireAdmin(event);

	const overview = await getAdminOverview();

	return { overview, pricePerSub: PRICING.amount };
};
