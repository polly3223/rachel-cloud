<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Calculate progress percentage
	const progressPercentage = $derived(() => {
		if (data.step === 'payment') return 33;
		if (data.step === 'provisioning') return 66;
		if (data.step === 'ready') return 100;
		return 0;
	});

	// Handle checkout for subscription
	async function handleCheckout() {
		// Redirect to checkout endpoint
		window.location.href = '/api/auth/checkout?slug=rachel-cloud-monthly';
	}
</script>

<svelte:head>
	<title>Onboarding - Rachel Cloud</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl w-full">
		<!-- Progress Bar -->
		<div class="mb-8">
			<div class="flex justify-between mb-2">
				<span class="text-sm font-medium text-gray-700">Setup Progress</span>
				<span class="text-sm font-medium text-gray-700">{progressPercentage()}%</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2.5">
				<div
					class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
					style="width: {progressPercentage()}%"
				></div>
			</div>
		</div>

		<!-- Step Content -->
		<div class="bg-white shadow-lg rounded-lg p-8">
			{#if data.step === 'payment'}
				<!-- Payment Step -->
				<div class="text-center">
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-900 mb-2">Subscribe to Rachel Cloud</h1>
						<p class="text-gray-600">Step 1 of 3: Choose your plan</p>
					</div>

					<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 border-2 border-blue-200">
						<h2 class="text-2xl font-bold text-gray-900 mb-4">Rachel Cloud Monthly</h2>
						<div class="mb-6">
							<span class="text-5xl font-extrabold text-blue-600">$20</span>
							<span class="text-xl text-gray-600">/month</span>
						</div>
						<ul class="text-left space-y-3 mb-8 max-w-md mx-auto">
							<li class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span class="text-gray-700">Your own personal AI assistant on Telegram</span>
							</li>
							<li class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span class="text-gray-700">Powered by Claude — reads files, browses the web, and more</span>
							</li>
							<li class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span class="text-gray-700">Fully managed and monitored 24/7</span>
							</li>
							<li class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span class="text-gray-700">3-day grace period on cancellation</span>
							</li>
						</ul>
					</div>

					<button
						type="button"
						onclick={handleCheckout}
						class="w-full max-w-md mx-auto flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Subscribe Now
					</button>

					<p class="mt-4 text-sm text-gray-500">Cancel anytime with a 3-day grace period</p>
				</div>

			{:else if data.step === 'provisioning'}
				<!-- Provisioning Step -->
				<div class="text-center">
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-900 mb-2">Deploy Your Rachel</h1>
						<p class="text-gray-600">Step 2 of 3: Launch your assistant</p>
					</div>

					<div class="py-12">
						<svg class="animate-spin h-16 w-16 text-blue-600 mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>

						<h3 class="text-xl font-semibold text-gray-900 mb-2">Setting up your instance...</h3>
						<p class="text-gray-600 max-w-md mx-auto">
							Your subscription is active. We're deploying Rachel for you now — this usually takes about 10 seconds.
						</p>

						<div class="mt-8 bg-blue-50 rounded-lg p-6 max-w-md mx-auto text-left space-y-2">
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">&#9679;</span> Creating your Rachel instance
							</p>
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">&#9679;</span> Configuring your Telegram bot
							</p>
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">&#9679;</span> Connecting to Claude AI
							</p>
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">&#9679;</span> Starting your Rachel bot service
							</p>
							<p class="text-xs text-gray-500 mt-3">
								You'll be redirected to your dashboard automatically when ready.
							</p>
						</div>
					</div>
				</div>

			{:else if data.step === 'ready'}
				<!-- Ready Step -->
				<div class="text-center">
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h1>
						<p class="text-gray-600">Step 3 of 3: Ready to go</p>
					</div>

					<div class="py-12">
						<svg class="h-16 w-16 text-green-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>

						<h3 class="text-xl font-semibold text-gray-900 mb-2">Rachel is running!</h3>
						<p class="text-gray-600 max-w-md mx-auto mb-8">
							Your personal AI assistant is deployed and ready. Head to the dashboard to manage your instance.
						</p>

						<a
							href="/dashboard"
							class="inline-flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Go to Dashboard
						</a>
					</div>
				</div>
			{/if}
		</div>

		<!-- Help Text -->
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-500">
				Need help? Contact us at <a href="mailto:support@rachel-cloud.example" class="text-blue-600 hover:text-blue-500">support@rachel-cloud.example</a>
			</p>
		</div>
	</div>
</div>
