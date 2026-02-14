import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { getVPSStatus } from '$lib/provisioning/vps-status';
import { db } from '$lib/db';
import { healthChecks } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
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

	// Load health monitoring status if VPS is provisioned
	let healthStatus: {
		status: string;
		lastCheckAt: Date | null;
		lastHealthyAt: Date | null;
		consecutiveFailures: number;
		circuitState: string;
		totalChecks: number;
		totalRecoveries: number;
	} | null = null;

	if (subscription?.vpsProvisioned) {
		const healthRecord = await db.query.healthChecks.findFirst({
			where: eq(healthChecks.userId, session.user.id)
		});
		if (healthRecord) {
			healthStatus = {
				status: healthRecord.status,
				lastCheckAt: healthRecord.lastCheckAt,
				lastHealthyAt: healthRecord.lastHealthyAt,
				consecutiveFailures: healthRecord.consecutiveFailures,
				circuitState: healthRecord.circuitState,
				totalChecks: healthRecord.totalChecks,
				totalRecoveries: healthRecord.totalRecoveries,
			};
		}
	}

	return {
		subscription,
		hasActiveSubscription: subscription?.status === 'active',
		isGracePeriod: subscription?.status === 'grace_period',
		vpsStatus,
		healthStatus,
	};
};
