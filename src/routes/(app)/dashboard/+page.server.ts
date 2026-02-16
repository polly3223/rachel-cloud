import { redirect } from '@sveltejs/kit';
import { getSubscription } from '$lib/billing/subscription-manager';
import { orchestrator } from '$lib/orchestrator/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = event.locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	// Get user's subscription from database
	const subscription = await getSubscription(session.telegramId);

	// Load container status from orchestrator if provisioned
	let containerStatus: {
		state: string;
		health: string;
		uptime: number;
		image: string;
		containerName: string;
	} | null = null;

	if (subscription?.containerProvisioned && subscription.containerId) {
		try {
			const result = await orchestrator.getContainerStatus(String(session.telegramId));
			if (result) {
				containerStatus = {
					state: result.container.state,
					health: result.container.health,
					uptime: result.container.uptime,
					image: result.container.image,
					containerName: result.container.containerName,
				};
			}
		} catch (err) {
			console.error('Failed to load container status on dashboard:', err);
			containerStatus = {
				state: 'unknown',
				health: 'unknown',
				uptime: 0,
				image: subscription.currentImage || '',
				containerName: subscription.containerName || '',
			};
		}
	}

	return {
		subscription,
		hasActiveSubscription: subscription?.status === 'active',
		isGracePeriod: subscription?.status === 'grace_period',
		containerStatus,
	};
};
