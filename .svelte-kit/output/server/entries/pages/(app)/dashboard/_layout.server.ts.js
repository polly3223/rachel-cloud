import { r as requireAuth } from "../../../../chunks/session.js";
const load = async (event) => {
  const session = await requireAuth(event);
  return {
    user: session.user
  };
};
export {
  load
};
