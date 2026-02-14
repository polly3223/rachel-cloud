<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<footer class="border-t border-white/5 bg-[#08080d]">
	<div class="max-w-5xl mx-auto px-6 py-10">
		<div class="flex flex-col sm:flex-row items-center justify-between gap-6">
			<div class="text-center sm:text-left">
				<span class="text-base font-semibold text-white">{$t.footer.brandName}</span>
				<p class="text-xs text-gray-600 mt-1">{$t.footer.tagline}</p>
			</div>

			<nav class="flex items-center gap-6">
				<a href="/signup" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
					{$t.footer.navGetStarted}
				</a>
				<a href="/login" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">
					{$t.footer.navLogin}
				</a>
				<a
					href="https://github.com/polly3223/Rachel8"
					class="text-sm text-gray-500 hover:text-gray-300 transition-colors"
					target="_blank"
					rel="noopener noreferrer"
				>
					{$t.footer.navGitHub}
				</a>
			</nav>
		</div>

		<div class="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
			<p class="text-xs text-gray-700">
				&copy; {new Date().getFullYear()} {$t.footer.copyright}
			</p>
			<p class="text-xs text-gray-700">
				{$t.footer.referralEmoji} <span class="text-gray-500">{$t.footer.referralText}</span> &mdash; <a href="/signup" class="text-violet-400 hover:text-violet-300 transition-colors">{$t.footer.referralLink}</a>
			</p>
		</div>
	</div>
</footer>
