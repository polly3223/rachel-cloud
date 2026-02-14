import { requireAdmin } from '$lib/admin/guard';
import {
	startRollout,
	getRolloutStatus,
	isRolloutInProgress
} from '$lib/updates/rollout-orchestrator';
import { db } from '$lib/db';
import { subscriptions } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const rolloutStatus = getRolloutStatus();

	// Count active provisioned VPSs
	const activeVPSs = await db
		.select({ userId: subscriptions.userId })
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.status, 'active'),
				eq(subscriptions.vpsProvisioned, true),
				eq(subscriptions.provisioningStatus, 'ready')
			)
		);

	return {
		rolloutStatus: {
			...rolloutStatus,
			startedAt: rolloutStatus.startedAt?.toISOString() ?? null,
			completedAt: rolloutStatus.completedAt?.toISOString() ?? null
		},
		activeVPSCount: activeVPSs.length
	};
};

export const actions: Actions = {
	trigger: async (event) => {
		await requireAdmin(event);

		if (isRolloutInProgress()) {
			return fail(400, { error: 'A rollout is already in progress' });
		}

		// Fire-and-forget: kick off rollout, admin polls for status
		void startRollout().catch((err) => {
			console.error('[admin/updates] Rollout error:', err);
		});

		return { triggered: true };
	}
};
