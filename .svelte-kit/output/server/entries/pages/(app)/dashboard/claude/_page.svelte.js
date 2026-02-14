import { Z as head, $ as attr, a4 as bind_props } from "../../../../../chunks/index2.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let refreshing = false;
    let disconnecting = false;
    let successMessage = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        successMessage = "Claude account connected successfully!";
        window.history.replaceState({}, "", "/dashboard/claude");
      }
    }
    function formatDate(isoDate) {
      if (!isoDate) return "Unknown";
      return new Date(isoDate).toLocaleString();
    }
    head("tl8dft", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Claude Connection - Rachel Cloud</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-3xl mx-auto"><div class="bg-white shadow rounded-lg p-6"><h1 class="text-3xl font-bold text-gray-900 mb-6">Claude Connection</h1> `);
    if (successMessage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">${escape_html(successMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!data.connected) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-6"><div class="flex items-center mb-4"><svg class="w-6 h-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <h2 class="text-xl font-semibold text-gray-700">Not Connected</h2></div> <p class="text-gray-600 mb-6">Connect your Claude account to enable AI-powered features. Your tokens will be stored
						securely with AES-256-GCM encryption.</p> <a href="/api/claude/connect" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors">Connect Claude Account</a></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="mb-6"><div class="flex items-center mb-4"><svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <h2 class="text-xl font-semibold text-green-700">Connected</h2></div> <div class="bg-gray-50 rounded p-4 mb-4"><p class="text-sm text-gray-600"><strong>Token Expires:</strong> ${escape_html(formatDate(data.expiresAt))}</p> <p class="text-xs text-gray-500 mt-2">Tokens are automatically refreshed when they expire.</p></div> <div class="flex gap-3"><button${attr("disabled", refreshing, true)} class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded transition-colors">${escape_html("Refresh Token")}</button> <button${attr("disabled", disconnecting, true)} class="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded transition-colors">${escape_html("Disconnect")}</button></div></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-8 border-t pt-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">Security &amp; Privacy</h3> <ul class="space-y-2 text-sm text-gray-600"><li class="flex items-start"><svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> OAuth 2.0 + PKCE flow for secure authorization</li> <li class="flex items-start"><svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> AES-256-GCM encryption for token storage</li> <li class="flex items-start"><svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Automatic token refresh when expired</li> <li class="flex items-start"><svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> HTTP-only cookies for PKCE verifier storage</li></ul></div></div></div></div>`);
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
