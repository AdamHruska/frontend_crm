<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
import { format } from "date-fns";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();
const token = ref("");
token.value = sessionStorage.getItem("token");

const router = useRouter();

import { ref } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { _backgroundColor } from "#tailwind-config/theme";

const rawData = ref([]);

const addActivity = ref(false);
const updateActivity = ref(false);
const activityID = ref("");

const toggleUpdateActivity = () => {
	if (updateActivity.value === true) {
		location.reload();
	}
	updateActivity.value = !updateActivity.value;
};

const toggleAddActivity = () => {
	if (addActivity.value === true) {
		location.reload();
	}
	addActivity.value = !addActivity.value;
};

const events = ref([]);
//const events2 = ref({});

const calendarOptions = ref({
	plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
	headerToolbar: {
		left: "prev,next today",
		center: "title",
		right: "dayGridMonth,timeGridWeek,timeGridDay",
	},
	initialView: "dayGridMonth",
	initialEvents: events.value,
	events: [],
	editable: true,
	selectable: true,
	selectMirror: true,
	dayMaxEvents: true,
	weekends: true,
	select: handleDateSelect,
	eventClick: handleEventClick,
	eventsSet: handleEvents,
});
onMounted(async () => {
	const response = await axios.get(
		`${config.public.apiUrl}get-activities-diary`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	rawData.value = response.data.activities;
	events.value = transformData(rawData.value);
	// events.value.map((event) => {
	// 	event.end = "2024-09-06T14:24:00";
	// });
	console.log("Events:", events.value);
	calendarOptions.value.events = events.value;
});

const transformData = (data) => {
	return data.map((item) => {
		var farba = "";
		const formattedStart = item.datumCas.replace(" ", "T");
		if (
			item.aktivita === "Telefonát nábor" ||
			item.aktivita === "Telefonát klient" ||
			item.aktivita === "Pohovor"
		) {
			farba = "#4169e1";
		} else {
			farba = "red";
		}
		return {
			id: item.id,
			title: item.aktivita,
			start: formattedStart,
			end: item.koniec,
			backgroundColor: farba,
			borderColor: farba,
		};
	});
};

let eventGuid = 0;

const createEventId = () => {
	return String(eventGuid++);
};

const todayStr = () => {
	return new Date().toISOString().replace(/T.*$/, "");
};

const currentEvents = ref([]);

const handleWeekendsToggle = () => {
	calendarOptions.value.weekends = !calendarOptions.value.weekends;
};

function handleDateSelect(selectInfo) {
	toggleAddActivity();
	// let title = prompt("Please enter a new title for your event");
	let calendarApi = selectInfo.view.calendar;

	calendarApi.unselect();

	if (title) {
		calendarApi.addEvent({
			id: createEventId(),
			title,
			start: selectInfo.startStr,
			end: selectInfo.endStr,
			allDay: selectInfo.allDay,
		});
	}
}

// zlucit shared events with user events

// const handleSharedCalendars = (sharedEvents) => {
//   // Combine the user's events with shared events
//   const allEvents = [...events.value, ...sharedEvents]
//   calendarOptions.value.events = allEvents

function handleEventClick(clickInfo) {
	toggleUpdateActivity();
	console.log(clickInfo.event._def.publicId);
	activityID.value = clickInfo.event._def.publicId;
}

function handleEvents(events) {
	currentEvents.value = events;
}
</script>

<template>
	<AddActivityCalendar
		v-if="addActivity"
		@cancelAddActivity="toggleAddActivity"
	/>
	<EventUpdateCalendar
		:activityID="activityID"
		v-if="updateActivity"
		@cancelAddActivity="toggleUpdateActivity"
	/>
	<div class="demo-app">
		<div class="demo-app-sidebar bg-blue-200">
			<div class="demo-app-sidebar-section bg-blue-200 text-black">
				<h2 class="font-semibold text-2xl text-center">Diár</h2>
			</div>
			<div class="demo-app-sidebar-section bg-blue-200 text-black">
				<label class="text-lg">
					<input
						type="checkbox"
						:checked="calendarOptions.weekends"
						@change="handleWeekendsToggle"
					/>
					toggle weekends
				</label>
			</div>
			<div class="demo-app-sidebar-section bg-blue-200 text-black">
				<h2>All Events ({{ currentEvents.length }})</h2>
				<ul>
					<li v-for="event in currentEvents" :key="event.id">
						<b>{{ event.startStr }}</b>
						<i>{{ event.title }}</i>
					</li>
				</ul>
			</div>
		</div>
		<div class="demo-app-main bg-white text-black relative">
			<FullCalendar class="demo-app-calendar" :options="calendarOptions">
				<template v-slot:eventContent="arg">
					<b>{{ arg.timeText }}</b>
					<i>{{ arg.event.title }}</i>
				</template>
			</FullCalendar>
			<CalendarSharing class="absolute top-[98px] right-[85px]" />
		</div>
	</div>
</template>

<style lang="css">
h2 {
	margin: 0;
	font-size: 16px;
}

ul {
	margin: 0;
	padding: 0 0 0 1.5em;
}

li {
	margin: 1.5em 0;
	padding: 0;
}

b {
	margin-right: 3px;
}

.demo-app {
	display: flex;
	min-height: 100%;
	font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
	font-size: 14px;
}

.demo-app-sidebar {
	width: 300px;
	line-height: 1.5;
	background: #eaf9ff;
	border-right: 1px solid #d3e2e8;
}

.demo-app-sidebar-section {
	padding: 2em;
}

.demo-app-main {
	flex-grow: 1;
	padding: 3em;
}

.fc {
	max-width: 1100px;
	margin: 0 auto;
}
</style>
