import { generateAuthUrl } from '$lib/auth/claude-oauth';
import { requireAuth } from '$lib/auth/session';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Initiate Claude OAuth 2.0 flow with PKCE
 * GET /api/claude/connect
 */
export async function GET(event: RequestEvent) {
	// Ensure user is authenticated
	await requireAuth(event);

	// Generate PKCE challenge and authorization URL
	const { authUrl, codeVerifier } = generateAuthUrl();

	// Store code verifier in encrypted HTTP-only cookie
	// This will be retrieved during the callback to complete PKCE flow
	event.cookies.set('pkce_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 5 // 5 minutes
	});

	// Redirect user to Claude authorization page
	throw redirect(302, authUrl);
}
