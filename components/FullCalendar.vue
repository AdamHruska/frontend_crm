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

// const events2 = [
// 	{ id: 2, title: "Telefonát nábor", start: "2024-09-08T14:22:00" },
// 	{ id: 3, title: "Telefonát nábor", start: "2024-09-08T14:22:00" },
// 	{ id: 4, title: "Telefonát nábor", start: "2024-09-06T14:23:00" },
// 	{ id: 5, title: "Pohovor", start: "2024-09-14T16:50:00" },
// 	{ id: 6, title: "Telefonát nábor", start: "2024-09-26T19:17:00" },
// 	{ id: 7, title: "Telefonát nábor", start: "2024-09-26T19:17:00" },
// 	{ id: 8, title: "Telefonát nábor", start: "2024-09-26T19:17:00" },
// 	{ id: 9, title: "Telefonát nábor", start: "2024-09-11T19:19:00" },
// 	{ id: 10, title: "Analýza osobných financí", start: "2024-09-07T19:20:00" },
// 	{ id: 11, title: "Pohovor", start: "2024-09-06T19:20:00" },
// ];

// const events = ref([
// 	{
// 		id: createEventId(),
// 		title: "Test",
// 		start: todayStr(),
// 	},
// 	{
// 		id: createEventId(),
// 		title: "Timed Test 2",
// 		start: todayStr() + "T12:00:00",
// 	},
// ]);

// const events = ref([transformData(rawData)]);

// console.log("Events:", events.value);

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
		<div class="demo-app-main bg-white text-black">
			<FullCalendar class="demo-app-calendar" :options="calendarOptions">
				<template v-slot:eventContent="arg">
					<b>{{ arg.timeText }}</b>
					<i>{{ arg.event.title }}</i>
				</template>
			</FullCalendar>
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
