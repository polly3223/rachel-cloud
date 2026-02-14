import { Z as head } from "../../../../../chunks/index2.js";
import "../../../../../chunks/client.js";
import { e as escape_html } from "../../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    function formatDate(date) {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    head("2ll04e", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Billing - Rachel Cloud</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-4xl mx-auto"><div class="mb-6"><h1 class="text-3xl font-bold text-gray-900">Billing &amp; Subscription</h1> <p class="text-gray-600 mt-2">Manage your subscription and payment methods</p></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white shadow rounded-lg mb-6"><div class="px-6 py-5 border-b border-gray-200"><h2 class="text-xl font-semibold text-gray-900">Subscription Status</h2></div> <div class="px-6 py-5">`);
    if (data.hasActiveSubscription) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Active</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Rachel Cloud Monthly</h3> <div class="space-y-2 text-sm text-gray-600"><p><span class="font-medium">Amount:</span> <span class="text-2xl font-bold text-gray-900 ml-2">$20</span> <span class="text-gray-500">/month</span></p> `);
      if (data.subscription?.currentPeriodEnd) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p><span class="font-medium">Next billing date:</span> <span class="ml-2 text-gray-900">${escape_html(formatDate(data.subscription.currentPeriodEnd))}</span></p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else if (data.isGracePeriod) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> Grace Period</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">Subscription Canceled</h3> <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4"><div class="flex"><div class="ml-3"><p class="text-sm text-yellow-700">Your subscription has been canceled. Your VPS will be deprovisioned on  <span class="font-semibold">${escape_html(formatDate(data.subscription?.gracePeriodEndsAt))}</span>.</p> <p class="text-sm text-yellow-700 mt-2">You can reactivate your subscription at any time before this date to keep your service active.</p></div></div></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center mb-3"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Inactive</span></div> <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3> <p class="text-sm text-gray-600 mb-4">You don't have an active subscription. Subscribe to get started with Rachel Cloud.</p> <a href="/onboarding" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Subscribe Now</a></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (data.hasActiveSubscription || data.isGracePeriod) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white shadow rounded-lg mb-6"><div class="px-6 py-5 border-b border-gray-200"><h2 class="text-xl font-semibold text-gray-900">Payment Management</h2></div> <div class="px-6 py-5"><p class="text-sm text-gray-600 mb-4">Update your payment method, view billing history, and manage your subscription through the Polar customer portal.</p> <button type="button" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg> Manage Payment Method</button></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.hasActiveSubscription) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-white shadow rounded-lg"><div class="px-6 py-5 border-b border-gray-200"><h2 class="text-xl font-semibold text-gray-900">Cancel Subscription</h2></div> <div class="px-6 py-5"><p class="text-sm text-gray-600 mb-4">Cancel your subscription at any time. You'll have a 3-day grace period to reactivate before your VPS is deprovisioned.</p> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button type="button" class="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Cancel Subscription</button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
