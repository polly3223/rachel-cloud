import { a as auth } from "./config.js";
import { redirect } from "@sveltejs/kit";
async function getSession(event) {
  try {
    const session = await auth.api.getSession({
      headers: event.request.headers
    });
    return session;
  } catch (error) {
    return null;
  }
}
async function requireAuth(event) {
  const session = await getSession(event);
  if (!session) {
    throw redirect(302, "/login");
  }
  return session;
}
export {
  getSession as g,
  requireAuth as r
};
