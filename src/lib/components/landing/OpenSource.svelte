<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const script = document.createElement('script');
		script.src = 'https://buttons.github.io/buttons.js';
		script.async = true;
		script.defer = true;
		document.body.appendChild(script);
	});
</script>

<section class="py-20 sm:py-24 bg-gray-900 text-white">
	<div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
		<h2 class="text-3xl sm:text-4xl font-bold mb-4">Open Source</h2>
		<p class="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
			Rachel is fully open source. Self-host it on your own server, or let us handle everything
			with Rachel Cloud.
		</p>
		<div class="flex flex-col sm:flex-row items-center justify-center gap-6">
			<a
				class="github-button"
				href="https://github.com/polly3223/Rachel8"
				data-icon="octicon-star"
				data-size="large"
				data-show-count="true"
				aria-label="Star polly3223/Rachel8 on GitHub"
			>
				Star
			</a>
			<a
				href="https://github.com/polly3223/Rachel8"
				class="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors"
				target="_blank"
				rel="noopener noreferrer"
			>
				<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				View on GitHub
			</a>
		</div>
	</div>
</section>
