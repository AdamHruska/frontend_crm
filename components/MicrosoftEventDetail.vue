<script setup>
import { Icon } from "@iconify/vue";
import { computed, ref, onMounted } from "vue";

const props = defineProps({
	event: {
		type: Object,
		required: true,
	},
	eventType: { type: String, default: "microsoft" },
});

const showNote = ref(false);

onMounted(() => {
	console.log("google Event Detail Props:", props);
});

// Extrahuj meeting link z note textu (Teams, Meet, Zoom...)
const extractMeetingLink = (note) => {
	if (!note) return null;
	// Hľadaj Teams link (pripojiť sa)
	const teamsMatch = note.match(
		/https:\/\/teams\.microsoft\.com\/meet\/[^\s\n>)]+/,
	);
	if (teamsMatch) return teamsMatch[0];
	// Hľadaj Teams meetup-join link
	const teamsJoinMatch = note.match(
		/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s\n>)]+/,
	);
	if (teamsJoinMatch) return decodeURIComponent(teamsJoinMatch[0]);
	// Hľadaj Google Meet
	const meetMatch = note.match(/https:\/\/meet\.google\.com\/[^\s\n>)]+/);
	if (meetMatch) return meetMatch[0];
	// Hľadaj Zoom
	const zoomMatch = note.match(/https:\/\/[a-z0-9.]*zoom\.us\/[^\s\n>)]+/);
	if (zoomMatch) return zoomMatch[0];
	return null;
};

const meetingLink = computed(() => {
	// Použij explicitný link ak existuje, inak parsuj z note
	return props.event.link || extractMeetingLink(props.event.note) || null;
});

// Ensure all required properties exist with defaults
const event = computed(() => {
	return {
		title: props.event.title || "Untitled Event",
		start: props.event.start,
		end: props.event.end,
		location: props.event.location || "No location",
		organizator: props.event.organizator || "Not specified",
		link: meetingLink.value,
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
		if (isAllDay) return dateObj.toLocaleDateString();
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

				<div
					class="border-b pb-2"
					v-if="eventType === 'microsoft' && props.event.organizer"
				>
					<p class="text-gray-600 font-semibold mb-2">Organizátor</p>
					<p class="font-medium">
						{{ props.event.organizer?.name || "Not specified" }}
					</p>
					<a
						:href="`mailto:${props.event.organizer?.email}`"
						class="font-medium text-underline text-blue-600 hover:opacity-60"
					>
						{{ props.event.organizer?.email || "Not specified" }}
					</a>
				</div>

				<div
					class="border-b pb-2"
					v-if="eventType === 'google' && props.event.organizer"
				>
					<p class="text-gray-600 font-semibold mb-2">Organizátor</p>
					<p class="font-medium">
						{{
							props.event.organizer.displayName ||
							props.event.organizer.email ||
							"Neznámy"
						}}
					</p>
					<a
						v-if="props.event.organizer.email"
						:href="`mailto:${props.event.organizer.email}`"
						class="font-medium text-blue-600 hover:opacity-60"
					>
						{{ props.event.organizer.email }}
					</a>
				</div>

				<!-- Google attendees -->
				<div
					class="border-b pb-2 max-h-[300px] overflow-y-auto"
					v-if="eventType === 'google'"
				>
					<p class="text-gray-600 font-semibold">Účastníci</p>
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
								attendee.displayName
									? `${attendee.displayName} - ${attendee.email}`
									: attendee.email
							}}

							<UTooltip
								text="Pozvánka bola akceptovaná"
								:ui="{ background: '!bg-white', color: '' }"
								v-if="attendee.responseStatus === 'accepted'"
							>
								<span class="p-1 bg-green-500 mr-4 rounded-md">
									<Icon icon="ic:baseline-done" />
								</span>
							</UTooltip>

							<UTooltip
								text="Pozvánka bola odmietnutá"
								:ui="{ background: '!bg-white', color: '' }"
								v-if="attendee.responseStatus === 'declined'"
							>
								<span class="p-1 bg-red-500 mr-4 rounded-md">
									<Icon icon="ic:round-close" />
								</span>
							</UTooltip>

							<UTooltip
								text="Pozvánka čaká na odpoveď"
								:ui="{ background: '!bg-white', color: '' }"
								v-if="
									attendee.responseStatus !== 'accepted' &&
									attendee.responseStatus !== 'declined'
								"
							>
								<span class="p-1 bg-gray-400 mr-4 rounded-md">
									<Icon icon="ic:baseline-question-mark" />
								</span>
							</UTooltip>
						</p>
					</div>
					<div v-else class="font-medium text-gray-500">Žiadni účastníci</div>
				</div>

				<!-- Microsoft attendees -->
				<div
					class="border-b pb-2 max-h-[300px] overflow-y-auto"
					v-if="eventType === 'microsoft'"
				>
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
								v-if="attendee.response == 'accepted'"
							>
								<span class="p-1 w-auto bg-green-500 mr-4 rounded-md">
									<Icon
										icon="ic:baseline-done"
										class="transition-transform duration-300"
									/>
								</span>
							</UTooltip>

							<UTooltip
								text="Pozvánka bola odmietnutá"
								:ui="{ background: '!bg-white', color: '' }"
								v-if="attendee.response == 'declined'"
							>
								<span class="p-1 w-auto bg-red-500 mr-4 rounded-md">
									<Icon
										icon="ic:round-close"
										class="transition-transform duration-300"
									/>
								</span>
							</UTooltip>

							<UTooltip
								text="Pozvánka čaká na odpoveď"
								:ui="{ background: '!bg-white', color: '' }"
								v-if="
									attendee.response !== 'accepted' &&
									attendee.response !== 'declined'
								"
							>
								<span class="p-1 w-auto bg-gray-400 mr-4 rounded-md">
									<Icon
										icon="ic:baseline-question-mark"
										class="transition-transform duration-300"
									/>
								</span>
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
						class="font-medium break-words max-h-[350px] overflow-y-auto whitespace-pre-wrap"
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

				<!-- ✅ Meeting link — explicitný alebo extrahovaný z note -->
				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Link na meeting</p>
					<a
						v-if="meetingLink"
						:href="meetingLink"
						class="font-medium break-words text-blue-600 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Kliknite sem pre otvorenie meetingu
					</a>
					<div v-else class="font-medium text-gray-500">Link nie je určený</div>
				</div>

				<div class="flex justify-between items-center">
					<div class="flex gap-4 items-center" v-if="eventType === 'microsoft'">
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
