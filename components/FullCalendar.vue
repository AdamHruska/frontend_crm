<script setup>
const end_date = ref("");
const emit = defineEmits(["deleteSharedEventsId"]);

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

const user = ref({});
const sharedIDs = ref([]);

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
		//location.reload();
	}
	updateActivity.value = !updateActivity.value;
};

const toggleAddActivity = () => {
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
	initialView: "timeGridWeek",
	slotMinTime: "06:00:00",
	slotMaxTime: "23:00:00",
	scrollTime: "08:00:00",
	initialEvents: [],
	events: events,
	editable: true,
	selectable: true,
	selectMirror: true,
	dayMaxEvents: true,
	weekends: true,
	select: handleDateSelect,
	eventClick: handleEventClick,
	eventsSet: handleEvents,
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
	// Locale settings for European date format
	locale: "sk", // Slovak locale for European format
	firstDay: 1, // Monday as first day of week
});

// zobrazenie roznych hranic casov
// initialView: "timeGridWeek", // Changed from dayGridWeek to timeGridWeek
// slotMinTime: "06:00:00", // Optional: Set start time of day
// slotMaxTime: "22:00:00", // Optional: Set end time of day
// scrollTime: "08:00:00", // Optional: Set initial scroll time
// initialEvents: [],

onMounted(async () => {
	const response = await axios.get(
		`${config.public.apiUrl}get-activities-diary`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);

	user.value = await axios.get(`${config.public.apiUrl}get-user`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});

	user.value = user.value.data.user;
	user.value.id;

	const shareIDs = user.value.share_user_id;
	const array = JSON.parse(shareIDs);
	sharedIDs.value = array.map(Number);

	// getting shared users activities
	const shared_activities = await axios.post(
		`${config.public.apiUrl}get-activities`,
		{
			user_ids: sharedIDs.value,
		},
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
				"Content-Type": "application/json",
			},
		}
	);

	console.log("Shared activities:", shared_activities.data.activities);

	rawData.value = response.data.activities;
	events.value = transformData(rawData.value);
	const sharedACT = transformData(
		flattenActivities(shared_activities.data.activities)
	);
	console.log("Shared activities test:", sharedACT);

	events.value = [...events.value, ...sharedACT];
	console.log("Events:", events.value);
	calendarOptions.value.events = events.value;
});

const transformData = (data) => {
	return data.map((item) => {
		var farba = "";
		const formattedStart = item.datumCas.replace(" ", "T");
		if (item.created_id == user.value.id) {
			farba = "blue";
		} else {
			farba = "red";
		}

		console.log("item:", item);

		return {
			id: item.id,
			title: item.aktivita,
			start: formattedStart,
			end: item.koniec,
			backgroundColor: farba,
			borderColor: farba,
			user_id: item.created_id,
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

// function handleDateSelect(selectInfo) {
// 	toggleAddActivity();
// 	// let title = prompt("Please enter a new title for your event");
// 	let calendarApi = selectInfo.view.calendar;

// 	calendarApi.unselect();

// 	if (title) {
// 		calendarApi.addEvent({
// 			id: createEventId(),
// 			title,
// 			start: selectInfo.startStr,
// 			end: selectInfo.endStr,
// 			allDay: selectInfo.allDay,
// 		});
// 	}
// }

// zlucit shared events with user events

// const handleSharedCalendars = (sharedEvents) => {
//   // Combine the user's events with shared events
//   const allEvents = [...events.value, ...sharedEvents]
//   calendarOptions.value.events = allEvents

function handleEventClick(clickInfo) {
	toggleUpdateActivity();
	console.log("skuska", clickInfo.event._def.publicId);
	activityID.value = clickInfo.event._def.publicId;
}

function handleEvents(events) {
	currentEvents.value = events;
}

const flattenActivities = (activitiesObject) => {
	// Use `Object.values` to get arrays of activities and `flat()` to merge them
	return Object.values(activitiesObject).flat();
};

const deleteSharedEventsId = (userId) => {
	console.log("test emit", userId);

	events.value = events.value.filter((event) => event.user_id !== userId);

	// Update the calendar options to reflect the changes
	calendarOptions.value = { ...calendarOptions.value, events: events.value };
};

const addSharedEventsId = async (userId) => {
	console.log("test emit add", userId);

	try {
		// Fetch activities created by the specified userId
		const response = await axios.get(
			`${config.public.apiUrl}get-activities-by-creator/${userId}`,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		// Check if the response contains the expected data
		if (response && response.data && response.data.activities) {
			// Transform the fetched activities into the calendar event format
			const sharedEvents = transformData(response.data.activities);

			// Update the events in the calendar
			events.value = [...events.value, ...sharedEvents]; // Merge new events
			calendarOptions.value.events = events.value; // Update calendar options

			console.log("Updated events:", events.value); // Log the updated events for debugging
		} else {
			console.error("No activities found in response.");
		}
	} catch (error) {
		console.error("Error adding share ID:", error);
		error.value = "Error adding share ID"; // Set error message for user feedback
	}
};

const recentEvents = computed(() => {
	const now = new Date();
	const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
	const endOfDay = new Date(now);
	endOfDay.setHours(23, 59, 59, 999); // Set to the end of the current day

	return currentEvents.value.filter((event) => {
		const eventStart = new Date(event.start);
		return eventStart >= twoHoursAgo && eventStart <= endOfDay;
	});
});

const formatDate = (dateString) => {
	// Parse the date string to a Date object
	const date = new Date(dateString);

	// Format the date to DD.MM-HH:MM
	return format(date, "dd.MM.yyyy HH:mm");
};

const displayUpdateEvent = (event) => {
	toggleUpdateActivity();
	activityID.value = event.id;
};

const alterEvents = (updatedEvent) => {
	// First update the rawData array since it contains the original format
	rawData.value = rawData.value.map((event) =>
		event.id === updatedEvent.id ? updatedEvent : event
	);

	// Then update the events array using your transform function
	events.value = events.value.map((event) => {
		if (event.id === updatedEvent.id) {
			return {
				id: updatedEvent.id,
				title: updatedEvent.aktivita,
				start: updatedEvent.datumCas.replace(" ", "T"),
				end: updatedEvent.koniec,
				backgroundColor:
					updatedEvent.created_id === user.value.id ? "blue" : "red",
				borderColor: updatedEvent.created_id === user.value.id ? "blue" : "red",
				user_id: updatedEvent.created_id,
			};
		}
		return event;
	});

	// Update calendar options to refresh the view
	calendarOptions.value = {
		...calendarOptions.value,
		events: events.value,
	};
};

// const addNewEvent = (newEvent) => {
// 	// First add the event to rawData since it contains the original format
// 	rawData.value.push(newEvent);

// 	// Create the transformed event object in the calendar format
// 	const transformedEvent = {
// 		id: newEvent.id,
// 		title: newEvent.aktivita,
// 		start: newEvent.datumCas.replace(" ", "T"),
// 		end: newEvent.koniec,
// 		backgroundColor: newEvent.created_id === user.value.id ? "blue" : "red",
// 		borderColor: newEvent.created_id === user.value.id ? "blue" : "red",
// 		user_id: newEvent.created_id,
// 	};

// 	// Add the new event to the events array
// 	events.value = [...events.value, transformedEvent];

// 	// Update calendar options to refresh the view
// 	calendarOptions.value = {
// 		...calendarOptions.value,
// 		events: events.value,
// 	};
// };

const addNewEvent = (newEvent) => {
	// First add the event to rawData since it contains the original format
	rawData.value.push(newEvent);

	// Create the transformed event object in the calendar format
	const transformedEvent = {
		id: newEvent.id,
		title: newEvent.aktivita,
		start: newEvent.datumCas.replace(" ", "T"),
		end: newEvent.koniec,
		backgroundColor: newEvent.created_id === user.value.id ? "blue" : "red",
		borderColor: newEvent.created_id === user.value.id ? "blue" : "red",
		user_id: newEvent.created_id,
	};

	// Add the new event to the events array
	events.value = [...events.value, transformedEvent];

	// Update calendar options to refresh the view
	calendarOptions.value = {
		...calendarOptions.value,
		events: events.value,
	};

	// Close the add form after successful addition
	addActivity.value = false;
	toggleAddActivity();
};

function handleDateSelect(selectInfo) {
	toggleAddActivity();
	let calendarApi = selectInfo.view.calendar;
	end_date.value = selectInfo.startStr;
	console.log("Stark", selectInfo.startStr, "end", selectInfo.endStr);
	calendarApi.unselect();
}
</script>

<template>
	<div class="h-screen">
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
			:user.value="user"
		/>
		<div class="demo-app bg-white">
			<div class="demo-app-sidebar bg-white-force">
				<div
					class="demo-app-sidebar-section text-black"
					style="background-color: #c0c2ce"
				>
					<h2 class="font-semibold text-2xl text-center">Diár</h2>
				</div>
				<div
					class="demo-app-sidebar-section text-black"
					style="background-color: #c0c2ce"
				>
					<label class="text-lg">
						<input
							type="checkbox"
							:checked="calendarOptions.weekends"
							@change="handleWeekendsToggle"
						/>
						toggle weekends
					</label>
				</div>
				<div
					class="demo-app-sidebar-section text-black rounded-b-[30px]"
					style="background-color: #c0c2ce"
				>
					<h2 class="underline">Recent Events:</h2>
					<ul class="">
						<li
							v-for="event in recentEvents"
							:key="event.id"
							@click="displayUpdateEvent(event)"
							class="cursor-pointer hover:bg-blue-50 rounded text-black text-sm flex items-center justify-center"
						>
							<b>{{ formatDate(event.startStr) }}</b>
							<i>{{ event.title }}</i>
						</li>
					</ul>
				</div>
				<div>
					<CalendarSharing
						class="mt-4"
						@deleteSharedEventsId="deleteSharedEventsId"
						@addSharedEventsId="addSharedEventsId"
					/>
				</div>
			</div>
			<div class="demo-app-main bg-white text-black">
				<!-- <CalendarSharing class="absolute left-5" /> -->

				<FullCalendar class="demo-app-calendar" :options="calendarOptions">
					<template v-slot:eventContent="arg">
						<b>{{ arg.timeText }}</b>
						<i>{{ arg.event.title }}</i>
					</template>
				</FullCalendar>
			</div>
		</div>
	</div>
</template>

<style lang="css">
.bg-white-force {
	background-color: #fff !important;
}

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
	padding: 1em;
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
