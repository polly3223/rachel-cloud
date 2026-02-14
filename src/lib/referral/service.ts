import { db } from '$lib/db';
import { users, referrals } from '$lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://get-rachel.com';

/**
 * Generate a random 8-character alphanumeric string.
 */
function randomAlphanumeric(length: number): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join('');
}

/**
 * Generate a unique 8-character alphanumeric referral code for a user.
 * If the user already has a referral code, returns the existing one.
 */
export async function generateReferralCode(userId: string): Promise<string> {
	// Check if user already has a referral code
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { referralCode: true }
	});

	if (user?.referralCode) {
		return user.referralCode;
	}

	// Generate a unique 8-char alphanumeric code
	let code: string = '';
	let attempts = 0;
	const maxAttempts = 10;

	do {
		code = randomAlphanumeric(8);

		// Check uniqueness
		const existing = await db.query.users.findFirst({
			where: eq(users.referralCode, code),
			columns: { id: true }
		});

		if (!existing) break;
		attempts++;
	} while (attempts < maxAttempts);

	if (attempts >= maxAttempts) {
		throw new Error('Failed to generate unique referral code');
	}

	// Save code to user record
	await db
		.update(users)
		.set({ referralCode: code })
		.where(eq(users.id, userId));

	return code;
}

/**
 * Get the full referral signup URL for a given code.
 */
export function getReferralLink(code: string): string {
	return `${BASE_URL}/signup?ref=${code}`;
}

/**
 * Process a referral when a new user subscribes.
 * Looks up the referral code, links the referred user, and marks as completed.
 */
export async function processReferral(
	referredUserId: string,
	referralCode: string
): Promise<boolean> {
	// Find the referrer by their referral code
	const referrer = await db.query.users.findFirst({
		where: eq(users.referralCode, referralCode.toUpperCase()),
		columns: { id: true }
	});

	if (!referrer) {
		console.warn(`Referral code not found: ${referralCode}`);
		return false;
	}

	// Don't allow self-referral
	if (referrer.id === referredUserId) {
		console.warn(`Self-referral attempt by user ${referredUserId}`);
		return false;
	}

	// Check if this user was already referred
	const existingReferral = await db.query.referrals.findFirst({
		where: eq(referrals.referredId, referredUserId),
		columns: { id: true }
	});

	if (existingReferral) {
		console.warn(`User ${referredUserId} already has a referral record`);
		return false;
	}

	// Create the referral record as completed
	const referralId = crypto.randomUUID();
	await db.insert(referrals).values({
		id: referralId,
		referrerId: referrer.id,
		referredId: referredUserId,
		referralCode: referralCode.toUpperCase(),
		status: 'completed',
		creditAmountCents: 1000, // €10
		completedAt: new Date(),
		createdAt: new Date()
	});

	console.log(
		`Referral completed: ${referrer.id} referred ${referredUserId} with code ${referralCode}`
	);

	return true;
}

/**
 * Get referral statistics for a user.
 */
export async function getReferralStats(userId: string): Promise<{
	totalReferrals: number;
	pendingReferrals: number;
	earnedCredits: number;
	referralCode: string;
	referralLink: string;
}> {
	// Get or create the user's referral code
	const referralCode = await getUserReferralCode(userId);
	const referralLink = getReferralLink(referralCode);

	// Count total referrals (completed + credited)
	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(referrals)
		.where(
			and(
				eq(referrals.referrerId, userId),
				sql`${referrals.status} IN ('completed', 'credited')`
			)
		);
	const totalReferrals = totalResult[0]?.count ?? 0;

	// Count pending referrals
	const pendingResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(referrals)
		.where(
			and(eq(referrals.referrerId, userId), eq(referrals.status, 'pending'))
		);
	const pendingReferrals = pendingResult[0]?.count ?? 0;

	// Sum earned credits (completed + credited)
	const creditsResult = await db
		.select({ total: sql<number>`COALESCE(SUM(${referrals.creditAmountCents}), 0)` })
		.from(referrals)
		.where(
			and(
				eq(referrals.referrerId, userId),
				sql`${referrals.status} IN ('completed', 'credited')`
			)
		);
	const earnedCredits = creditsResult[0]?.total ?? 0;

	return {
		totalReferrals,
		pendingReferrals,
		earnedCredits,
		referralCode,
		referralLink
	};
}

/**
 * Get or create a referral code for a user.
 */
export async function getUserReferralCode(userId: string): Promise<string> {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { referralCode: true }
	});

	if (user?.referralCode) {
		return user.referralCode;
	}

	return generateReferralCode(userId);
}
