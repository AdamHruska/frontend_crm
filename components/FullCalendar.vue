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

// const calendarOptions = ref({
// 	plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
// 	headerToolbar: {
// 		left: "prev,next today",
// 		center: "title",
// 		right: "dayGridMonth,timeGridWeek,timeGridDay",
// 	},
// 	initialView: "timeGridWeek",
// 	slotMinTime: "06:00:00",
// 	slotMaxTime: "23:00:00",
// 	scrollTime: "08:00:00",
// 	initialEvents: [],
// 	events: events,
// 	editable: true,
// 	selectable: true,
// 	selectMirror: true,
// 	dayMaxEvents: true,
// 	weekends: true,
// 	select: handleDateSelect,
// 	eventClick: handleEventClick,
// 	eventsSet: handleEvents,
// 	slotDuration: "00:30:00",
// 	allDaySlot: true,
// 	nowIndicator: true,
// 	// Time format settings
// 	eventTimeFormat: {
// 		hour: "2-digit",
// 		minute: "2-digit",
// 		hour12: false,
// 	},
// 	slotLabelFormat: {
// 		hour: "2-digit",
// 		minute: "2-digit",
// 		hour12: false,
// 	},
// 	// Locale settings for European date format
// 	locale: "sk", // Slovak locale for European format
// 	firstDay: 1, // Monday as first day of week
// });

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
	eventDrop: handleEventDrop, // Add this handler for drag and drop
	eventResize: handleEventResize, // Add this handler for resizing events
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

function handleEventDrop(dropInfo) {
	const eventId = dropInfo.event.id;
	const newStart = dropInfo.event.start;
	const newEnd = dropInfo.event.end;

	// Check if this is a Microsoft event
	if (dropInfo.event.extendedProps.source === "microsoft") {
		updateMicrosoftEvent(eventId, newStart, newEnd, dropInfo.event.title);
		return;
	}

	// Check if user has permission to edit this event
	const event = rawData.value.find((event) => event.id == eventId);
	if (event && event.created_id !== userStore.user.id) {
		alert("You don't have permission to edit this event.");
		dropInfo.revert(); // Revert the drag if no permission
		return;
	}

	// Format dates for backend
	const formattedStart = formatDateForBackend(newStart);
	const formattedEnd = formatDateForBackend(newEnd);

	// Update the event in the backend
	updateEventInBackend(eventId, formattedStart, formattedEnd);
}

function handleEventResize(resizeInfo) {
	const eventId = resizeInfo.event.id;
	const newEnd = resizeInfo.event.end;

	// Check if this is a Microsoft event
	if (resizeInfo.event.extendedProps.source === "microsoft") {
		updateMicrosoftEvent(
			eventId,
			resizeInfo.event.start,
			newEnd,
			resizeInfo.event.title
		);
		return;
	}

	// Check if user has permission to edit this event
	const event = rawData.value.find((event) => event.id == eventId);
	if (event && event.created_id !== userStore.user.id) {
		alert("You don't have permission to edit this event.");
		resizeInfo.revert(); // Revert the resize if no permission
		return;
	}

	// Format date for backend
	const formattedEnd = formatDateForBackend(newEnd);

	// Update the event in the backend
	updateEventEndInBackend(eventId, formattedEnd);
}

function formatDateForBackend(date) {
	// Convert date to 'YYYY-MM-DD HH:MM:SS' format
	return format(date, "yyyy-MM-dd HH:mm:ss");
}

async function updateEventInBackend(eventId, newStart, newEnd) {
	loadingStateCalendar.value = true;

	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activities/${eventId}`,
			{
				datumCas: newStart,
				koniec: newEnd,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.data.status === "success") {
			// Update the local data
			const updatedEvent = response.data.activity;

			// Update in rawData
			rawData.value = rawData.value.map((event) =>
				event.id == eventId ? updatedEvent : event
			);

			// No need to update events.value as FullCalendar already updated the UI
		} else {
			// If there was an error, revert the change
			alert("Failed to update event: " + response.data.message);
			calendarOptions.value.events = [...events.value]; // Force refresh
		}
	} catch (error) {
		console.error("Error updating event:", error);
		alert("An error occurred while updating the event. Please try again.");
		calendarOptions.value.events = [...events.value]; // Force refresh
	} finally {
		loadingStateCalendar.value = false;
	}
}

async function updateEventEndInBackend(eventId, newEnd) {
	loadingStateCalendar.value = true;

	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activity-end/${eventId}`,
			{
				koniec: newEnd,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.data.status === "success") {
			// Update the local data
			const updatedEvent = response.data.activity;

			// Update in rawData
			rawData.value = rawData.value.map((event) =>
				event.id == eventId ? updatedEvent : event
			);

			// No need to update events.value as FullCalendar already updated the UI
		} else {
			// If there was an error, revert the change
			alert("Failed to update event: " + response.data.message);
			calendarOptions.value.events = [...events.value]; // Force refresh
		}
	} catch (error) {
		console.error("Error updating event:", error);
		alert("An error occurred while updating the event. Please try again.");
		calendarOptions.value.events = [...events.value]; // Force refresh
	} finally {
		loadingStateCalendar.value = false;
	}
}

// Update Microsoft event
async function updateMicrosoftEvent(eventId, newStart, newEnd, title) {
	loadingStateCalendar.value = true;

	try {
		const response = await axios.patch(
			`${config.public.apiUrl}events/${eventId}`,
			{
				subject: title,
				start: {
					dateTime: format(newStart, "yyyy-MM-dd'T'HH:mm:ss"),
					timeZone: "UTC",
				},
				end: {
					dateTime: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss"),
					timeZone: "UTC",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.status === 200) {
			// Success - no need to do anything, FullCalendar already updated the UI
		} else {
			alert("Failed to update Microsoft event");
			calendarOptions.value.events = [...events.value]; // Force refresh
		}
	} catch (error) {
		console.error("Error updating Microsoft event:", error);
		alert(
			"An error occurred while updating the Microsoft event. Please try again."
		);
		calendarOptions.value.events = [...events.value]; // Force refresh
	} finally {
		loadingStateCalendar.value = false;
	}
}

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

// function handleDateSelect(selectInfo) {
// 	toggleAddActivity();
// 	let calendarApi = selectInfo.view.calendar;
// 	end_date.value = selectInfo.startStr;

// 	calendarApi.unselect();
// }

function handleDateSelect(selectInfo) {
	selectedDate.value = selectInfo.startStr;
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
		const response = await axios.get(`${config.public.apiUrl}get-events`);
		console.log("Microsoft events:", response);
		if (response.data.value) {
			// Transform Microsoft events to match calendar format
			const microsoftEvents = response.data.value.map((event) => ({
				id: event.id,
				title: event.subject,
				start: event.start.dateTime,
				end: event.end.dateTime,
				link: event.onlineMeetingUrl ?? "",
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

// const fetchMicrosoftEvents = async () => {
// 	loadingStateCalendar.value = true;
// 	let allEvents = [];
// 	let nextLink = `${config.public.apiUrl}get-events`;

// 	try {
// 		while (nextLink) {
// 			const response = await axios.get(nextLink);
// 			console.log("Microsoft events response:", response);

// 			if (response.data.value) {
// 				// Transform Microsoft events to match calendar format
// 				const microsoftEvents = response.data.value.map((event) => ({
// 					id: event.id,
// 					title: event.subject,
// 					start: event.start.dateTime,
// 					end: event.end.dateTime,
// 					link: event.onlineMeetingUrl ?? "", // Ensure no null values
// 					backgroundColor: "rgb(168 85 247)",
// 					borderColor: "rgb(168 85 247)",
// 					source: "microsoft",
// 					extendedProps: {
// 						source: "microsoft",
// 						organizer: {
// 							name: event.organizer?.emailAddress?.name || "Unknown",
// 							email: event.organizer?.emailAddress?.address || "No email",
// 						},
// 						attendees:
// 							event.attendees?.map((attendee) => ({
// 								name: attendee.emailAddress?.name,
// 								email: attendee.emailAddress?.address,
// 								response: attendee.status?.response,
// 								type: attendee.type,
// 							})) || [],
// 						location: event.location?.displayName || "No location",
// 						link: event.onlineMeetingUrl ?? "", // Ensure no null values
// 					},
// 				}));

// 				// Add events to the list
// 				allEvents = [...allEvents, ...microsoftEvents];

// 				// Check if there are more pages to fetch
// 				nextLink = response.data["@odata.nextLink"] || null;
// 			} else {
// 				nextLink = null;
// 			}
// 		}

// 		if (areMicrosofEventsShown.value) {
// 			// Remove Microsoft events if they're currently shown
// 			events.value = events.value.filter(
// 				(event) => event.source !== "microsoft"
// 			);
// 		} else {
// 			// Add all fetched events
// 			events.value = [...events.value, ...allEvents];
// 		}

// 		// Update calendar options to refresh the view
// 		calendarOptions.value = {
// 			...calendarOptions.value,
// 			events: events.value,
// 		};

// 		// Toggle visibility state
// 		areMicrosofEventsShown.value = !areMicrosofEventsShown.value;
// 	} catch (error) {
// 		console.error("Error details:", {
// 			message: error.message,
// 			response: error.response?.data,
// 			status: error.response?.status,
// 		});
// 	}
// 	loadingStateCalendar.value = false;
// };

// const microsoftEvents = response.data.value.map((event) => ({
//     id: event.id,
//     title: event.subject,
//     start: event.start.dateTime,
//     end: event.end.dateTime,
//     link: event.onlineMeetingUrl,
//     backgroundColor: "rgb(168 85 247)",
//     borderColor: "rgb(168 85 247)",
//     source: "microsoft",
//     extendedProps: {
//         source: "microsoft",
//         organizer: {
//             name: event.organizer?.emailAddress?.name || "Unknown",
//             email: event.organizer?.emailAddress?.address || "No email",
//         },
//         attendees:
//             event.attendees?.map((attendee) => ({
//                 name: attendee.emailAddress?.name,
//                 email: attendee.emailAddress?.address,
//                 response: attendee.status?.response,
//                 type: attendee.type,
//             })) || [],
//         location: event.location?.displayName || "No location",
//         link: event.onlineMeetingUrl,
//     },
// }));

const eventType = ref("regular");

// const clientId = "47f56431-555e-4b05-b1b3-c8e6e79e7f4d";
// const redirectUri = encodeURIComponent(
// 	"http://localhost:8000/auth/callbackAzure"
// );
// const scope =
// 	"offline_access Calendars.Read Calendars.ReadWrite Calendars.Read.Shared User.Read Mail.Read OnlineMeetings.Read OnlineMeetings.ReadWrite";

// const loginWithMicrosoft = () => {
// 	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query`;
// 	window.location.href = authUrl;
// 	loginWithMicrosoft.value = true;
// };
//test
const loginWithMicrosoft = () => {
	const config = useRuntimeConfig();

	// Get values from environment
	const clientId = config.public.AZURE_CLIENT_ID;
	const redirectUriRaw = config.public.AZURE_REDIRECT_URI;
	const scope = config.public.AZURE_SCOPE;

	console.log("Azure config:", {
		clientId,
		redirectUriRaw,
		scope,
	});

	// Encode the redirect URI just like in the original working version
	const redirectUri = encodeURIComponent(redirectUriRaw);

	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
		scope
	)}&response_mode=query`;
	window.location.href = authUrl;
};

const createMicrosoftEvent = ref(false);
const selectedDate = ref("");

const toggleCreateMicrosoftEvent = () => {
	createMicrosoftEvent.value = !createMicrosoftEvent.value;
};

const handleMicrosoftEventCreated = (newEvent) => {
	// Refresh Microsoft events to show the new one
	fetchMicrosoftEvents();
	// Or manually add it to the events array if you prefer
};

const deleteMicrosoftEvent = async (eventId) => {
	if (!eventId) {
		console.error("No event ID provided for deletion");
		return;
	}

	loadingStateCalendar.value = true;
	try {
		// Confirm deletion with the user
		if (!confirm("Are you sure you want to delete this Microsoft event?")) {
			loadingStateCalendar.value = false;
			return;
		}

		const response = await axios.delete(
			`${config.public.apiUrl}events/${eventId}`,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.status === 200) {
			// Remove the event from the local events array
			events.value = events.value.filter((event) => event.id !== eventId);

			// Update calendar options to refresh the view
			calendarOptions.value = {
				...calendarOptions.value,
				events: events.value,
			};

			// Close the Microsoft event detail modal if open
			if (showMicrosoftEvents.value) {
				toggleMicrosoftEvents();
			}

			// Show success notification
			alert("Microsoft event deleted successfully");
		}
	} catch (error) {
		console.error("Error deleting Microsoft event:", error);
		alert("Failed to delete Microsoft event. Please try again.");
	} finally {
		loadingStateCalendar.value = false;
	}
};

const isLoggedInWithMicrosoft = ref(false);

const checkAuth = async () => {
	try {
		const response = await this.$axios.get("/api/check-auth");
		if (response.data.authenticated) {
			// User is authenticated
		} else {
			// Redirect to login
			this.loginWithMicrosoft();
		}
	} catch (error) {
		// Handle error or redirect to login
		this.loginWithMicrosoft();
	}
};
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
			@deleteMicrosoftEvent="deleteMicrosoftEvent"
		/>

		<MicrosoftEventComponent
			v-if="createMicrosoftEvent"
			:selectedDate="selectedDate"
			@close="toggleCreateMicrosoftEvent"
			@eventCreated="handleMicrosoftEventCreated"
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
				<div class="shadow pb-4 rounded-b-lg">
					<CalendarSharing
						class="mt-4"
						@deleteSharedEventsId="deleteSharedEventsId"
						@addSharedEventsId="addSharedEventsId"
					/>
				</div>
				<div class="flex flex-col items-center py-6 shadow-lg rounded-b-lg">
					<div
						@click="fetchMicrosoftEvents"
						class="flex items-center gap-2 mt-4 bg-purple-600 rounded-md hover:bg-purple-700 cursor-pointer w-[240px] px-2 py-1 shadow"
					>
						<div class="flex items-center pl-4 gap-2 text-white">
							{{
								areMicrosofEventsShown
									? "Skryť Microsoft kalendár"
									: "Zobraziť Microsoft kalendár"
							}}
							<img src="/public/icons8-microsoft-48.png" alt="" />
						</div>
					</div>
					<button
						v-if="!isLoggedInWithMicrosoft"
						class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
						@click="loginWithMicrosoft"
					>
						<span>Prihlásiť pomocou Microsoft</span>
						<img src="/public/icons8-microsoft-48.png" alt="logo" />
					</button>
					<button
						class="bg-red-800 px-4 rounded-md shadow hover:bg-red-700 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
						@click="toggleCreateMicrosoftEvent"
					>
						<span class="text-white">Vytvoriť outlook event</span>
						<img src="/public/icons8-microsoft-48.png" alt="logo" />
					</button>
				</div>
			</div>
			<div class="demo-app-main bg-white text-black">
				<!-- <CalendarSharing class="absolute left-5" /> -->
				<!-- <FullCalendar class="demo-app-calendar" :options="calendarOptions">
					<template v-slot:eventContent="arg">
						<b>{{ arg.timeText }}</b>
						<i>{{ arg.event.title }}</i>
					</template>
				</FullCalendar> -->
				<FullCalendar class="demo-app-calendar" :options="calendarOptions">
					<template v-slot:eventContent="arg">
						<div class="event-content-wrapper">
							<div class="event-time">
								<b>{{ arg.timeText }}</b>
							</div>
							<div class="event-title">{{ arg.event.title }}</div>
							<!-- Display location for Microsoft events -->
							<div class="">
								<div>Adam Adam</div>
							</div>

							<!-- Display event type indicator -->
							<!-- <div class="event-type">
								<small v-if="arg.event.extendedProps.source === 'microsoft'"
									>📅 Microsoft</small
								>
								<small v-else>🗓️ Local</small>
							</div> -->
						</div>
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

.event-content-wrapper {
	overflow: hidden;
	display: flex;
	flex-direction: column;
	min-height: 100%;
	width: 100%;
}

.event-time {
	font-weight: bold;
	margin-bottom: 2px;
}

.event-title {
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-location {
	font-size: 0.8em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-type {
	font-size: 0.8em;
	margin-top: 2px;
}

/* Make the event boxes larger to fit more content */
.fc-timegrid-event-harness {
	margin-right: 1px;
}

.fc-timegrid-event {
	min-height: 60px !important;
}
</style>
