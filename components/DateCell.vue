<template>
	<div v-if="date" class="inline-flex flex-col items-center gap-0.5">
		<span class="font-['DM_Mono'] text-xs text-slate-600 whitespace-nowrap">
			{{ formatted }}
		</span>

		<span v-if="status === 'check'" class="text-emerald-600 text-xs font-bold"
			>✓</span
		>
		<span
			v-else-if="status === 'questionmark'"
			class="text-amber-400 text-xs font-bold"
			>?</span
		>
		<span
			v-else-if="status === 'discarded'"
			class="text-rose-500 text-xs font-bold"
			>✗</span
		>
		<span v-else class="text-slate-300 text-xs">–</span>
	</div>

	<span v-else class="text-slate-300 text-xs">—</span>
</template>

<script setup>
const props = defineProps({
	date: String,
	done: Boolean,
	status: String, // "check" | "questionmark" | "discarded" | null
});

const formatted = computed(() => {
	if (!props.date) return null;
	return new Date(props.date).toLocaleDateString("sk-SK", {
		day: "2-digit",
		month: "2-digit",
	});
});
</script>
