import pkceChallenge from "pkce-challenge";
const CLAUDE_OAUTH_CONFIG = {
  authorizationEndpoint: "https://claude.ai/oauth/authorize",
  tokenEndpoint: "https://claude.ai/oauth/token",
  clientId: process.env.CLAUDE_CLIENT_ID || "",
  clientSecret: process.env.CLAUDE_CLIENT_SECRET || "",
  get redirectUri() {
    return (process.env.PUBLIC_BASE_URL || "http://localhost:5173") + "/api/claude/callback";
  }
};
function generateAuthUrl() {
  const { code_verifier, code_challenge } = pkceChallenge();
  const params = new URLSearchParams({
    client_id: CLAUDE_OAUTH_CONFIG.clientId,
    redirect_uri: CLAUDE_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    code_challenge,
    code_challenge_method: "S256"
    // Add scope if needed by Claude OAuth (may need to be updated)
    // scope: 'openid profile email'
  });
  const authUrl = `${CLAUDE_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
  return {
    authUrl,
    codeVerifier: code_verifier
  };
}
async function exchangeCode(code, codeVerifier) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: CLAUDE_OAUTH_CONFIG.redirectUri,
    client_id: CLAUDE_OAUTH_CONFIG.clientId,
    client_secret: CLAUDE_OAUTH_CONFIG.clientSecret,
    code_verifier: codeVerifier
  });
  const response = await fetch(CLAUDE_OAUTH_CONFIG.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange authorization code: ${response.status} ${error}`);
  }
  const tokens = await response.json();
  return tokens;
}
async function refreshToken(refreshToken2) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken2,
    client_id: CLAUDE_OAUTH_CONFIG.clientId,
    client_secret: CLAUDE_OAUTH_CONFIG.clientSecret
  });
  const response = await fetch(CLAUDE_OAUTH_CONFIG.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${error}`);
  }
  const tokens = await response.json();
  return tokens;
}
export {
  exchangeCode as e,
  generateAuthUrl as g,
  refreshToken as r
};
