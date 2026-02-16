/**
 * Admin dashboard data aggregation functions.
 *
 * Queries all users with their subscription and container status from the database,
 * then computes revenue metrics (MRR), cost estimates (Docker host), and profit margin.
 *
 * All data comes from the local DB -- no external API calls are made here
 * to keep the dashboard load fast.
 *
 * @module admin/data
 */

import { db } from '$lib/db';
import { users, subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single user row enriched with subscription and container data. */
export interface AdminUser {
	telegramId: number;
	firstName: string | null;
	username: string | null;
	createdAt: Date;
	subscriptionStatus: string | null;
	containerProvisioned: boolean;
	containerId: string | null;
	containerName: string | null;
	currentImage: string | null;
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
	runningContainerCount: number;
	estimatedMonthlyCost: number;
	profitMargin: number;
	users: AdminUser[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Revenue per active subscriber per month (USD). */
const PRICE_PER_SUBSCRIBER_USD = 20;

/**
 * Estimated Docker host cost per month (EUR).
 * Single shared Hetzner server running all containers.
 */
const DOCKER_HOST_COST_EUR = 15;

/**
 * Maximum estimated Claude AI cost per month (EUR).
 * Budget cap for Anthropic API usage across all containers.
 */
const AI_MAX_COST_EUR = 80;

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
				telegramId: users.telegramId,
				firstName: users.firstName,
				username: users.username,
				createdAt: users.createdAt,
				subscriptionStatus: subscriptions.status,
				containerProvisioned: subscriptions.containerProvisioned,
				containerId: subscriptions.containerId,
				containerName: subscriptions.containerName,
				currentImage: subscriptions.currentImage,
				provisioningStatus: subscriptions.provisioningStatus,
				provisionedAt: subscriptions.provisionedAt,
			})
			.from(users)
			.leftJoin(subscriptions, eq(users.telegramId, subscriptions.telegramId))
			.orderBy(users.createdAt);

		// Map rows to AdminUser[]
		const mappedUsers: AdminUser[] = allUsers.map((row) => ({
			telegramId: row.telegramId,
			firstName: row.firstName,
			username: row.username,
			createdAt: row.createdAt,
			subscriptionStatus: row.subscriptionStatus ?? null,
			containerProvisioned: !!(row.containerProvisioned),
			containerId: row.containerId ?? null,
			containerName: row.containerName ?? null,
			currentImage: row.currentImage ?? null,
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
		const runningContainerCount = mappedUsers.filter(
			(u) => u.containerProvisioned === true && u.containerId !== null
		).length;

		// Financial metrics
		const totalMRR = activeSubscribers * PRICE_PER_SUBSCRIBER_USD;
		const estimatedMonthlyCost = DOCKER_HOST_COST_EUR + AI_MAX_COST_EUR;
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
			runningContainerCount,
			estimatedMonthlyCost,
			profitMargin,
			users: mappedUsers,
		};
	} catch (error) {
		console.error('[admin/data] Failed to fetch admin overview:', error);
		throw error;
	}
}
