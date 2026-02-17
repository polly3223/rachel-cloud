<script lang="ts">
	import { t } from '$lib/i18n';

	interface Message {
		text: string;
		sender: 'user' | 'rachel';
		time: string;
	}

	let messages = $derived<Message[]>([
		{ text: $t.whatsappDemo.messages.user1, sender: 'user', time: '13:22' },
		{ text: $t.whatsappDemo.messages.rachel1, sender: 'rachel', time: '13:25' },
		{ text: $t.whatsappDemo.messages.user2, sender: 'user', time: '13:40' },
		{ text: $t.whatsappDemo.messages.rachel2, sender: 'rachel', time: '13:41' }
	]);
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-5xl mx-auto px-6">
		<p class="text-sm font-medium text-[#0086EE] text-center mb-3 tracking-wide uppercase">{$t.whatsappDemo.label}</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
			{$t.whatsappDemo.title}
		</h2>
		<p class="text-center text-gray-500 mb-14 max-w-md mx-auto">
			{$t.whatsappDemo.subtitle}
		</p>

		<div class="max-w-sm mx-auto">
			<div class="rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10">
				<!-- Header — Telegram style (Rachel runs on Telegram) -->
				<div class="bg-[#1c2733] px-4 py-3 flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-[#0086EE] flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-[#0086EE]/20">
						R
					</div>
					<div class="flex-1">
						<div class="font-semibold text-white text-sm">Rachel</div>
						<div class="text-xs text-[#0086EE] flex items-center gap-1">
							<span class="inline-block w-1.5 h-1.5 bg-[#0086EE] rounded-full"></span>
							{$t.whatsappDemo.online}
						</div>
					</div>
					<!-- WhatsApp badge -->
					<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/20">
						<svg class="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
						</svg>
						<span class="text-[10px] font-medium text-[#25D366]">WhatsApp</span>
					</div>
				</div>

				<!-- Messages -->
				<div class="px-3 py-4 space-y-2.5 bg-[#0e1621] min-h-[340px]">
					{#each messages as msg}
						<div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[80%] px-3.5 py-2 text-[13px] leading-relaxed {msg.sender === 'user'
									? 'bg-[#2b5278] text-white rounded-2xl rounded-br-md'
									: 'bg-[#182533] text-gray-200 rounded-2xl rounded-bl-md'}"
							>
								<p class="whitespace-pre-line">{msg.text}</p>
								<p class="text-[10px] mt-1 text-right {msg.sender === 'user' ? 'text-blue-300/50' : 'text-gray-600'}">
									{msg.time}
								</p>
							</div>
						</div>
					{/each}

					<!-- Typing -->
					<div class="flex justify-start">
						<div class="bg-[#182533] rounded-2xl rounded-bl-md px-4 py-3">
							<div class="flex items-center gap-1">
								<span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
								<span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full delay-150"></span>
								<span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full delay-300"></span>
							</div>
						</div>
					</div>
				</div>

				<!-- Input bar -->
				<div class="bg-[#17212b] px-3 py-2.5 flex items-center gap-2 border-t border-white/5">
					<div class="flex-1 bg-[#242f3d] rounded-full px-4 py-2 text-sm text-gray-600">
						{$t.whatsappDemo.inputPlaceholder}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes typing {
		0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
		30% { opacity: 1; transform: translateY(-2px); }
	}
	.typing-dot { animation: typing 1.4s ease-in-out infinite; }
	.delay-150 { animation-delay: 0.15s; }
	.delay-300 { animation-delay: 0.3s; }
</style>
