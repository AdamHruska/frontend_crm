<script setup>
import { ref } from "vue";

const page = ref(1);
const items = ref(Array(55));
</script>

<template>
	<UPagination
		v-model="page"
		:total="items.length"
		:ui="{
			rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md',
		}"
		:activeButton="{ color: 'blue' }"
		class="flex justify-center mt-6 ml-[-64px] z-0"
	>
		<template #prev="{ onClick }">
			<UTooltip text="Previous page">
				<UButton
					icon="i-heroicons-arrow-small-left-20-solid"
					color="blue"
					:ui="{ rounded: 'rounded-full' }"
					class="rtl:[&_span:first-child]:rotate-180 me-2"
					@click="onClick"
				/>
			</UTooltip>
		</template>

		<template #next="{ onClick }">
			<UTooltip text="Next page">
				<UButton
					icon="i-heroicons-arrow-small-right-20-solid"
					color="blue"
					:ui="{ rounded: 'rounded-full' }"
					class="rtl:[&_span:last-child]:rotate-180 ms-2"
					@click="onClick"
				/>
			</UTooltip>
		</template>
	</UPagination>
</template>
