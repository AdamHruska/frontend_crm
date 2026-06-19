<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

import { useToast } from "vue-toastification";
const toast = useToast();

const bjCount = ref("");

const props = defineProps({
	activityId: {
		type: Number,
		default: null,
	},
	activityName: {
		type: String,
		default: "",
	},
});

const emit = defineEmits(["close", "submitted"]);

const saveCount = async () => {
	try {
		await axios.post(
			`${config.public.apiUrl}bj-count`,
			{
				bj_count: Number(bjCount.value),
				activity_id: props.activityId,
			},
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
			},
		);

		toast.success("Počet BJ bol uložený");
		emit("submitted", Number(bjCount.value));
		emit("close");
	} catch (err) {
		console.error(err);
		toast.error("Nastala chyba pri ukladaní BJ");
	}
};
</script>

<template>
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
	<div
		class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg z-50 flex flex-col items-center"
	>
		<div class="relative w-full">
			<Icon
				icon="fa6-solid:xmark"
				class="absolute -top-4 -right-2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
				:width="24"
				:height="24"
				@click="$emit('close')"
			/>
		</div>
		<h1 class="text-xl font-medium text-center mb-2 mt-5">
			Koľko BJ bolo podpísaných?
		</h1>
		<p class="text-sm text-gray-500 mb-5 text-center">
			{{ activityName }}
		</p>

		<input
			type="number"
			min="0"
			class="border border-gray-500 bg-white p-1 h-[35px] rounded-lg w-20 mb-5"
			v-model="bjCount"
			@keyup.enter="saveCount"
		/>

		<div class="flex justify-center gap-10">
			<button
				class="px-5 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
				@click="saveCount"
			>
				Uložiť
			</button>
			<button
				class="px-5 py-2.5 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition-colors"
				@click="$emit('close')"
			>
				Späť
			</button>
		</div>
	</div>
</template>
