<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-4xl mx-auto px-6">
		<p class="text-sm font-medium text-[#0086EE] text-center mb-3 tracking-wide uppercase">{$t.howItWorks.label}</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-20">
			{$t.howItWorks.title}
		</h2>

		<div class="relative">
			<!-- Connecting line (desktop) -->
			<div class="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-px bg-[#0086EE]/30"></div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
				<div class="relative text-center">
					<div class="w-20 h-20 mx-auto rounded-2xl bg-[#0086EE]/10 border border-[#0086EE]/20 flex items-center justify-center text-3xl font-bold text-[#0086EE] mb-6">
						1
					</div>
					<h3 class="text-lg font-semibold text-white mb-2">{$t.howItWorks.step1.title}</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						{$t.howItWorks.step1.description}
					</p>
				</div>

				<div class="relative text-center">
					<div class="w-20 h-20 mx-auto rounded-2xl bg-[#0086EE]/10 border border-[#0086EE]/20 flex items-center justify-center text-3xl font-bold text-[#0086EE] mb-6">
						2
					</div>
					<h3 class="text-lg font-semibold text-white mb-2">{$t.howItWorks.step2.title}</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						{$t.howItWorks.step2.description}
					</p>
				</div>

				<div class="relative text-center">
					<div class="w-20 h-20 mx-auto rounded-2xl bg-[#0086EE]/10 border border-[#0086EE]/20 flex items-center justify-center text-3xl font-bold text-[#0086EE] mb-6">
						3
					</div>
					<h3 class="text-lg font-semibold text-white mb-2">{$t.howItWorks.step3.title}</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						{$t.howItWorks.step3.description}
					</p>
				</div>
			</div>
		</div>
	</div>
</section>
