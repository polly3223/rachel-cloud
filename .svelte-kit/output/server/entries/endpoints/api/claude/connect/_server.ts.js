import { g as generateAuthUrl } from "../../../../../chunks/claude-oauth.js";
import { r as requireAuth } from "../../../../../chunks/session.js";
import { redirect } from "@sveltejs/kit";
async function GET(event) {
  await requireAuth(event);
  const { authUrl, codeVerifier } = generateAuthUrl();
  event.cookies.set("pkce_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5
    // 5 minutes
  });
  throw redirect(302, authUrl);
}
export {
  GET
};
