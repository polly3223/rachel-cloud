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

	// Admin navigation links
	const navLinks = [
		{ href: '/admin', label: 'Overview', icon: 'chart-bar' },
		{ href: '/admin/users', label: 'Users', icon: 'users' },
		{ href: '/admin/revenue', label: 'Revenue', icon: 'dollar-sign' },
		{ href: '/admin/infrastructure', label: 'Infrastructure', icon: 'server' },
		{ href: '/admin/updates', label: 'Updates', icon: 'arrow-path' }
	];

	// Check if a link is active
	function isActive(href: string): boolean {
		if (href === '/admin') {
			return $page.url.pathname === '/admin';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Admin - Rachel Cloud</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Mobile menu button -->
	<div class="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
		<div class="flex items-center justify-between px-4 py-3">
			<h1 class="text-xl font-bold text-indigo-900">Rachel Cloud Admin</h1>
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
		<div class="flex flex-col flex-grow bg-white border-r border-indigo-100 pt-5 pb-4 overflow-y-auto">
			<!-- Logo -->
			<div class="flex items-center flex-shrink-0 px-6 mb-6">
				<h1 class="text-2xl font-bold text-indigo-900">Rachel Cloud</h1>
				<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
					Admin
				</span>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 px-3 space-y-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {isActive(link.href)
							? 'bg-indigo-50 text-indigo-600'
							: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
					>
						<span class="mr-3">
							{#if link.icon === 'chart-bar'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
								</svg>
							{:else if link.icon === 'users'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
								</svg>
							{:else if link.icon === 'dollar-sign'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							{:else if link.icon === 'server'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
								</svg>
							{:else if link.icon === 'arrow-path'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
								</svg>
							{/if}
						</span>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Back to Dashboard link -->
			<div class="flex-shrink-0 px-3 mb-3">
				<a
					href="/dashboard"
					class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
				>
					<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
					</svg>
					Back to Dashboard
				</a>
			</div>

			<!-- User info and logout -->
			<div class="flex-shrink-0 border-t border-gray-200 p-4">
				<div class="flex items-center mb-3">
					<div class="flex-shrink-0">
						{#if data.user.image}
							<img class="h-8 w-8 rounded-full" src={data.user.image} alt="" />
						{:else}
							<div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
								<span class="text-sm font-medium text-white">
									{data.user.name ? data.user.name.charAt(0).toUpperCase() : data.user.email.charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
					</div>
					<div class="ml-3 flex-1 min-w-0">
						<p class="text-sm font-medium text-gray-900 truncate">
							{data.user.name || 'Admin'}
						</p>
						<p class="text-xs text-gray-500 truncate">
							{data.user.email}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={handleSignOut}
					class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
		<button
			type="button"
			class="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75 w-full h-full border-none cursor-default"
			onclick={() => (mobileMenuOpen = false)}
			aria-label="Close menu"
		></button>

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
								? 'bg-indigo-50 text-indigo-600'
								: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<span class="mr-3">
								{#if link.icon === 'chart-bar'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
									</svg>
								{:else if link.icon === 'users'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
									</svg>
								{:else if link.icon === 'dollar-sign'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
								{:else if link.icon === 'server'}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
									</svg>
								{/if}
							</span>
							{link.label}
						</a>
					{/each}
				</nav>

				<!-- Back to Dashboard link -->
				<div class="flex-shrink-0 px-3 mb-3">
					<a
						href="/dashboard"
						onclick={() => (mobileMenuOpen = false)}
						class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
					>
						<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
						</svg>
						Back to Dashboard
					</a>
				</div>

				<!-- User info and logout -->
				<div class="flex-shrink-0 border-t border-gray-200 p-4">
					<div class="flex items-center mb-3">
						<div class="flex-shrink-0">
							{#if data.user.image}
								<img class="h-8 w-8 rounded-full" src={data.user.image} alt="" />
							{:else}
								<div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
									<span class="text-sm font-medium text-white">
										{data.user.name ? data.user.name.charAt(0).toUpperCase() : data.user.email.charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
						</div>
						<div class="ml-3 flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{data.user.name || 'Admin'}
							</p>
							<p class="text-xs text-gray-500 truncate">
								{data.user.email}
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={handleSignOut}
						class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
