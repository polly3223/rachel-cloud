import { a as auth } from "../chunks/config.js";
import { g as getSession } from "../chunks/session.js";
const handle = async ({ event, resolve }) => {
  const authResponse = auth.handler(event.request);
  if (authResponse) {
    return authResponse;
  }
  event.locals.session = await getSession(event);
  return resolve(event);
};
export {
  handle
};
