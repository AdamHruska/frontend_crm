<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
const props = defineProps({
	event: {
		type: Object,
		required: true,
	},
});

const showNote = ref(false);

onMounted(() => {
	console.log("Microsoft Event Detail Props:", props.event.importance);
});

// Ensure all required properties exist with defaults
const event = computed(() => {
	return {
		title: props.event.title || "Untitled Event",
		start: props.event.start,
		end: props.event.end,
		location: props.event.location || "No location",
		organizator: props.event.organizator || "Not specified",
		link: props.event.link || "",
		id: props.event.id || "",
		attendees: props.event.attendees || [],
		allDay: props.event.allDay || false,
	};
});

const emit = defineEmits(["close", "deleteMicrosoftEvent"]);

const formatDateTime = (date, isAllDay = false) => {
	if (!date) return "Not specified";

	try {
		const dateObj = new Date(date);

		// For all-day events, show only the date without time
		if (isAllDay) {
			return dateObj.toLocaleDateString();
		}

		// For regular events, show date and time
		return dateObj.toLocaleString();
	} catch (error) {
		console.error("Error formatting date:", error);
		return "Date format error";
	}
};

const closeModal = () => {
	emit("close");
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<div
			class="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full z-10 max-h-[100vh] overflow-y-auto"
		>
			<!-- Close button -->
			<div class="flex justify-between items-center mb-4">
				<button
					@click="closeModal"
					class="absolute top-4 right-6 cursor-pointer hover:scale-110 transition-transform"
				>
					<Icon icon="fa6-solid:xmark" class="h-6 w-6" />
				</button>

				<!-- Event details -->
				<h2 class="text-xl font-bold mb-4 pr-4">
					{{ props.event.title || "Untitled Event" }}
				</h2>
				<div
					v-if="props.event.allDay"
					class="text-sm font-medium text-blue-600 mb-2"
				>
					Celodenná udalosť
				</div>
			</div>

			<div class="space-y-4">
				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Začiatok</p>
					<p class="font-medium">
						{{ formatDateTime(props.event.start, props.event.allDay) }}
					</p>
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Koniec</p>
					<p class="font-medium">
						{{ formatDateTime(props.event.end, props.event.allDay) }}
					</p>
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold mb-2">Organizátor</p>
					<p class="font-medium">
						{{ props.event.organizer.name || "Not specified" }}
					</p>

					<a
						href="mailto:{{ props.event.organizer.email }}"
						class="font-medium text-underline text-blue-600 hover:opacity-60"
					>
						{{ props.event.organizer.email || "Not specified" }}
					</a>
				</div>

				<div class="border-b pb-2 max-h-[300px] overflow-y-auto">
					<p class="text-gray-600 font-semibold">Ostatní účastníci</p>
					<div
						v-if="props.event.attendees && props.event.attendees.length"
						class="space-y-2"
					>
						<p
							v-for="(attendee, index) in props.event.attendees"
							:key="index"
							class="font-medium flex items-center justify-between"
						>
							{{
								attendee && attendee.name === attendee.email
									? attendee.email
									: attendee && attendee.name && attendee.email
									? `${attendee.name} - ${attendee.email}`
									: attendee && attendee.name
									? attendee.name
									: attendee && attendee.email
									? attendee.email
									: "Unknown attendee"
							}}
							<UTooltip
								text="Pozvánka bola akceptovaná"
								:ui="{ background: '!bg-white', color: '' }"
								class=""
								v-if="attendee.response == 'accepted'"
							>
								<span class="p-1 w-auto bg-green-500 mr-4 rounded-md"
									><Icon
										icon="ic:baseline-done"
										class="transition-transform duration-300"
								/></span>
							</UTooltip>

							<UTooltip
								text="Pozvánka bola odmietnutá"
								:ui="{ background: '!bg-white', color: '' }"
								class=""
								v-if="attendee.response == 'declined'"
							>
								<span class="p-1 w-auto bg-red-500 mr-4 rounded-md"
									><Icon
										icon="ic:round-close"
										class="transition-transform duration-300"
								/></span>
							</UTooltip>

							<UTooltip
								text="Pozvánka čaká na odpoveď"
								:ui="{ background: '!bg-white', color: '' }"
								class=""
								v-if="
									attendee.response !== 'accepted' &&
									attendee.response !== 'declined'
								"
							>
								<span class="p-1 w-auto bg-gray-400 mr-4 rounded-md"
									><Icon
										icon="ic:baseline-question-mark"
										class="transition-transform duration-300"
								/></span>
							</UTooltip>
						</p>
					</div>
					<div v-else class="font-medium text-gray-500">Žiadni účastníci</div>
				</div>

				<div class="border-b pb-2">
					<div
						class="text-gray-600 font-semibold hover:bg-gray-300 cursor-pointer flex gap-4 items-center"
						@click="showNote = !showNote"
					>
						<div>Poznámka</div>
						<div>
							<Icon
								icon="pepicons-pencil:arrow-down"
								class="transition-transform duration-300"
								:class="{ 'rotate-180': showNote }"
							/>
						</div>
					</div>
					<p
						class="font-medium break-words max-h-[350px] overflow-y-auto"
						v-if="showNote"
					>
						{{ props.event.note || "Not specified" }}
					</p>
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Lokalita</p>
					<p class="font-medium break-words">
						{{ props.event.location || "Not specified" }}
					</p>
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Link na meeting</p>
					<a
						v-if="props.event.link"
						:href="props.event.link"
						class="font-medium break-words text-blue-600 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Kliknite sem pre otvorenie meetingu
					</a>
					<div v-else class="font-medium text-gray-500">Link nie je určený</div>
				</div>

				<!-- <div>
						<div
							v-if="props.event.attendees[0].response == 'accepted'"
							class="px-4 py-2 bg-green-500 text-white rounded-md"
						>
							Stretnutie akceptované
						</div>
						<div
							v-if="props.event.attendees[0].response == 'declined'"
							class="px-4 py-2 bg-red-500 text-white rounded-md"
						>
							Stretnutie odmietnuté
						</div>
						<div
							v-if="
								props.event.attendees[0].response !== 'accepted' &&
								props.event.attendees[0].response !== 'declined'
							"
							class="px-4 py-2 bg-gray-500 text-white rounded-md"
						>
							Čaká na odpoveď
						</div>
					</div> -->

				<div class="flex justify-between items-center">
					<div class="flex gap-4 items-center">
						<div class="text-gray-600 font-semibold">Dôležitosť:</div>

						<div
							class="px-2 py-1 rounded-md bg-yellow-300"
							v-if="props.event.importance === 'normal'"
						>
							Normálna
						</div>

						<div
							class="px-2 py-1 rounded-md bg-red-500 text-white"
							v-if="props.event.importance === 'high'"
						>
							Vysoká
						</div>

						<div
							class="px-2 py-1 rounded-md bg-green-500"
							v-if="props.event.importance === 'low'"
						>
							Nízka
						</div>
					</div>

					<button
						v-if="props.event.id"
						@click="$emit('deleteMicrosoftEvent', props.event.id)"
						class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-400 hover:scale-105 flex items-center"
					>
						<Icon icon="mdi:delete" class="mr-2" />
						Vymazať udalosť
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
