<script lang="ts">
	import { authClient } from '$lib/auth/client';

	let { data } = $props();

	// State for cancellation flow
	let canceling = $state(false);
	let showCancelConfirm = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Format date helper
	function formatDate(date: Date | null | undefined): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Open Polar customer portal
	async function openCustomerPortal() {
		try {
			// Call Better Auth portal endpoint
			const response = await fetch('/api/auth/customer/portal', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ redirect: false })
			});

			if (!response.ok) {
				throw new Error('Failed to get portal URL');
			}

			const result = await response.json();
			if (result.url) {
				window.location.href = result.url;
			}
		} catch (err) {
			error = 'Failed to open customer portal. Please try again.';
			console.error('Customer portal error:', err);
		}
	}

	// Handle subscription cancellation
	async function cancelSubscription() {
		error = null;
		successMessage = null;
		canceling = true;

		try {
			const response = await fetch('/api/billing/cancel', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to cancel subscription';
				canceling = false;
				showCancelConfirm = false;
				return;
			}

			// Success - reload page to show updated status
			successMessage = 'Subscription canceled. Grace period active for 3 days.';
			showCancelConfirm = false;
			canceling = false;

			// Reload after showing success message
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (err) {
			error = 'An error occurred. Please try again.';
			canceling = false;
			showCancelConfirm = false;
			console.error('Cancellation error:', err);
		}
	}
</script>

<svelte:head>
	<title>Billing - Rachel Cloud</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
		<p class="text-gray-600 mt-2">Manage your subscription and payment methods</p>
	</div>

	<!-- Error/Success Messages -->
	{#if error}
		<div class="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
			<div class="flex">
				<svg class="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<span class="text-sm font-medium text-red-800">{error}</span>
			</div>
		</div>
	{/if}

	{#if successMessage}
		<div class="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
			<div class="flex">
				<svg class="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
				</svg>
				<span class="text-sm font-medium text-green-800">{successMessage}</span>
			</div>
		</div>
	{/if}

	<!-- Subscription Status Card -->
	<div class="bg-white shadow rounded-lg mb-6">
		<div class="px-6 py-5 border-b border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900">Subscription Status</h2>
		</div>
		<div class="px-6 py-5">
			{#if data.hasActiveSubscription}
				<!-- Active Subscription -->
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
								<svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								Active
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Rachel Cloud Monthly</h3>
						<div class="space-y-2 text-sm text-gray-600">
							<p>
								<span class="font-medium">Amount:</span>
								<span class="text-2xl font-bold text-gray-900 ml-2">$20</span>
								<span class="text-gray-500">/month</span>
							</p>
							{#if data.subscription?.currentPeriodEnd}
								<p>
									<span class="font-medium">Next billing date:</span>
									<span class="ml-2 text-gray-900">{formatDate(data.subscription.currentPeriodEnd)}</span>
								</p>
							{/if}
						</div>
					</div>
				</div>
			{:else if data.isGracePeriod}
				<!-- Grace Period -->
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
								<svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
								Grace Period
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Subscription Canceled</h3>
						<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
							<div class="flex">
								<div class="ml-3">
									<p class="text-sm text-yellow-700">
										Your subscription has been canceled. Your VPS will be deprovisioned on{' '}
										<span class="font-semibold">{formatDate(data.subscription?.gracePeriodEndsAt)}</span>.
									</p>
									<p class="text-sm text-yellow-700 mt-2">
										You can reactivate your subscription at any time before this date to keep your service active.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- No Subscription / Canceled -->
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
								Inactive
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
						<p class="text-sm text-gray-600 mb-4">
							You don't have an active subscription. Subscribe to get started with Rachel Cloud.
						</p>
						<a
							href="/onboarding"
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Subscribe Now
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Payment Management Card -->
	{#if data.hasActiveSubscription || data.isGracePeriod}
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-5 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Payment Management</h2>
			</div>
			<div class="px-6 py-5">
				<p class="text-sm text-gray-600 mb-4">
					Update your payment method, view billing history, and manage your subscription through the Polar customer portal.
				</p>
				<button
					type="button"
					onclick={openCustomerPortal}
					class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
					</svg>
					Manage Payment Method
				</button>
			</div>
		</div>
	{/if}

	<!-- Cancel Subscription Card -->
	{#if data.hasActiveSubscription}
		<div class="bg-white shadow rounded-lg">
			<div class="px-6 py-5 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Cancel Subscription</h2>
			</div>
			<div class="px-6 py-5">
				<p class="text-sm text-gray-600 mb-4">
					Cancel your subscription at any time. You'll have a 3-day grace period to reactivate before your VPS is deprovisioned.
				</p>

				{#if !showCancelConfirm}
					<button
						type="button"
						onclick={() => (showCancelConfirm = true)}
						class="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
					>
						Cancel Subscription
					</button>
				{:else}
					<div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3 flex-1">
								<h3 class="text-sm font-medium text-red-800">Are you sure?</h3>
								<div class="mt-2 text-sm text-red-700">
									<p>Your VPS will be deprovisioned after the 3-day grace period. You can reactivate your subscription during this time to keep your service active.</p>
								</div>
								<div class="mt-4 flex gap-3">
									<button
										type="button"
										onclick={cancelSubscription}
										disabled={canceling}
										class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{#if canceling}
											<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Canceling...
										{:else}
											Yes, Cancel Subscription
										{/if}
									</button>
									<button
										type="button"
										onclick={() => (showCancelConfirm = false)}
										disabled={canceling}
										class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										Keep Subscription
									</button>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
