import { Z as head } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("z2s022", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Authenticating... - Rachel Cloud</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-md w-full space-y-8">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> <h2 class="mt-6 text-center text-2xl font-bold text-gray-900">Completing authentication...</h2> <p class="mt-2 text-center text-sm text-gray-600">Please wait a moment.</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
