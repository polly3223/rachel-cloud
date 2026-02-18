<script lang="ts">
	import { page } from '$app/stores';

	let { data, children } = $props();

	async function handleSignOut() {
		// Clear session cookie by calling logout endpoint
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/login';
	}

	// Navigation links (removed Claude Connection — shared bot model)
	const navLinks = [
		{ href: '/dashboard', label: 'Overview', icon: 'home' },
		{ href: '/dashboard/billing', label: 'Billing', icon: 'credit-card' }
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

<div class="min-h-screen bg-[#0a0a0f]">
	<!-- Mobile top bar -->
	<div class="lg:hidden fixed top-0 left-0 right-0 bg-[#0a0a0f] border-b border-white/10 z-40">
		<div class="flex items-center justify-between px-4 py-3">
			<h1 class="text-xl font-bold text-white">Rachel Cloud</h1>
			<button
				type="button"
				onclick={handleSignOut}
				class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
				</svg>
				Sign Out
			</button>
		</div>
	</div>

	<!-- Mobile bottom tab bar -->
	<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f] border-t border-white/10 z-40 safe-area-bottom">
		<div class="flex items-center justify-around px-2 py-2">
			{#each navLinks as link}
				<a
					href={link.href}
					class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors {isActive(link.href)
						? 'text-[#0086EE]'
						: 'text-gray-500 hover:text-gray-300'}"
				>
					{#if link.icon === 'home'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
						</svg>
					{:else if link.icon === 'credit-card'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
						</svg>
					{:else if link.icon === 'link'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
						</svg>
					{:else if link.icon === 'gift'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
						</svg>
					{:else if link.icon === 'file-text'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
					{/if}
					<span class="text-xs font-medium">{link.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<!-- Sidebar (desktop only) -->
	<aside class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
		<div class="flex flex-col flex-grow bg-[#0a0a0f] border-r border-white/10 pt-5 pb-4 overflow-y-auto">
			<!-- Logo -->
			<div class="flex items-center flex-shrink-0 px-6 mb-6">
				<h1 class="text-2xl font-bold text-white">Rachel Cloud</h1>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 px-3 space-y-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {isActive(link.href)
							? 'bg-[#0086EE]/10 text-[#0086EE]'
							: 'text-gray-400 hover:bg-white/5 hover:text-white'}"
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
							{:else if link.icon === 'gift'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
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
			<div class="flex-shrink-0 border-t border-white/10 p-4">
				<div class="flex items-center mb-3">
					<div class="flex-shrink-0">
						{#if data.user.photoUrl}
							<img class="h-8 w-8 rounded-full" src={data.user.photoUrl} alt="" />
						{:else}
							<div class="h-8 w-8 rounded-full bg-[#0086EE] flex items-center justify-center">
								<span class="text-sm font-medium text-white">
									{data.user.firstName ? data.user.firstName.charAt(0).toUpperCase() : '?'}
								</span>
							</div>
						{/if}
					</div>
					<div class="ml-3 flex-1 min-w-0">
						<p class="text-sm font-medium text-white truncate">
							{data.user.firstName || 'User'}
						</p>
						{#if data.user.username}
							<p class="text-xs text-gray-500 truncate">
								@{data.user.username}
							</p>
						{/if}
					</div>
				</div>
				<button
					type="button"
					onclick={handleSignOut}
					class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0086EE] transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
					</svg>
					Sign Out
				</button>
			</div>
		</div>
	</aside>

	<!-- Main content -->
	<div class="lg:pl-64 flex flex-col flex-1">
		<main class="flex-1 pt-14 pb-20 lg:pt-0 lg:pb-0">
			<div class="py-6 px-4 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<style>
	/* Safe area for phones with home indicators (iPhone X+) */
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}
</style>
