import { Z as head, a5 as attr_style, a1 as stringify, $ as attr } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let botToken = "";
    let success = false;
    const progressPercentage = () => {
      if (data.step === "payment") return 33;
      if (data.step === "telegram_bot") return 66;
      return 100;
    };
    head("uazrsb", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Onboarding - Rachel Cloud</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-2xl w-full"><div class="mb-8"><div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Setup Progress</span> <span class="text-sm font-medium text-gray-700">${escape_html(progressPercentage())}%</span></div> <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"${attr_style(`width: ${stringify(progressPercentage())}%`)}></div></div></div> <div class="bg-white shadow-lg rounded-lg p-8">`);
    if (data.step === "payment") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center"><div class="mb-6"><h1 class="text-3xl font-bold text-gray-900 mb-2">Subscribe to Rachel Cloud</h1> <p class="text-gray-600">Step 1 of 3: Choose your plan</p></div> <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 border-2 border-blue-200"><h2 class="text-2xl font-bold text-gray-900 mb-4">Rachel Cloud Monthly</h2> <div class="mb-6"><span class="text-5xl font-extrabold text-blue-600">$20</span> <span class="text-xl text-gray-600">/month</span></div> <ul class="text-left space-y-3 mb-8 max-w-md mx-auto"><li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Your own Telegram bot connected to Claude</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Dedicated VPS instance</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Fully managed and monitored</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">3-day grace period on cancellation</span></li></ul></div> <button type="button" class="w-full max-w-md mx-auto flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Subscribe Now</button> <p class="mt-4 text-sm text-gray-500">Cancel anytime with a 3-day grace period</p></div>`);
    } else if (data.step === "telegram_bot") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div><div class="mb-6"><h1 class="text-3xl font-bold text-gray-900 mb-2">Connect Your Telegram Bot</h1> <p class="text-gray-600">Step 2 of 3: Set up your bot</p></div> <div class="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8"><h3 class="text-lg font-semibold text-blue-900 mb-4">How to create a Telegram bot:</h3> <ol class="space-y-3 text-gray-700"><li class="flex items-start"><span class="font-bold text-blue-600 mr-3 flex-shrink-0">1.</span> <span>Open Telegram and search for <span class="font-mono bg-white px-2 py-1 rounded">@BotFather</span></span></li> <li class="flex items-start"><span class="font-bold text-blue-600 mr-3 flex-shrink-0">2.</span> <span>Send the command <span class="font-mono bg-white px-2 py-1 rounded">/newbot</span> and follow the prompts</span></li> <li class="flex items-start"><span class="font-bold text-blue-600 mr-3 flex-shrink-0">3.</span> <span>Choose a name for your bot (e.g., "My Rachel Bot")</span></li> <li class="flex items-start"><span class="font-bold text-blue-600 mr-3 flex-shrink-0">4.</span> <span>Choose a username for your bot (must end with "bot", e.g., "my_rachel_bot")</span></li> <li class="flex items-start"><span class="font-bold text-blue-600 mr-3 flex-shrink-0">5.</span> <span>BotFather will provide an API token - copy it and paste below</span></li></ol></div> <form class="space-y-6">`);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="bot-token" class="block text-sm font-medium text-gray-700 mb-2">Bot API Token</label> <input id="bot-token" type="password"${attr("value", botToken)}${attr("disabled", success, true)} placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" required="" class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono"/> <p class="mt-2 text-sm text-gray-500">The token should look like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz</p></div> <button type="submit"${attr("disabled", success, true)} class="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`Validate &amp; Continue`);
      }
      $$renderer2.push(`<!--]--></button></form></div>`);
    } else if (data.step === "provisioning") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<div class="text-center"><div class="mb-6"><h1 class="text-3xl font-bold text-gray-900 mb-2">Deploying Your Rachel Instance</h1> <p class="text-gray-600">Step 3 of 3: VPS provisioning</p></div> <div class="py-12"><svg class="animate-spin h-16 w-16 text-blue-600 mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <h3 class="text-xl font-semibold text-gray-900 mb-2">Setting up your VPS...</h3> <p class="text-gray-600 max-w-md mx-auto">We're provisioning your dedicated server and deploying Rachel. This usually takes 2-3 minutes.</p> <div class="mt-8 bg-blue-50 rounded-lg p-6 max-w-md mx-auto"><p class="text-sm text-gray-700"><strong>Phase 3:</strong> VPS provisioning will happen here. This is a placeholder for the provisioning flow.</p></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="mt-6 text-center"><p class="text-sm text-gray-500">Need help? Contact us at <a href="mailto:support@rachel-cloud.example" class="text-blue-600 hover:text-blue-500">support@rachel-cloud.example</a></p></div></div></div>`);
  });
}
export {
  _page as default
};
