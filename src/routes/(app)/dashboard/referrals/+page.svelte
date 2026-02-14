<script lang="ts">
	let { data } = $props();

	let copied = $state(false);
	let copiedCode = $state(false);

	const stats = data.referralStats;

	// Format cents to euros
	function formatCredits(cents: number): string {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'EUR'
		}).format(cents / 100);
	}

	// Copy referral link to clipboard
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(stats.referralLink);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const textArea = document.createElement('textarea');
			textArea.value = stats.referralLink;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	// Copy referral code to clipboard
	async function copyCode() {
		try {
			await navigator.clipboard.writeText(stats.referralCode);
			copiedCode = true;
			setTimeout(() => (copiedCode = false), 2000);
		} catch {
			const textArea = document.createElement('textarea');
			textArea.value = stats.referralCode;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copiedCode = true;
			setTimeout(() => (copiedCode = false), 2000);
		}
	}

	// Share messages
	const shareMessage = `Hey! I'm using Rachel Cloud - a personal AI assistant on Telegram. Sign up with my referral link and we both get \u20ac10 off! ${stats.referralLink}`;

	function shareWhatsApp() {
		window.open(
			`https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
			'_blank'
		);
	}

	function shareTelegram() {
		window.open(
			`https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent('Hey! Sign up for Rachel Cloud with my link and we both get \u20ac10 off!')}`,
			'_blank'
		);
	}

	function shareEmail() {
		const subject = encodeURIComponent('Get \u20ac10 off Rachel Cloud');
		const body = encodeURIComponent(shareMessage);
		window.open(`mailto:?subject=${subject}&body=${body}`);
	}
</script>

<svelte:head>
	<title>Referrals - Rachel Cloud</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Referrals</h1>
		<p class="text-gray-600 mt-2">Give &euro;10, Get &euro;10 &mdash; share Rachel Cloud with friends</p>
	</div>

	<!-- How it works banner -->
	<div class="bg-indigo-50 border border-indigo-200 rounded-lg mb-6">
		<div class="px-6 py-5">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
					</svg>
				</div>
				<div class="ml-4">
					<h3 class="text-lg font-semibold text-indigo-900">How it works</h3>
					<div class="mt-2 text-sm text-indigo-800 space-y-1">
						<p>1. Share your unique referral link with friends</p>
						<p>2. When they sign up and subscribe, they get <strong>&euro;10 off</strong> their first month</p>
						<p>3. You get <strong>&euro;10 credit</strong> on your next bill</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
		<div class="bg-white shadow rounded-lg px-6 py-5">
			<p class="text-sm font-medium text-gray-500">Total Referrals</p>
			<p class="mt-1 text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
		</div>
		<div class="bg-white shadow rounded-lg px-6 py-5">
			<p class="text-sm font-medium text-gray-500">Pending</p>
			<p class="mt-1 text-3xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
		</div>
		<div class="bg-white shadow rounded-lg px-6 py-5">
			<p class="text-sm font-medium text-gray-500">Credits Earned</p>
			<p class="mt-1 text-3xl font-bold text-green-600">{formatCredits(stats.earnedCredits)}</p>
		</div>
	</div>

	<!-- Referral Link Card -->
	<div class="bg-white shadow rounded-lg mb-6">
		<div class="px-6 py-5 border-b border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900">Your Referral Link</h2>
		</div>
		<div class="px-6 py-5">
			<!-- Referral Code -->
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-500 mb-1">Your Code</label>
				<div class="flex items-center gap-3">
					<code class="text-lg font-mono font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-md tracking-wider">
						{stats.referralCode}
					</code>
					<button
						onclick={copyCode}
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
					>
						{#if copiedCode}
							<svg class="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Copied!
						{:else}
							<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Copy Code
						{/if}
					</button>
				</div>
			</div>

			<!-- Referral Link -->
			<div>
				<label class="block text-sm font-medium text-gray-500 mb-1">Shareable Link</label>
				<div class="flex items-center gap-2">
					<div class="flex-1 bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
						{stats.referralLink}
					</div>
					<button
						onclick={copyLink}
						class="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex-shrink-0"
					>
						{#if copied}
							<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Copied!
						{:else}
							<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Copy Link
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Share Buttons Card -->
	<div class="bg-white shadow rounded-lg">
		<div class="px-6 py-5 border-b border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900">Share with Friends</h2>
		</div>
		<div class="px-6 py-5">
			<p class="text-sm text-gray-600 mb-4">
				Spread the word and earn credits for every friend who subscribes.
			</p>
			<div class="flex flex-wrap gap-3">
				<!-- WhatsApp -->
				<button
					onclick={shareWhatsApp}
					class="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
				>
					<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					WhatsApp
				</button>

				<!-- Telegram -->
				<button
					onclick={shareTelegram}
					class="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors"
				>
					<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
					</svg>
					Telegram
				</button>

				<!-- Email -->
				<button
					onclick={shareEmail}
					class="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
				>
					<svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					Email
				</button>
			</div>
		</div>
	</div>
</div>
