import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { getVPSStatus } from '$lib/provisioning/vps-status';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require authentication
	const session = await requireAuth(event);

	// Get user's subscription from database
	const subscription = await getSubscription(session.user.id);

	// Load VPS status from Hetzner API if provisioned
	let vpsStatus: { status: string; ip: string; datacenter: string; created: string } | null =
		null;

	if (subscription?.vpsProvisioned && subscription.hetznerServerId) {
		try {
			vpsStatus = await getVPSStatus(subscription.hetznerServerId);
		} catch (err) {
			console.error('Failed to load VPS status on dashboard:', err);
			vpsStatus = {
				status: 'unknown',
				ip: subscription.vpsIpAddress || '',
				datacenter: '',
				created: '',
			};
		}
	}

	return {
		subscription,
		hasActiveSubscription: subscription?.status === 'active',
		isGracePeriod: subscription?.status === 'grace_period',
		vpsStatus,
	};
};
