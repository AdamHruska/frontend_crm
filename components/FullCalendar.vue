<script setup>
const end_date = ref("");
const emit = defineEmits(["deleteSharedEventsId"]);
import eventBus from "@/eventBus";
import { useCalendarstore } from "#imports";
const calendarStore = useCalendarstore();
import { useUserStore } from "#imports";
const userStore = useUserStore();

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
import { toRaw } from "vue";
const rawData = ref([]);

const addActivity = ref(false);
const updateActivity = ref(false);
const activityID = ref("");
const showMicrosoftEvents = ref(false);

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

// onMounted(async () => {
// 	if (calendarStore.activities.length === 0) {
// 		await calendarStore.fetchActivities();
// 	}

// 	eventBus.on("deleteSharedEvents", ({ userId }) => {
// 		deleteSharedEventsId(userId);
// 	});
// 	rawData.value = calendarStore.activities;
// 	events.value = transformData(rawData.value);
// 	const sharedACT = transformData(
// 		flattenActivities(calendarStore.shared_activities)
// 	);
// 	events.value = [...events.value, ...sharedACT];

// 	calendarOptions.value.events = events.value;
// });

// In your calendar component, update the onMounted section:
// onMounted(async () => {
// 	if (calendarStore.activities.length === 0) {
// 		await calendarStore.fetchActivities();
// 	}

// 	eventBus.on("deleteSharedEvents", ({ userId }) => {
// 		// Filter out events from the deleted user
// 		events.value = events.value.filter((event) => event.user_id !== userId);

// 		// Update calendar options to refresh the view
// 		calendarOptions.value = {
// 			...calendarOptions.value,
// 			events: events.value,
// 		};
// 	});

// 	rawData.value = calendarStore.activities;
// 	events.value = transformData(rawData.value);
// 	const sharedACT = transformData(
// 		flattenActivities(calendarStore.shared_activities)
// 	);
// 	events.value = [...events.value, ...sharedACT];

// 	calendarOptions.value.events = events.value;
// });

// onUnmounted(() => {
// 	eventBus.off("deleteSharedEvents");
// });

onMounted(async () => {
	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}

	// Set up event listener for deleteSharedEvents
	eventBus.on("deleteSharedEvents", ({ userId }) => {
		// Filter out events from the deleted user
		events.value = events.value.filter((event) => event.user_id !== userId);

		// Update calendar options to refresh the view
		calendarOptions.value = {
			...calendarOptions.value,
			events: events.value,
		};
	});

	// Rest of your mounting logic...
	rawData.value = calendarStore.activities;
	events.value = transformData(rawData.value);
	const sharedACT = transformData(
		flattenActivities(calendarStore.shared_activities)
	);
	events.value = [...events.value, ...sharedACT];

	calendarOptions.value.events = events.value;

	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get("code");

	if (code) {
		try {
			// Fetch tokens from the backend
			const response = await axios.post(
				`${config.public.apiUrl}auth/callback`,
				{
					code,
				}
			);

			const { access_token, refresh_token, expires_in } = response.data;

			// Check if "rememberMe" was enabled
			const rememberMe = sessionStorage.getItem("rememberMe") === "true";

			if (rememberMe) {
				// Store tokens in localStorage for persistent storage
				localStorage.setItem("microsoft_access_token", access_token);
				localStorage.setItem("microsoft_refresh_token", refresh_token); // Optional
			} else {
				// Store tokens in sessionStorage for session-only storage
				sessionStorage.setItem("microsoft_access_token", access_token);
				sessionStorage.setItem("microsoft_refresh_token", refresh_token); // Optional
			}

			// Clear the temporary "rememberMe" flag
			sessionStorage.removeItem("rememberMe");

			// Redirect to the calendar page or another destination
			window.location.href = "/calendar";
		} catch (error) {
			console.error("Error during Microsoft login callback:", error);
		}
	}
});

// Don't forget to clean up the event listener
onUnmounted(() => {
	eventBus.off("deleteSharedEvents");
});

const transformData = (data) => {
	return data.map((item) => {
		var farba = "";
		const formattedStart = item.datumCas.replace(" ", "T");
		if (item.created_id == userStore.user.id) {
			farba = "rgb(37 99 235)";
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
			user_id: item.created_id,
		};
	});
};

let eventGuid = 0;

const currentEvents = ref([]);

const handleWeekendsToggle = () => {
	calendarOptions.value.weekends = !calendarOptions.value.weekends;
};

// function handleEventClick(clickInfo) {
// 	toggleUpdateActivity();

// 	activityID.value = clickInfo.event._def.publicId;
// }

const selectedMicrosoftEvent = ref(null);

function handleEventClick(clickInfo) {
	console.log("prebehol klik");
	activityID.value = clickInfo.event._def.publicId;
	eventType.value =
		clickInfo.event.extendedProps.source === "microsoft"
			? "microsoft"
			: "regular";

	if (eventType.value === "microsoft") {
		selectedMicrosoftEvent.value = {
			id: clickInfo.event.id,
			title: clickInfo.event.title,
			start: clickInfo.event.start,
			end: clickInfo.event.end,
			location:
				clickInfo.event.extendedProps.location || "Nebola zadaná lokalita",
			link: clickInfo.event.extendedProps.link,
			organizer: clickInfo.event.extendedProps.organizer,
			attendees: clickInfo.event.extendedProps.attendees,
		};
		console.log(selectedMicrosoftEvent.value);
		toggleMicrosoftEvents();
	} else {
		toggleUpdateActivity();
	}
}

// function handleEventClick(clickInfo) {
// 	activityID.value = clickInfo.event._def.publicId;
// 	eventType.value =
// 		clickInfo.event.extendedProps.source === "microsoft"
// 			? "microsoft"
// 			: "regular";

// 	if (eventType.value === "microsoft") {
// 		selectedMicrosoftEvent.value = {
// 			id: clickInfo.event.id,
// 			title: clickInfo.event.title,
// 			start: clickInfo.event.start,
// 			end: clickInfo.event.end,
// 			location: clickInfo.event.extendedProps.location || "",
// 		};
// 		showMicrosoftEvents.value = true; // Make sure we set this to true
// 		toggleMicrosoftEvents();
// 	} else {
// 		toggleUpdateActivity();
// 	}
// }

// function handleEventClick(clickInfo) {
// 	activityID.value = clickInfo.event._def.publicId;
// 	// Add check for Microsoft events (they won't have a user_id)
// 	eventType.value =
// 		clickInfo.event.extendedProps.source === "microsoft"
// 			? "microsoft"
// 			: "regular";
// 	if (eventType.value !== "microsoft") {
// 		toggleUpdateActivity();
// 	} else {
// 		toggleMicrosoftEvents();
// 	}
// }

const toggleMicrosoftEvents = () => {
	showMicrosoftEvents.value = !showMicrosoftEvents.value;
};

function handleEvents(events) {
	currentEvents.value = events;
}

const flattenActivities = (activitiesObject) => {
	// Use `Object.values` to get arrays of activities and `flat()` to merge them
	return Object.values(activitiesObject).flat();
};

const deleteSharedEventsId = (userId) => {
	console.log("test delete eventov sa vykonal");
	events.value = events.value.filter((event) => event.user_id !== userId);
	// Update the calendar options to reflect the changes
	calendarOptions.value = { ...calendarOptions.value, events: events.value };
};

const addSharedEventsId = async (userId) => {
	loadingStateCalendar.value = true;
	const userIdString = String(userId);

	if (
		Object.values(userStore.user.confirmed_share_user_id).some(
			(id) => String(id) === userIdString
		)
	) {
		console.log("user je tam");

		try {
			const response = await axios.get(
				`${config.public.apiUrl}get-activities-by-creator/${userId}`,
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
						"Content-Type": "application/json",
					},
				}
			);

			if (response && response.data && response.data.activities) {
				const sharedEvents = transformData(
					flattenActivities(response.data.activities)
				);

				// Handle both cases - object with array and direct array
				const rawActivities = toRaw(calendarStore.shared_activities);
				const currentActivities = Array.isArray(rawActivities)
					? rawActivities
					: Object.values(rawActivities)[0] || [];

				calendarStore.shared_activities = [
					...currentActivities,
					...response.data.activities,
				];

				events.value = [...events.value, ...sharedEvents];
				calendarOptions.value.events = events.value;
			}
		} catch (error) {
			console.error("Error adding share ID:", error);
			error.value = "Error adding share ID";
		}
	} else {
		console.log("user nie je tam");
	}

	loadingStateCalendar.value = false;
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
	// If the event is null, it means it was deleted
	if (updatedEvent === null) {
		// Remove the event from events array
		events.value = events.value.filter((event) => event.id != activityID.value);

		// Remove the event from rawData array
		rawData.value = rawData.value.filter(
			(event) => event.id !== activityID.value
		);

		// Update calendar options to refresh the view
		calendarOptions.value = {
			...calendarOptions.value,
			events: events.value,
		};

		// Close the update activity modal
		updateActivity.value = false;
		activityID.value = ""; // Reset the activity ID
	} else {
		// Existing update logic remains the same
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
							? "rgb(37 99 235)" // consistent with transformData method
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

		// Update calendar options to refresh the view
		calendarOptions.value = {
			...calendarOptions.value,
			events: events.value,
		};

		// Close the update activity modal
		updateActivity.value = false;
		activityID.value = ""; // Reset the activity ID
	}
};

const addNewEvent = (newEvent) => {
	// First add the event to rawData since it contains the original format
	rawData.value.push(newEvent);

	// Create the transformed event object in the calendar format
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

	calendarApi.unselect();
}

const loadingStateCalendar = ref(false);

const areMicrosofEventsShown = ref(false);

const fetchMicrosoftEvents = async () => {
	loadingStateCalendar.value = true;
	try {
		const response = await axios.get(`${config.public.apiUrl}microsoft/events`);
		console.log("Microsoft events:", response);
		if (response.data.value) {
			// Transform Microsoft events to match calendar format
			const microsoftEvents = response.data.value.map((event) => ({
				id: event.id,
				title: event.subject,
				start: event.start.dateTime,
				end: event.end.dateTime,
				link: event.onlineMeetingUrl,
				backgroundColor: "rgb(168 85 247)",
				borderColor: "rgb(168 85 247)",
				source: "microsoft",
				extendedProps: {
					source: "microsoft",
					organizer: {
						name: event.organizer?.emailAddress?.name || "Unknown",
						email: event.organizer?.emailAddress?.address || "No email",
					},
					attendees:
						event.attendees?.map((attendee) => ({
							name: attendee.emailAddress?.name,
							email: attendee.emailAddress?.address,
							response: attendee.status?.response,
							type: attendee.type,
						})) || [],
					location: event.location?.displayName || "No location",
					link: event.onlineMeetingUrl,
				},
			}));

			if (areMicrosofEventsShown.value) {
				// Remove Microsoft events if they're currently shown
				events.value = events.value.filter(
					(event) => event.source !== "microsoft"
				);
			} else {
				// Add Microsoft events
				events.value = [...events.value, ...microsoftEvents];
			}

			// Update calendar options to refresh the view
			calendarOptions.value = {
				...calendarOptions.value,
				events: events.value,
			};

			// Toggle visibility state
			areMicrosofEventsShown.value = !areMicrosofEventsShown.value;
		}
	} catch (error) {
		console.error("Error details:", {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
		});
	}
	loadingStateCalendar.value = false;
};

const eventType = ref("regular");
</script>

<template>
	<div class="h-screen">
		<loadigcomponent v-if="calendarStore.loadingState" />
		<loadigcomponent v-if="loadingStateCalendar" />
		<AddActivityCalendar
			v-if="addActivity"
			@cancelAddActivity="toggleAddActivity"
			@addNewEvent="addNewEvent"
			:end_date="end_date"
		/>
		<!-- <EventUpdateCalendar
			:activityID="activityID"
			v-if="updateActivity"
			@cancelAddActivity="toggleUpdateActivity"
			@alterEvents="alterEvents"
			:user.value="user"
		/> -->

		<EventUpdateCalendar
			:activityID="activityID"
			:eventType="eventType"
			v-if="updateActivity"
			@cancelAddActivity="toggleUpdateActivity"
			@alterEvents="alterEvents"
			:user.value="user"
		/>

		<MicrosoftEventDetail
			v-if="showMicrosoftEvents"
			:event="selectedMicrosoftEvent"
			@close="toggleMicrosoftEvents"
			@closeMicrosoftEvents="toggleMicrosoftEvents"
		/>

		<div class="demo-app bg-white">
			<div class="demo-app-sidebar bg-white-force">
				<div
					class="shadow-md rounded-lg bg-white p-4 b-grey-300 rounded-2xl mb-10"
				>
					<div class="demo-app-sidebar-section text-black">
						<h2 class="font-semibold text-2xl text-center">Diár</h2>
					</div>
					<div class="demo-app-sidebar-section text-black">
						<label class="text-lg">
							<input
								type="checkbox"
								:checked="calendarOptions.weekends"
								@change="handleWeekendsToggle"
							/>
							toggle weekends
						</label>
					</div>
					<div class="demo-app-sidebar-section text-black rounded-b-[30px]">
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
				</div>
				<div>
					<CalendarSharing
						class="mt-4"
						@deleteSharedEventsId="deleteSharedEventsId"
						@addSharedEventsId="addSharedEventsId"
					/>
				</div>
				<div>
					<div
						@click="fetchMicrosoftEvents"
						class="flex items-center gap-2 mt-4 ml-7 bg-purple-600 rounded-md hover:bg-purple-700 cursor-pointer w-[240px] px-2 py-1"
					>
						<div class="flex items-center pl-4 gap-2 text-white">
							{{
								areMicrosofEventsShown
									? "Zobraziť Microsoft kalendár"
									: "Skryť Microsoft kalendár"
							}}
							<img src="/public/icons8-microsoft-48.png" alt="" />
						</div>
					</div>
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

.special-component {
	background: linear-gradient(135deg, #ffdee9, #b5fffc);
	color: #1a202c; /* Navy or dark gray */
	padding: 1rem;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.fc-button {
	background-color: #909090 !important; /* Blue background */
	color: black !important; /* Black text */
	border: none !important; /* Remove border if desired */
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.fc-button:hover {
	background-color: #505050 !important; /* Slightly darker blue on hover */
	color: black !important;
}

.fc-button-active {
	background-color: rgb(
		37 99 235
	) !important; /* Lighter blue for active state */
	color: black !important;
}
</style>
