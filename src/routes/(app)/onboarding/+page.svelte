<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Local state for telegram bot step
	let botToken = $state('');
	let validating = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let validatedBotUsername = $state<string | null>(null);

	// Calculate progress percentage
	const progressPercentage = $derived(() => {
		if (data.step === 'payment') return 33;
		if (data.step === 'telegram_bot') return 66;
		return 100;
	});

	// Handle checkout for subscription
	async function handleCheckout() {
		// Redirect to Better Auth checkout endpoint
		// The Polar plugin will handle the redirect to Polar checkout page
		window.location.href = '/api/auth/checkout?slug=rachel-cloud-monthly';
	}

	// Handle bot token validation
	async function handleBotValidation(e: Event) {
		e.preventDefault();
		error = null;
		validating = true;

		try {
			const response = await fetch('/api/onboarding/validate-bot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token: botToken })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to validate bot token';
				validating = false;
				return;
			}

			// Success
			success = true;
			validatedBotUsername = result.botUsername;
			validating = false;

			// Wait a moment to show success message, then reload to proceed to next step
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (err) {
			error = 'An error occurred. Please try again.';
			validating = false;
		}
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
								<span class="text-gray-700">Your own Telegram bot connected to Claude</span>
							</li>
							<li class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span class="text-gray-700">Dedicated VPS instance</span>
							</li>
							<li class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span class="text-gray-700">Fully managed and monitored</span>
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

			{:else if data.step === 'telegram_bot'}
				<!-- Telegram Bot Step -->
				<div>
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-900 mb-2">Connect Your Telegram Bot</h1>
						<p class="text-gray-600">Step 2 of 3: Set up your bot</p>
					</div>

					<!-- BotFather Instructions -->
					<div class="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
						<h3 class="text-lg font-semibold text-blue-900 mb-4">How to create a Telegram bot:</h3>
						<ol class="space-y-3 text-gray-700">
							<li class="flex items-start">
								<span class="font-bold text-blue-600 mr-3 flex-shrink-0">1.</span>
								<span>Open Telegram and search for <span class="font-mono bg-white px-2 py-1 rounded">@BotFather</span></span>
							</li>
							<li class="flex items-start">
								<span class="font-bold text-blue-600 mr-3 flex-shrink-0">2.</span>
								<span>Send the command <span class="font-mono bg-white px-2 py-1 rounded">/newbot</span> and follow the prompts</span>
							</li>
							<li class="flex items-start">
								<span class="font-bold text-blue-600 mr-3 flex-shrink-0">3.</span>
								<span>Choose a name for your bot (e.g., "My Rachel Bot")</span>
							</li>
							<li class="flex items-start">
								<span class="font-bold text-blue-600 mr-3 flex-shrink-0">4.</span>
								<span>Choose a username for your bot (must end with "bot", e.g., "my_rachel_bot")</span>
							</li>
							<li class="flex items-start">
								<span class="font-bold text-blue-600 mr-3 flex-shrink-0">5.</span>
								<span>BotFather will provide an API token - copy it and paste below</span>
							</li>
						</ol>
					</div>

					<!-- Token Input Form -->
					<form onsubmit={handleBotValidation} class="space-y-6">
						{#if error}
							<div class="rounded-md bg-red-50 p-4 border border-red-200">
								<div class="flex">
									<svg class="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
									</svg>
									<span class="text-sm font-medium text-red-800">{error}</span>
								</div>
							</div>
						{/if}

						{#if success}
							<div class="rounded-md bg-green-50 p-4 border border-green-200">
								<div class="flex">
									<svg class="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
									<div>
										<span class="text-sm font-medium text-green-800">
											Bot validated successfully!
											{#if validatedBotUsername}
												(@{validatedBotUsername})
											{/if}
										</span>
									</div>
								</div>
							</div>
						{/if}

						<div>
							<label for="bot-token" class="block text-sm font-medium text-gray-700 mb-2">
								Bot API Token
							</label>
							<input
								id="bot-token"
								type="password"
								bind:value={botToken}
								disabled={validating || success}
								placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
								required
								class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono"
							/>
							<p class="mt-2 text-sm text-gray-500">
								The token should look like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
							</p>
						</div>

						<button
							type="submit"
							disabled={validating || success}
							class="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if validating}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Validating...
							{:else if success}
								Validated!
							{:else}
								Validate & Continue
							{/if}
						</button>
					</form>
				</div>

			{:else if data.step === 'provisioning'}
				<!-- Provisioning Step -->
				<div class="text-center">
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-900 mb-2">Deploying Your Rachel Instance</h1>
						<p class="text-gray-600">Step 3 of 3: VPS provisioning</p>
					</div>

					<div class="py-12">
						<svg class="animate-spin h-16 w-16 text-blue-600 mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>

						<h3 class="text-xl font-semibold text-gray-900 mb-2">Setting up your VPS...</h3>
						<p class="text-gray-600 max-w-md mx-auto">
							We're provisioning your dedicated server and deploying Rachel. This usually takes 2-3 minutes.
						</p>

						<div class="mt-8 bg-blue-50 rounded-lg p-6 max-w-md mx-auto text-left space-y-2">
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">●</span> Creating your dedicated VPS on Hetzner Cloud
							</p>
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">●</span> Installing Bun, Claude Code, and Rachel
							</p>
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">●</span> Injecting your credentials securely via SSH
							</p>
							<p class="text-sm text-gray-700 flex items-center gap-2">
								<span class="text-blue-500">●</span> Starting your Rachel bot service
							</p>
							<p class="text-xs text-gray-500 mt-3">
								You'll be redirected to your dashboard automatically when ready.
							</p>
						</div>
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
