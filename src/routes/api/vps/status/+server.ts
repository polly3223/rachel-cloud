/**
 * GET /api/vps/status
 *
 * Returns the current VPS status for the authenticated user.
 * Combines Hetzner API server status with SSH uptime check.
 *
 * Requires: authenticated session + active subscription with provisioned VPS.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/session';
import { getSubscription } from '$lib/billing/subscription-manager';
import { getVPSStatus, getServiceUptime } from '$lib/provisioning/vps-status';

export const GET: RequestHandler = async (event) => {
	try {
		// Require authenticated session
		const session = await requireAuth(event);

		// Get user's subscription
		const subscription = await getSubscription(session.user.id);

		if (!subscription) {
			return json({ status: 'no_subscription' }, { status: 403 });
		}

		// Check if VPS is provisioned
		if (!subscription.vpsProvisioned || !subscription.hetznerServerId) {
			return json({ status: 'not_provisioned' });
		}

		// Get Hetzner API status
		const hetznerStatus = await getVPSStatus(subscription.hetznerServerId);

		// If server is running, also check uptime via SSH
		let uptime = '';
		if (
			hetznerStatus.status === 'running' &&
			subscription.vpsIpAddress &&
			subscription.sshPrivateKey
		) {
			const uptimeResult = await getServiceUptime(
				subscription.vpsIpAddress,
				subscription.sshPrivateKey
			);
			uptime = uptimeResult.uptime;
		}

		return json({
			status: hetznerStatus.status,
			ip: hetznerStatus.ip,
			datacenter: hetznerStatus.datacenter,
			uptime,
			created: hetznerStatus.created,
		});
	} catch (error) {
		// requireAuth throws redirect, not an error -- so this catches unexpected failures
		console.error('VPS status check failed:', error);
		return json(
			{ status: 'error', message: 'Failed to check VPS status' },
			{ status: 500 }
		);
	}
};
