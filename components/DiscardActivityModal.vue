<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

const discardMessage = ref("");

const props = defineProps({
	activityData: {
		type: Object,
		required: true,
		default: () => ({}),
	},
});

onMounted(() => {
	console.log("DiscardActivityModal mounted with data:", props.activityData);
	console.log("id", props.activityData.id);
	console.log("aktivita", props.activityData.aktivita);
});

const emit = defineEmits(["closeDiscardActivity", "activityUpdated"]);

const updateEvent = async () => {
	const now = new Date();
	const formattedDate = now.toLocaleDateString("sk-SK");

	// ak je poznamka null, použije sa prázdny string
	const oldNote = props.activityData.poznamka ?? "";

	const newNote =
		oldNote +
		(oldNote ? "\n" : "") + // ak bola stará poznámka, dá oddeľovač
		`[${formattedDate}] ${discardMessage.value} `;

	const response = await axios.put(
		`${config.public.apiUrl}update-activities/${props.activityData.id}`,
		{
			contact_id: props.activityData.contact_id,
			aktivita: props.activityData.aktivita,
			datumCas: props.activityData.datumCas,
			koniec: props.activityData.koniec,
			poznamka: newNote,
			volane: props.activityData.volane,
			dovolane: props.activityData.dovolane,
			dohodnute: props.activityData.dohodnute ? 1 : 0,
			miesto_stretnutia: props.activityData.miesto_stretnutia,
			online_meeting: props.activityData.online_meeting,
		},
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);

	emit("activityUpdated", {
		...props.activityData,
		poznamka: newNote,
		activity_status: "discarded",
	});

	//emit("closeDiscardActivity");
};
</script>
;

<template>
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
	<div
		class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg z-50"
	>
		<div class="relative">
			<Icon
				icon="fa6-solid:xmark"
				class="absolute -top-4 -right-2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
				:width="24"
				:height="24"
				@click="$emit('closeDiscardActivity')"
			/>
		</div>
		<h1 class="text-xl font-medium text-center mb-5 mt-5">
			Prečo sa aktivita nuskutočnila?
		</h1>

		<input
			type="text"
			class="border border-gray-500 bg-white p-1 h-[35px] rounded-lg w-full mb-5"
			v-model="discardMessage"
		/>

		<div class="flex justify-center gap-10">
			<button
				class="px-5 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
				@click="updateEvent"
			>
				Zrušiť aktivitu
			</button>
			<button
				class="px-5 py-2.5 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition-colors"
				@click="$emit('closeDiscardActivity')"
			>
				Späť
			</button>
		</div>
	</div>
</template>
