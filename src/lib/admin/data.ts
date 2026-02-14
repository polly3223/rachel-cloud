/**
 * Admin dashboard data aggregation functions.
 *
 * Queries all users with their subscription and VPS status from the database,
 * then computes revenue metrics (MRR), cost estimates (Hetzner), and profit margin.
 *
 * All data comes from the local DB -- no external API calls are made here
 * to keep the dashboard load fast and avoid Hetzner rate limits.
 *
 * @module admin/data
 */

import { db } from '$lib/db';
import { users, subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single user row enriched with subscription and VPS data. */
export interface AdminUser {
	id: string;
	email: string;
	name: string | null;
	createdAt: Date;
	subscriptionStatus: string | null;
	vpsProvisioned: boolean;
	vpsIpAddress: string | null;
	hetznerServerId: number | null;
	provisioningStatus: string | null;
	provisionedAt: Date | null;
}

/** Aggregated overview for the admin dashboard. */
export interface AdminOverview {
	totalUsers: number;
	activeSubscribers: number;
	gracePeriodUsers: number;
	canceledUsers: number;
	totalMRR: number;
	runningVPSCount: number;
	estimatedMonthlyCost: number;
	profitMargin: number;
	users: AdminUser[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Revenue per active subscriber per month (USD). */
const PRICE_PER_SUBSCRIBER_USD = 20;

/** Estimated Hetzner cost per VPS per month (EUR). */
const COST_PER_VPS_EUR = 3.49;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all users with their subscription data and compute overview metrics.
 *
 * Performs a single LEFT JOIN query (users + subscriptions), then aggregates
 * counts and financial metrics in-memory.
 *
 * @returns AdminOverview with user list and computed metrics
 */
export async function getAdminOverview(): Promise<AdminOverview> {
	try {
		const allUsers = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				createdAt: users.createdAt,
				subscriptionStatus: subscriptions.status,
				vpsProvisioned: subscriptions.vpsProvisioned,
				vpsIpAddress: subscriptions.vpsIpAddress,
				hetznerServerId: subscriptions.hetznerServerId,
				provisioningStatus: subscriptions.provisioningStatus,
				provisionedAt: subscriptions.provisionedAt,
			})
			.from(users)
			.leftJoin(subscriptions, eq(users.id, subscriptions.userId))
			.orderBy(users.createdAt);

		// Map rows to AdminUser[], handling SQLite boolean (0/1 → boolean)
		const mappedUsers: AdminUser[] = allUsers.map((row) => ({
			id: row.id,
			email: row.email,
			name: row.name,
			createdAt: row.createdAt,
			subscriptionStatus: row.subscriptionStatus ?? null,
			vpsProvisioned: !!(row.vpsProvisioned),
			vpsIpAddress: row.vpsIpAddress ?? null,
			hetznerServerId: row.hetznerServerId ?? null,
			provisioningStatus: row.provisioningStatus ?? null,
			provisionedAt: row.provisionedAt ?? null,
		}));

		// Aggregate counts
		const activeSubscribers = mappedUsers.filter(
			(u) => u.subscriptionStatus === 'active'
		).length;
		const gracePeriodUsers = mappedUsers.filter(
			(u) => u.subscriptionStatus === 'grace_period'
		).length;
		const canceledUsers = mappedUsers.filter(
			(u) => u.subscriptionStatus === 'canceled'
		).length;
		const runningVPSCount = mappedUsers.filter(
			(u) => u.vpsProvisioned === true
		).length;

		// Financial metrics
		const totalMRR = activeSubscribers * PRICE_PER_SUBSCRIBER_USD;
		const estimatedMonthlyCost = runningVPSCount * COST_PER_VPS_EUR;
		const profitMargin =
			totalMRR > 0
				? ((totalMRR - estimatedMonthlyCost) / totalMRR) * 100
				: 0;

		return {
			totalUsers: mappedUsers.length,
			activeSubscribers,
			gracePeriodUsers,
			canceledUsers,
			totalMRR,
			runningVPSCount,
			estimatedMonthlyCost,
			profitMargin,
			users: mappedUsers,
		};
	} catch (error) {
		console.error('[admin/data] Failed to fetch admin overview:', error);
		throw error;
	}
}
