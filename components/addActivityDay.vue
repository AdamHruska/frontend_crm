<script setup>
import { Icon } from "@iconify/vue";
import { ref, onMounted, computed } from "vue";
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
const addActivity = ref(false);
const updateActivity = ref(false);
const activityID = ref("");
const end_date = ref("");

const props = defineProps({
	date: {
		type: String,
		required: true,
	},
});
const calendarOptions = ref({
	plugins: [timeGridPlugin, interactionPlugin],
	headerToolbar: {
		left: "prev,next today",
		center: "title",
		right: "", // Remove view switching options
	},
	initialView: "timeGridDay", // Set to day view
	initialDate: props.date,
	slotMinTime: "06:00:00",
	slotMaxTime: "23:00:00",
	scrollTime: "08:00:00",
	initialEvents: [],
	events: events,
	editable: true,
	selectable: true,
	selectMirror: true,
	dayMaxEvents: true,
	select: handleDateSelect,
	eventClick: handleEventClick,
	slotDuration: "00:30:00",
	allDaySlot: true,
	nowIndicator: true,
	// Time format settings
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
	locale: "sk", // Slovak locale for European format
	firstDay: 1, // Monday as first day of week
});

console.log("date ", props.date);

onMounted(async () => {
	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}

	rawData.value = calendarStore.activities;
	events.value = transformData(rawData.value);

	// Include shared activities
	const sharedACT = transformData(
		flattenActivities(calendarStore.shared_activities)
	);

	events.value = [...events.value, ...sharedACT];
	calendarOptions.value.events = events.value;
});

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
		};
	});
};

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
	};

	events.value = [...events.value, transformedEvent];
	calendarOptions.value = {
		...calendarOptions.value,
		events: events.value,
	};

	addActivity.value = false;
	toggleAddActivity();
};

const alterEvents = (updatedEvent) => {
	if (updatedEvent === null) {
		events.value = events.value.filter((event) => event.id != activityID.value);
		rawData.value = rawData.value.filter(
			(event) => event.id !== activityID.value
		);

		calendarOptions.value = {
			...calendarOptions.value,
			events: events.value,
		};

		updateActivity.value = false;
		activityID.value = "";
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
				};
			}
			return event;
		});

		calendarOptions.value = {
			...calendarOptions.value,
			events: events.value,
		};

		updateActivity.value = false;
		activityID.value = "";
	}
};
</script>

<template>
	<div
		class="relative bg-white rounded-lg shadow-lg max-w-md w-full z-10 ml-4 rounded-lg"
	>
		<div class="h-[625px] rounded-lg">
			<loadigcomponent v-if="calendarStore.loadingState" />

			<AddActivityCalendar
				v-if="addActivity"
				@cancelAddActivity="toggleAddActivity"
				@addNewEvent="addNewEvent"
				:end_date="end_date"
			/>

			<EventUpdateCalendar
				:activityID="activityID"
				v-if="updateActivity"
				@cancelAddActivity="toggleUpdateActivity"
				@alterEvents="alterEvents"
			/>

			<div class="demo-app bg-white rounded-lg">
				<div class="demo-app-main bg-white text-black rounded-lg">
					<FullCalendar
						class="demo-app-calendar h-full"
						:options="calendarOptions"
					>
						<template v-slot:eventContent="arg">
							<b>{{ arg.timeText }}</b>
							<i>{{ arg.event.title }}</i>
						</template>
					</FullCalendar>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* You can keep the existing styles from the previous component */
.demo-app-main {
	flex-grow: 1;
	padding: 3em;
}
</style>
