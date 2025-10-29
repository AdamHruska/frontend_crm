<script setup>
import { Icon } from "@iconify/vue";
import { ref, onMounted, computed, watch } from "vue";
import { useCalendarstore } from "#imports";
import { useUserStore } from "#imports";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import axios from "axios";

import FullCalendar from "@fullcalendar/vue3";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const calendarStore = useCalendarstore();
const userStore = useUserStore();
const authStore = useAuthStore();
const config = useRuntimeConfig();

const rawData = ref([]);
const events = ref([]);
const microsoftEvents = ref([]);
const addActivity = ref(false);
const updateActivity = ref(false);
const activityID = ref("");
const end_date = ref("");
const currentLoadedMonth = ref(new Date().getMonth());
const currentLoadedYear = ref(new Date().getFullYear());

const props = defineProps({
	date: {
		type: String,
		required: true,
	},
});

// Watch for date changes and update calendar
watch(
	() => props.date,
	(newDate) => {
		if (newDate) {
			calendarOptions.value.initialDate = newDate;

			// Also fetch Microsoft events for the new date
			const dateObj = new Date(newDate);
			fetchMicrosoftEvents(dateObj.getMonth() + 1, dateObj.getFullYear());
		}
	}
);

const emit = defineEmits(["updateDate", "timeClicked"]);

const calendarOptions = ref({
	plugins: [timeGridPlugin, interactionPlugin],
	headerToolbar: {
		left: "prev,next today",
		center: "title",
		right: "",
	},
	initialView: "timeGridDay",
	initialDate: props.date,
	slotMinTime: "06:00:00",
	slotMaxTime: "23:00:00",
	scrollTime: "08:00:00",
	initialEvents: [],
	events: [],
	editable: false,
	selectable: true,
	selectMirror: true,
	dayMaxEvents: true,
	select: handleDateSelect,
	eventClick: handleEventClick,
	dateClick: handleTimeClick,
	slotDuration: "00:30:00",
	allDaySlot: true,
	allDayText: "Celý deň",
	nowIndicator: true,
	eventTimeFormat: {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	},
	slotLabelFormat: {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	},
	locale: "sk",
	firstDay: 1,
	datesSet: (dateInfo) => {
		const currentDate = dateInfo.view.currentStart;
		const month = currentDate.getMonth() + 1;
		const year = currentDate.getFullYear();

		// 👇 Emit date to parent when user navigates
		emit("updateDate", currentDate);

		if (
			month !== currentLoadedMonth.value + 2 ||
			year !== currentLoadedYear.value
		) {
			fetchMicrosoftEvents(month, year);
			currentLoadedMonth.value = month;
			currentLoadedYear.value = year;
		}
	},
	eventDidMount: (info) => {
		if (info.event.allDay) {
			info.el.style.fontWeight = "bold";
		}

		// Style Microsoft events differently
		if (info.event.extendedProps.source === "microsoft") {
			info.el.style.opacity = "0.8";
			info.el.style.borderLeft = "3px solid #6b46c1";
		}
	},
});

const fetchMicrosoftEvents = async (month, year) => {
	try {
		const microsoftEventsData = await calendarStore.fetchMicrosoftEvents(
			month,
			year
		);
		microsoftEvents.value = microsoftEventsData;
		updateCalendarEvents();
	} catch (error) {
		console.error("Error fetching Microsoft events:", error);
	}
};

const transformData = (data) => {
	return data.map((item) => {
		const farba =
			item.created_id == userStore.user.id ? "rgb(37 99 235)" : "red";

		return {
			id: item.id,
			title: item.aktivita,
			start: item.datumCas.replace(" ", "T"),
			end: item.koniec,
			backgroundColor: farba,
			borderColor: farba,
			user_id: item.created_id,
			extendedProps: {
				isMicrosoftEvent: false,
				source: "local",
			},
		};
	});
};

const updateCalendarEvents = () => {
	// Combine local events and Microsoft events
	const allEvents = [...events.value, ...microsoftEvents.value];

	calendarOptions.value = {
		...calendarOptions.value,
		events: allEvents,
	};
};

onMounted(async () => {
	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}

	rawData.value = calendarStore.activities;
	events.value = transformData(rawData.value);

	const sharedACT = transformData(
		flattenActivities(calendarStore.shared_activities)
	);
	events.value = [...events.value, ...sharedACT];

	const selectedDate = new Date(props.date);
	await fetchMicrosoftEvents(
		selectedDate.getMonth() + 1,
		selectedDate.getFullYear()
	);

	updateCalendarEvents();
});

const toggleAddActivity = () => {
	addActivity.value = !addActivity.value;
};

const toggleUpdateActivity = () => {
	updateActivity.value = !updateActivity.value;
};

function handleDateSelect(selectInfo) {
	toggleAddActivity();
	let calendarApi = selectInfo.view.calendar;
	end_date.value = selectInfo.startStr;
	calendarApi.unselect();
}

function handleEventClick(clickInfo) {
	if (clickInfo.event.extendedProps.source === "microsoft") {
		// Handle Microsoft event click - maybe show a tooltip or details
		console.log("Microsoft event clicked:", clickInfo.event);
		// You could emit an event to the parent component
		emit("microsoftEventClick", clickInfo.event);
		return;
	}

	toggleUpdateActivity();
	activityID.value = clickInfo.event._def.publicId;
}

const flattenActivities = (activitiesObject) => {
	return Object.values(activitiesObject).flat();
};

const addNewEvent = (newEvent) => {
	rawData.value.push(newEvent);

	const transformedEvent = {
		id: newEvent.id,
		title: newEvent.aktivita,
		start: newEvent.datumCas.replace(" ", "T"),
		end: newEvent.koniec,
		backgroundColor:
			newEvent.created_id === userStore.user.id ? "rgb(37 99 235)" : "red",
		borderColor:
			newEvent.created_id === userStore.user.id ? "rgb(37 99 235)" : "red",
		user_id: newEvent.created_id,
		extendedProps: {
			isMicrosoftEvent: false,
			source: "local",
		},
	};

	events.value = [...events.value, transformedEvent];
	updateCalendarEvents();
	addActivity.value = false;
};

const alterEvents = (updatedEvent) => {
	if (updatedEvent === null) {
		events.value = events.value.filter((event) => event.id != activityID.value);
		rawData.value = rawData.value.filter(
			(event) => event.id !== activityID.value
		);
	} else {
		rawData.value = rawData.value.map((event) =>
			event.id === updatedEvent.id ? updatedEvent : event
		);

		events.value = events.value.map((event) => {
			if (event.id === updatedEvent.id) {
				return {
					id: updatedEvent.id,
					title: updatedEvent.aktivita,
					start: updatedEvent.datumCas.replace(" ", "T"),
					end: updatedEvent.koniec,
					backgroundColor:
						updatedEvent.created_id === userStore.user.id
							? "rgb(37 99 235)"
							: "red",
					borderColor:
						updatedEvent.created_id === userStore.user.id
							? "rgb(37 99 235)"
							: "red",
					user_id: updatedEvent.created_id,
					extendedProps: {
						isMicrosoftEvent: false,
						source: "local",
					},
				};
			}
			return event;
		});
	}

	updateCalendarEvents();
	updateActivity.value = false;
	activityID.value = "";
};

function handleTimeClick(info) {
	// Only emit the time, don't open any form
	emit("timeClicked", info.dateStr);
	// Prevent the default calendar behavior
	info.jsEvent.preventDefault();
	info.jsEvent.stopPropagation();
}
</script>

<template>
	<div
		class="relative bg-white rounded-lg shadow-lg max-w-md w-full z-10 ml-4 rounded-lg"
	>
		<div class="h-[625px] rounded-lg">
			<loadigcomponent v-if="calendarStore.loadingState" />
			<!-- <AddActivityCalendar
				v-if="addActivity"
				@cancelAddActivity="toggleAddActivity"
				@addNewEvent="addNewEvent"
				:end_date="end_date"
			/> -->

			<!-- <EventUpdateCalendar
				:activityID="activityID"
				v-if="updateActivity"
				@cancelAddActivity="toggleUpdateActivity"
				@alterEvents="alterEvents"
			/> -->

			<div class="demo-app bg-white rounded-lg">
				<div class="demo-app-main bg-white text-black rounded-lg">
					<FullCalendar
						class="demo-app-calendar h-full"
						:options="calendarOptions"
					>
						<template v-slot:eventContent="arg">
							<div class="flex items-center">
								<!-- Microsoft icon for Microsoft events -->
								<Icon
									v-if="arg.event.extendedProps.source === 'microsoft'"
									icon="mdi:microsoft"
									class="mr-1 text-white"
									:width="12"
								/>
								<!-- Different icon for local events -->
								<Icon
									v-else
									icon="mdi:calendar"
									class="mr-1 text-white"
									:width="12"
								/>
								<b>{{ arg.timeText }}</b>
								<i class="ml-1 text-xs">{{ arg.event.title }}</i>
							</div>
						</template>
					</FullCalendar>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.demo-app-main {
	flex-grow: 1;
	padding: 1em;
}

/* Custom styles for Microsoft events */
:deep(.fc-event[data-source="microsoft"]) {
	background-color: #6b46c1 !important;
	border-color: #553c9a !important;
}

:deep(.fc-event[data-source="local"]) {
	/* Your existing local event styles */
}
</style>
