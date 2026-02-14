import { Z as head, _ as ensure_array_like, a0 as attr_class, $ as attr, a1 as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let deploying = false;
    let pollingStatus = data.subscription?.provisioningStatus ?? null;
    data.subscription?.vpsIpAddress ?? null;
    let pollingError = data.subscription?.provisioningError ?? null;
    const statusMessages = {
      pending: { label: "Preparing", description: "Preparing your VPS..." },
      creating: {
        label: "Creating Server",
        description: "Creating server on Hetzner..."
      },
      cloud_init: {
        label: "Installing Software",
        description: "Installing software and configuring system..."
      },
      injecting_secrets: {
        label: "Connecting Accounts",
        description: "Connecting your Claude and Telegram accounts..."
      },
      ready: {
        label: "Running",
        description: "Rachel is running on Telegram!"
      },
      failed: { label: "Failed", description: "Provisioning failed." }
    };
    const provisioningSteps = ["pending", "creating", "cloud_init", "injecting_secrets"];
    let currentStepIndex = provisioningSteps.indexOf(pollingStatus ?? "pending");
    function isProvisioning(status) {
      return status === "pending" || status === "creating" || status === "cloud_init" || status === "injecting_secrets";
    }
    head("1tyszyy", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dashboard - Rachel Cloud</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-4xl mx-auto"><div class="mb-6"><h1 class="text-3xl font-bold text-gray-900">Dashboard</h1> <p class="text-gray-600 mt-2">Manage your Rachel AI instance</p></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white shadow rounded-lg mb-6"><div class="px-6 py-5 border-b border-gray-200"><h2 class="text-xl font-semibold text-gray-900">Rachel Instance</h2></div> <div class="px-6 py-5">`);
    if (data.subscription?.vpsProvisioned && (pollingStatus === "ready" || pollingStatus === null)) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Running</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Rachel is running on Telegram!</h3> <p class="text-sm text-gray-600 mb-4">Your personal AI assistant is active and ready to chat. Open Telegram and send a message to your bot.</p> `);
      if (data.subscription?.vpsIpAddress) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-sm text-gray-500"><span class="font-medium">Server IP:</span> <code class="ml-1 px-2 py-0.5 bg-gray-100 rounded text-gray-700">${escape_html(data.subscription.vpsIpAddress)}</code></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else if (isProvisioning(pollingStatus)) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="flex items-start"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"><svg class="animate-spin w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${escape_html(statusMessages[pollingStatus ?? "pending"]?.label ?? "Provisioning")}</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Setting up your Rachel instance</h3> <p class="text-sm text-gray-600 mb-4">${escape_html(statusMessages[pollingStatus ?? "pending"]?.description ?? "Working on it...")}</p> <div class="space-y-3"><!--[-->`);
      const each_array = ensure_array_like(provisioningSteps);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let step = each_array[i];
        $$renderer2.push(`<div class="flex items-center">`);
        if (i < currentStepIndex) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`);
        } else if (i === currentStepIndex) {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<svg class="animate-spin w-5 h-5 text-blue-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div class="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0"></div>`);
        }
        $$renderer2.push(`<!--]--> <span${attr_class(`text-sm ${stringify(i <= currentStepIndex ? "text-gray-900 font-medium" : "text-gray-400")}`)}>${escape_html(statusMessages[step]?.description ?? step)}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else if (pollingStatus === "failed") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<div class="flex items-start"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg> Failed</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Provisioning Failed</h3> `);
      if (pollingError || data.subscription?.provisioningError) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4"><p class="text-sm text-red-700">${escape_html(pollingError || data.subscription?.provisioningError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <p class="text-sm text-gray-600 mb-4">Something went wrong during setup. Any resources have been cleaned up automatically. You can try again.</p> <button type="button"${attr("disabled", deploying, true)} class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`Retry Deployment`);
      }
      $$renderer2.push(`<!--]--></button></div></div>`);
    } else if (data.hasActiveSubscription) {
      $$renderer2.push("<!--[3-->");
      $$renderer2.push(`<div class="flex items-start"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Not Deployed</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Deploy Rachel</h3> <p class="text-sm text-gray-600 mb-4">Your subscription is active. Click the button below to create your dedicated server and start Rachel on Telegram. Setup takes about 90 seconds.</p> <button type="button"${attr("disabled", deploying, true)} class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path></svg> Deploy Rachel`);
      }
      $$renderer2.push(`<!--]--></button></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex items-start"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Inactive</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Get Started with Rachel</h3> <p class="text-sm text-gray-600 mb-4">Subscribe to get your own personal AI assistant on Telegram. Setup takes less than 2 minutes.</p> <a href="/onboarding" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm">Subscribe Now — $20/month</a></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (data.hasActiveSubscription || data.subscription?.vpsProvisioned) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white shadow rounded-lg"><div class="px-6 py-5 border-b border-gray-200"><h2 class="text-xl font-semibold text-gray-900">Quick Links</h2></div> <div class="px-6 py-5"><div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><a href="/dashboard/billing" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> <span class="text-sm font-medium text-gray-700">Billing</span></a> <a href="/dashboard/claude" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg> <span class="text-sm font-medium text-gray-700">Claude Connection</span></a> <a href="/dashboard/logs" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> <span class="text-sm font-medium text-gray-700">Logs</span></a></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
