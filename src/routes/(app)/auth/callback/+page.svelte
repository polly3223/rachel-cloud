<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let status = $state<'loading' | 'success' | 'error'>('loading');
	let errorMessage = $state('');

	onMount(async () => {
		// Better Auth handles the OAuth callback automatically
		// We just need to check if we have a session and redirect accordingly
		try {
			// Give Better Auth a moment to process the callback
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Check if we have a session
			const response = await fetch('/api/auth/session', {
				credentials: 'include'
			});

			if (response.ok) {
				const session = await response.json();
				if (session && session.user) {
					status = 'success';
					// Redirect to dashboard after successful authentication
					setTimeout(() => {
						goto('/dashboard');
					}, 500);
					return;
				}
			}

			// If we get here, authentication failed
			status = 'error';
			errorMessage = 'Authentication failed. Please try again.';
		} catch (err) {
			status = 'error';
			errorMessage = 'An error occurred during authentication. Please try again.';
		}
	});
</script>

<svelte:head>
	<title>Authenticating... - Rachel Cloud</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		{#if status === 'loading'}
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<h2 class="mt-6 text-center text-2xl font-bold text-gray-900">
					Completing authentication...
				</h2>
				<p class="mt-2 text-center text-sm text-gray-600">Please wait a moment.</p>
			</div>
		{:else if status === 'success'}
			<div class="text-center">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
					<svg
						class="h-6 w-6 text-green-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<h2 class="mt-6 text-center text-2xl font-bold text-gray-900">Authentication successful!</h2>
				<p class="mt-2 text-center text-sm text-gray-600">Redirecting to dashboard...</p>
			</div>
		{:else if status === 'error'}
			<div class="text-center">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
					<svg
						class="h-6 w-6 text-red-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</div>
				<h2 class="mt-6 text-center text-2xl font-bold text-gray-900">Authentication failed</h2>
				<p class="mt-2 text-center text-sm text-gray-600">{errorMessage}</p>
				<div class="mt-6">
					<a
						href="/login"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Back to login
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
