import pkceChallenge from 'pkce-challenge';
import { encryptToken, decryptToken } from '$lib/crypto/encryption';

/**
 * Claude OAuth 2.0 configuration
 * Based on claude-code-login reference implementation (github.com/grll/claude-code-login)
 *
 * NOTE: These endpoints may need to be updated when testing with real Claude accounts.
 * The actual Claude OAuth endpoints may not be publicly documented yet.
 */
const CLAUDE_OAUTH_CONFIG = {
	authorizationEndpoint: 'https://claude.ai/oauth/authorize',
	tokenEndpoint: 'https://claude.ai/oauth/token',
	clientId: process.env.CLAUDE_CLIENT_ID || '',
	clientSecret: process.env.CLAUDE_CLIENT_SECRET || '',
	get redirectUri() {
		return (process.env.PUBLIC_BASE_URL || 'http://localhost:5173') + '/api/claude/callback';
	}
};

export interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

/**
 * Generate Claude OAuth authorization URL with PKCE challenge
 * @returns Object containing the authorization URL and code verifier
 */
export function generateAuthUrl(): { authUrl: string; codeVerifier: string } {
	// Generate PKCE challenge
	const { code_verifier, code_challenge } = pkceChallenge();

	// Build authorization URL with PKCE parameters
	const params = new URLSearchParams({
		client_id: CLAUDE_OAUTH_CONFIG.clientId,
		redirect_uri: CLAUDE_OAUTH_CONFIG.redirectUri,
		response_type: 'code',
		code_challenge: code_challenge,
		code_challenge_method: 'S256',
		// Add scope if needed by Claude OAuth (may need to be updated)
		// scope: 'openid profile email'
	});

	const authUrl = `${CLAUDE_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;

	return {
		authUrl,
		codeVerifier: code_verifier
	};
}

/**
 * Exchange authorization code for access and refresh tokens
 * @param code - The authorization code from the OAuth callback
 * @param codeVerifier - The PKCE code verifier stored during authorization
 * @returns Token response with access_token, refresh_token, and expires_in
 */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
	const params = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: CLAUDE_OAUTH_CONFIG.redirectUri,
		client_id: CLAUDE_OAUTH_CONFIG.clientId,
		client_secret: CLAUDE_OAUTH_CONFIG.clientSecret,
		code_verifier: codeVerifier
	});

	const response = await fetch(CLAUDE_OAUTH_CONFIG.tokenEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json'
		},
		body: params.toString()
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to exchange authorization code: ${response.status} ${error}`);
	}

	const tokens: TokenResponse = await response.json();
	return tokens;
}

/**
 * Refresh an expired access token using the refresh token
 * @param refreshToken - The refresh token to use
 * @returns New token response with updated access_token and refresh_token
 */
export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
	const params = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: CLAUDE_OAUTH_CONFIG.clientId,
		client_secret: CLAUDE_OAUTH_CONFIG.clientSecret
	});

	const response = await fetch(CLAUDE_OAUTH_CONFIG.tokenEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json'
		},
		body: params.toString()
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to refresh token: ${response.status} ${error}`);
	}

	const tokens: TokenResponse = await response.json();
	return tokens;
}
