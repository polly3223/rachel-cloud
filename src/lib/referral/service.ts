/**
 * Referral service — STUBBED for Telegram-first migration.
 *
 * The referral system needs redesigning for the Telegram model.
 * Previously used Better Auth user IDs and a separate referrals table.
 * TODO: Rebuild referral system using Telegram user IDs.
 *
 * For now, all methods return empty/zero values so the UI doesn't break.
 */

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://get-rachel.com';

/**
 * Generate a referral code for a user — STUB.
 */
export async function generateReferralCode(_userId: string): Promise<string> {
	// TODO: Implement with Telegram user IDs
	return 'COMING-SOON';
}

/**
 * Get the full referral signup URL for a given code.
 */
export function getReferralLink(code: string): string {
	return `${BASE_URL}/?ref=${code}`;
}

/**
 * Process a referral — STUB.
 */
export async function processReferral(
	_referredUserId: string,
	_referralCode: string
): Promise<boolean> {
	// TODO: Implement with Telegram user IDs
	return false;
}

/**
 * Get referral statistics for a user — STUB.
 */
export async function getReferralStats(_userId: string): Promise<{
	totalReferrals: number;
	pendingReferrals: number;
	earnedCredits: number;
	referralCode: string;
	referralLink: string;
}> {
	return {
		totalReferrals: 0,
		pendingReferrals: 0,
		earnedCredits: 0,
		referralCode: 'COMING-SOON',
		referralLink: getReferralLink('COMING-SOON'),
	};
}

/**
 * Get or create a referral code for a user — STUB.
 */
export async function getUserReferralCode(_userId: string): Promise<string> {
	return generateReferralCode(_userId);
}
