<script lang="ts">
	import { locale, type Locale } from '$lib/i18n';

	function setLocale(newLocale: Locale): void {
		locale.set(newLocale);
	}
</script>

<div class="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium select-none">
	<button
		onclick={() => setLocale('it')}
		class="px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer {$locale === 'it'
			? 'bg-white/10 text-white'
			: 'text-gray-500 hover:text-gray-300'}"
		aria-label="Italiano"
		aria-pressed={$locale === 'it'}
	>
		IT
	</button>
	<button
		onclick={() => setLocale('en')}
		class="px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer {$locale === 'en'
			? 'bg-white/10 text-white'
			: 'text-gray-500 hover:text-gray-300'}"
		aria-label="English"
		aria-pressed={$locale === 'en'}
	>
		EN
	</button>
</div>
