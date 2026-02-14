<script lang="ts">
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth/client';

	let { data, children } = $props();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	async function handleSignOut() {
		await authClient.signOut();
		window.location.href = '/login';
	}

	// Navigation links
	const navLinks = [
		{ href: '/dashboard', label: 'Overview', icon: 'home' },
		{ href: '/dashboard/billing', label: 'Billing', icon: 'credit-card' },
		{ href: '/dashboard/claude', label: 'Claude Connection', icon: 'link' },
		{ href: '/dashboard/logs', label: 'Logs', icon: 'file-text' }
	];

	// Check if a link is active
	function isActive(href: string): boolean {
		if (href === '/dashboard') {
			return $page.url.pathname === '/dashboard';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Dashboard - Rachel Cloud</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Mobile menu button -->
	<div class="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
		<div class="flex items-center justify-between px-4 py-3">
			<h1 class="text-xl font-bold text-gray-900">Rachel Cloud</h1>
			<button
				type="button"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="text-gray-600 hover:text-gray-900 focus:outline-none"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Sidebar (desktop) -->
	<aside class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
		<div class="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
			<!-- Logo -->
			<div class="flex items-center flex-shrink-0 px-6 mb-6">
				<h1 class="text-2xl font-bold text-gray-900">Rachel Cloud</h1>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 px-3 space-y-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {isActive(link.href)
							? 'bg-blue-50 text-blue-600'
							: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
					>
						<span class="mr-3">
							{#if link.icon === 'home'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
								</svg>
							{:else if link.icon === 'credit-card'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
								</svg>
							{:else if link.icon === 'link'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
								</svg>
							{:else if link.icon === 'file-text'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
							{/if}
						</span>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- User info and logout -->
			<div class="flex-shrink-0 border-t border-gray-200 p-4">
				<div class="flex items-center mb-3">
					<div class="flex-shrink-0">
						{#if data.user.image}
							<img class="h-8 w-8 rounded-full" src={data.user.image} alt="" />
						{:else}
							<div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
								<span class="text-sm font-medium text-white">
									{data.user.name ? data.user.name.charAt(0).toUpperCase() : data.user.email.charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
					</div>
					<div class="ml-3 flex-1 min-w-0">
						<p class="text-sm font-medium text-gray-900 truncate">
							{data.user.name || 'User'}
						</p>
						<p class="text-xs text-gray-500 truncate">
							{data.user.email}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={handleSignOut}
					class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
					</svg>
					Sign Out
				</button>
			</div>
		</div>
	</aside>

	<!-- Mobile menu overlay -->
	{#if mobileMenuOpen}
		<div class="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onclick={() => (mobileMenuOpen = false)}></div>

		<!-- Mobile menu panel -->
		<div class="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300">
			<div class="flex flex-col h-full pt-16 pb-4">
				<!-- Navigation -->
				<nav class="flex-1 px-3 space-y-1">
					{#each navLinks as link}
						<a
							href={link.href}
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {isActive(link.href)
								? 'bg-blue-50 text-blue-600'
								: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<span class="mr-3">
								{#if link.icon === 'home'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
									</svg>
								{:else if link.icon === 'credit-card'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
									</svg>
								{:else if link.icon === 'link'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
									</svg>
								{:else if link.icon === 'file-text'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
									</svg>
								{/if}
							</span>
							{link.label}
						</a>
					{/each}
				</nav>

				<!-- User info and logout -->
				<div class="flex-shrink-0 border-t border-gray-200 p-4">
					<div class="flex items-center mb-3">
						<div class="flex-shrink-0">
							{#if data.user.image}
								<img class="h-8 w-8 rounded-full" src={data.user.image} alt="" />
							{:else}
								<div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
									<span class="text-sm font-medium text-white">
										{data.user.name ? data.user.name.charAt(0).toUpperCase() : data.user.email.charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
						</div>
						<div class="ml-3 flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{data.user.name || 'User'}
							</p>
							<p class="text-xs text-gray-500 truncate">
								{data.user.email}
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={handleSignOut}
						class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
						</svg>
						Sign Out
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="lg:pl-64 flex flex-col flex-1">
		<main class="flex-1 pt-16 lg:pt-0">
			<div class="py-6 px-4 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>
