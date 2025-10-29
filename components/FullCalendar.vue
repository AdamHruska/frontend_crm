<script setup>
const end_date = ref("");
const emit = defineEmits(["deleteSharedEventsId"]);
import eventBus from "@/eventBus";
import { useCalendarstore } from "#imports";
const calendarStore = useCalendarstore();
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useContactsStore } from "#imports";
const contactsStore = useContactsStore();

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
import { useToast } from "vue-toastification";
const toast = useToast();
const rawData = ref([]);

const addActivity = ref(false);
const updateActivity = ref(false);
const activityID = ref("");
const showMicrosoftEvents = ref(false);

const calendarRef = ref(null);

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

const currentLoadedMonth = ref(null);
const currentLoadedYear = ref(null);

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
	dayMaxEvents: 1,
	weekends: true,
	select: handleDateSelect,
	eventClick: handleEventClick,
	eventsSet: handleEvents,
	eventDrop: handleEventDrop,
	eventResize: handleEventResize,
	slotDuration: "00:30:00",
	allDaySlot: true, // This is already set correctly
	allDayText: "Celý deň", // Slovak for "All Day"
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
		// Extract the current view's start date
		const currentDate = dateInfo.view.currentStart;

		// Get the month (0-11) and year
		const month = currentDate.getMonth() + 1;
		const year = currentDate.getFullYear();

		// Check if this is a new month or year
		if (
			month !== currentLoadedMonth.value + 2 ||
			year !== currentLoadedYear.value
		) {
			// Call fetchMicrosoftEvents function with current month and year
			fetchMicrosoftEvents(month, year);

			// Update the current loaded month and year
			currentLoadedMonth.value = month;
			currentLoadedYear.value = year;
		}
	},
	// Add this event render function to verify all-day events are being processed correctly
	eventDidMount: (info) => {
		// You could also visually mark all-day events differently if needed
		if (info.event.allDay) {
			info.el.style.fontWeight = "bold";
		}
	},
});

async function handleEventDrop(dropInfo) {
	const eventId = dropInfo.event.id;
	const newStart = dropInfo.event.start;
	const newEnd = dropInfo.event.end ?? newStart; // fallback if end is null

	// Check if this is a Microsoft event
	if (dropInfo.event.extendedProps.source === "microsoft") {
		try {
			await updateMicrosoftEvent(
				eventId,
				newStart.toISOString(),
				newEnd.toISOString(),
				dropInfo.event.title
			);
		} catch (error) {
			console.error("Failed to update Microsoft event:", error);
			alert("Failed to update Microsoft event.");
			dropInfo.revert(); // revert UI
		}
		return;
	}

	// Check if user has permission to edit this event
	const event = rawData.value.find((event) => event.id == eventId);
	if (event && event.created_id !== userStore.user.id) {
		alert("You don't have permission to edit this event.");
		dropInfo.revert();
		return;
	}

	// Format for backend
	const formattedStart = formatDateForBackend(newStart);
	const formattedEnd = formatDateForBackend(newEnd);

	try {
		await updateEventInBackend(eventId, formattedStart, formattedEnd);
	} catch (error) {
		console.error("Failed to update local event:", error);
		alert("Failed to update event. Please try again.");
		dropInfo.revert(); // revert UI
	}
}

async function updateEventInBackend(eventId, formattedStart, formattedEnd) {
	const calendarStore = useCalendarstore();
	const authStore = useAuthStore();
	const config = useRuntimeConfig();

	const updatedEvent = {
		id: eventId,
		datumCas: formattedStart,
		koniec: formattedEnd,
	};

	console.log("Updating event in backend:", updatedEvent);

	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activities/${eventId}`,
			updatedEvent,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		console.log("Backend update response:", response.data);
		if (response.data.status !== 200) {
			toast.error("Failed to update event: ");
		} else {
			toast.success("Event updated successfully");
			// Update the local data
			const updatedEvent = response.data.activity;

			// Update in rawData
			rawData.value = rawData.value.map((event) =>
				event.id == eventId ? updatedEvent : event
			);

			// No need to update events.value as FullCalendar already updated the UI
		}
		return response.data;
	} catch (error) {
		console.error("Error updating event in backend:", error);
		throw error;
	}
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

const calendarList = ref([]);
const calendarListLoading = ref(false);

onMounted(async () => {
	// if (calendarStore.activities.length === 0) {
	// 	await calendarStore.fetchActivities();
	// }

	// if (contactsStore.contacts.data.length === 0) {
	// 	await contactsStore.fetchContacts();
	// }

	// if (!calendarStore.activities.length) {
	// 	await calendarStore.fetchActivities();
	// }
	await userStore.userGetCalendarNames();
	try {
		calendarListLoading.value = true;
		// Fetch tokens from the backend
		const response = await axios.get(
			`${config.public.apiUrl}microsoft/calendars`,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);
		calendarList.value = response.data.calendars;
		console.log("skuska list name", response.data.calendars);
	} catch (error) {
		console.error("Error during Microsoft login callback:", error);
	} finally {
		calendarListLoading.value = false;
	}

	await Promise.all([
		calendarStore.activities.length === 0
			? calendarStore.fetchActivities()
			: Promise.resolve(),
		contactsStore.contacts.data.length === 0
			? contactsStore.fetchContacts()
			: Promise.resolve(),
	]);

	rawData.value = calendarStore.activities;
	events.value = transformData(rawData.value);
	calendarOptions.value.events = events.value;

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
	// rawData.value = calendarStore.activities;
	// events.value = transformData(rawData.value);
	// const sharedACT = transformData(
	// 	flattenActivities(calendarStore.shared_activities)
	// );
	// events.value = [...events.value, ...sharedACT];

	// calendarOptions.value.events = events.value;

	// Fetch user activities first (fast)
	//await userStore.fetchUser();
	//await calendarStore.fetchUserActivities();
	rawData.value = calendarStore.activities;
	events.value = transformData(rawData.value);
	calendarOptions.value.events = events.value;

	// Fire shared activities in background (don’t block initial render)
	if (calendarStore.shared_activities.length === 0) {
		await calendarStore.fetchSharedActivities();
	}

	const sharedACT = transformData(
		flattenActivities(calendarStore.shared_activities)
	);
	events.value = [...events.value, ...sharedACT];
	calendarOptions.value.events = events.value;

	// calendarStore.fetchSharedActivities().then(() => {
	// 	const sharedACT = transformData(
	// 		flattenActivities(calendarStore.shared_activities)
	// 	);
	// 	events.value = [...events.value, ...sharedACT];
	// 	calendarOptions.value = {
	// 		...calendarOptions.value,
	// 		events: events.value,
	// 	};
	// });

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

// const transformData = (data) => {
// 	return data.map((item) => {
// 		var farba = "";
// 		const formattedStart = item.datumCas.replace(" ", "T");
// 		if (item.created_id == userStore.user.id) {
// 			farba = "rgb(37 99 235)";
// 		} else {
// 			farba = "red";
// 		}

// 		return {
// 			id: item.id,
// 			title: item.aktivita,
// 			start: formattedStart,
// 			end: item.koniec,
// 			backgroundColor: farba,
// 			borderColor: farba,
// 			user_id: item.created_id,
// 			extendedProps: {
// 				contact_id: item.contact_id,
// 			},
// 		};
// 	});
// };

const transformData = (data) => {
	return data.map((item) => {
		//console.log("Transforming item:", item); // Debug log
		var farba = item.created_id == userStore.user.id ? "rgb(37 99 235)" : "red";

		if (item.activity_status === "discarded") {
			farba = "gray";
		}

		const formattedStart = item.datumCas.replace(" ", "T");

		//Get contact info - use optional chaining for safety
		const contact = item.contact_id
			? contactsStore.contacts.data?.find((c) => c.id === item.contact_id)
			: null;

		return {
			id: item.id,
			title: item.aktivita,
			start: formattedStart,
			end: item.koniec,
			backgroundColor: farba,
			borderColor: farba,
			user_id: item.created_id,
			extendedProps: {
				contact_id: item.contact_id || null,
				firstName: contact?.meno || "",
				lastName: contact?.priezvisko || "",
			},
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
		console.log("tuto", clickInfo);
		selectedMicrosoftEvent.value = {
			id: clickInfo.event.id,
			title: clickInfo.event.title,
			start: clickInfo.event.start,
			end: clickInfo.event.end,
			location:
				clickInfo.event.extendedProps.location || "Nebola zadaná lokalita",
			link: clickInfo.event.extendedProps.link || "",
			organizer: clickInfo.event.extendedProps.organizer,
			attendees: clickInfo.event.extendedProps.attendees,
		};
		console.log(selectedMicrosoftEvent.value);
		toggleMicrosoftEvents();
	} else {
		toggleUpdateActivity();
	}
}

const toggleMicrosoftEvents = () => {
	showMicrosoftEvents.value = !showMicrosoftEvents.value;
};

function handleEvents(events) {
	currentEvents.value = events;
	console.log("Current events:", currentEvents.value);
}

const flattenActivities = (activitiesObject) => {
	// Use `Object.values` to get arrays of activities and `flat()` to merge them
	return Object.values(activitiesObject).flat();
};

const deleteSharedEventsId = (userId) => {
	console.log("test delete eventov sa vykonal");
	events.value = events.value.filter((event) => event.user_id !== userId);
	// Update the calendar options to reflect the changes
	// calendarOptions.value = { ...calendarOptions.value, events: events.value };
	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};
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

// const recentEvents = computed(() => {
// 	const now = new Date();
// 	const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
// 	const endOfDay = new Date(now);
// 	endOfDay.setHours(23, 59, 59, 999); // Set to the end of the current day

// 	return currentEvents.value.filter((event) => {
// 		const eventStart = new Date(event.start);
// 		return eventStart >= twoHoursAgo && eventStart <= endOfDay;
// 	});
// });

const recentEvents = computed(() => {
	const now = new Date();
	const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
	const endOfDay = new Date(now);
	endOfDay.setHours(23, 59, 59, 999); // Set to the end of the current day

	return currentEvents.value
		.filter((event) => {
			const eventStart = new Date(event.start);
			return eventStart >= twoHoursAgo && eventStart <= endOfDay;
		})
		.sort((a, b) => {
			// Sort by start time in ascending order
			return new Date(a.start) - new Date(b.start);
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
		// calendarOptions.value = {
		// 	...calendarOptions.value,
		// 	events: events.value,
		// };

		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
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
		// calendarOptions.value = {
		// 	...calendarOptions.value,
		// 	events: events.value,
		// };

		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
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
	// const transformedEvent = {
	// 	id: newEvent.id,
	// 	title: newEvent.aktivita,
	// 	start: newEvent.datumCas.replace(" ", "T"),
	// 	end: newEvent.koniec,
	// 	backgroundColor:
	// 		newEvent.created_id === userStore.user.id ? "rgb(37 99 235)" : "red",
	// 	borderColor:
	// 		newEvent.created_id === userStore.user.id ? "rgb(37 99 235)" : "red",
	// 	user_id: newEvent.created_id,
	// };

	const [transformedEvent] = transformData([newEvent]);

	// Add the new event to the events array
	events.value = [...events.value, transformedEvent];

	// Update calendar options to refresh the view
	// calendarOptions.value = {
	// 	...calendarOptions.value,
	// 	events: events.value,
	// };

	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
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

async function fetchMicrosoftEvents(month, year) {
	loadingStateCalendar.value = true;

	// First ensure local events are loaded
	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
		rawData.value = calendarStore.activities;
		events.value = transformData(rawData.value);
	}

	// Then get Microsoft events
	const newEvents = await calendarStore.fetchMicrosoftEvents(month, year);

	// Process events to prevent duplicates
	const existingEventIds = new Set(events.value.map((event) => event.id));
	const uniqueNewEvents = newEvents.filter(
		(event) => !existingEventIds.has(event.id)
	);

	// Merge events while preserving existing ones
	events.value = [...events.value, ...uniqueNewEvents];

	// calendarOptions.value = { ...calendarOptions.value, events: events.value };

	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};

	loadingStateCalendar.value = false;
	return uniqueNewEvents;
}

const eventType = ref("regular");

// const loginWithMicrosoft = () => {
// 	const config = useRuntimeConfig();

// 	// Get values from environment
// 	const clientId = config.public.AZURE_CLIENT_ID;
// 	const redirectUriRaw = config.public.AZURE_REDIRECT_URI;
// 	const scope = config.public.AZURE_SCOPE;

// 	console.log("Azure config:", {
// 		clientId,
// 		redirectUriRaw,
// 		scope,
// 	});

// 	// Encode the redirect URI just like in the original working version
// 	const redirectUri = encodeURIComponent(redirectUriRaw);

// 	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
// 		scope
// 	)}&response_mode=query`;
// 	window.location.href = authUrl;
// };

const loginWithMicrosoft = () => {
	const config = useRuntimeConfig();
	const authStore = useAuthStore(); // or however you access current user

	// Get values from environment
	const clientId = config.public.AZURE_CLIENT_ID;
	const redirectUriRaw = config.public.AZURE_REDIRECT_URI;
	const scope = config.public.AZURE_SCOPE;

	// Get current user ID (assuming you have this in your auth store)
	const userId = userStore.user.id;

	if (!userId) {
		console.error("No user logged in");
		return;
	}

	// Create state object with user ID
	const state = JSON.stringify({
		userId: userId,
		// Optional: add a CSRF token if you want extra security
		csrf: authStore.csrfToken,
	});

	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
		redirectUriRaw
	)}&scope=${encodeURIComponent(
		scope
	)}&response_mode=query&state=${encodeURIComponent(state)}`;

	window.location.href = authUrl;
};

const logoutWithMicrosoft = async () => {
	try {
		const response = await axios.post(
			`${config.public.apiUrl}microsoft/logout`,
			{}, // empty body
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		console.log(response.data.message);
		toast.success("Successfully logged out from Microsoft");
		return response.data;
	} catch (error) {
		console.error("Microsoft logout failed:", error);
		throw error;
	}
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
			// calendarOptions.value = {
			// 	...calendarOptions.value,
			// 	events: events.value,
			// };

			calendarOptions.value = {
				...calendarOptions.value,
				events: [...events.value],
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

		<!-- <loadigcomponent v-if="loadingStateCalendar" /> -->
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
							Zobraziť víkendy
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
					<!-- <div
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
					</div> -->
					<button
						v-if="!isLoggedInWithMicrosoft"
						class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
						@click="loginWithMicrosoft"
					>
						<span>Prihlásiť pomocou Microsoft</span>
						<img src="/public/icons8-microsoft-48.png" alt="logo" />
					</button>
					<button
						class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
						@click="logoutWithMicrosoft"
					>
						<span>Odhlásiť sa z Microsoft účtu</span>
						<img src="/public/icons8-microsoft-48.png" alt="logo" />
					</button>
					<div
						class="bg-[#D1D5DB] px-2 py-2 rounded-md shadow flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3 flex flex-col text-center"
					>
						<h3 class="font-semibold">Microsoft Kalendáre</h3>
						<div
							v-if="!calendarListLoading"
							v-for="calendar in calendarList"
							:key="calendar.id"
							@click="
								userStore.userAddCalendarName(
									calendar.name,
									currentLoadedMonth,
									currentLoadedYear
								)
							"
							class="w-full rounded-md py-1 cursor-pointer transition-colors"
							:class="[
								'p-2 rounded cursor-pointer',
								Array.isArray(userStore.selected_calendar_names) &&
								userStore.selected_calendar_names.includes(calendar.name)
									? 'bg-green-500 text-white hover:bg-green-400'
									: 'bg-gray-200 hover:bg-slate-100',
							]"
						>
							{{ calendar.name }}
						</div>
						<div v-if="calendarListLoading" class="mt-3 font-bold text-base">
							Načitavanie kalendárov...
						</div>
					</div>
					<!-- <button
						class="bg-red-800 px-4 rounded-md shadow hover:bg-red-700 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
						@click="toggleCreateMicrosoftEvent"
					>
						<span class="text-white">Vytvoriť outlook event</span>
						<img src="/public/icons8-microsoft-48.png" alt="logo" />
					</button> -->
				</div>
			</div>
			<div
				class="absolute top-5 left-1/2 z-50"
				v-if="calendarStore.microsoftLoadingState"
			>
				<div class="relative flex items-center gap-4">
					<div class="spinner -translate-x-10">
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>
					<div class="">Načítava si microsoft kalendár...</div>
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

				<FullCalendar
					ref="calendarRef"
					class="demo-app-calendar"
					:options="calendarOptions"
				>
					<template v-slot:eventContent="arg">
						<div class="event-content-wrapper">
							<div class="event-time">
								<b>{{ arg.timeText }}</b>
							</div>
							<div class="event-title">{{ arg.event.title }}</div>
							<!-- Display location for Microsoft events -->
							<div class="">
								<div>
									{{ arg.event.extendedProps.firstName }}
									{{ arg.event.extendedProps.lastName }}
								</div>
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
	width: 100%;
}

.demo-app-sidebar {
	width: 300px;
	line-height: 1.5;
	background: #eaf9ff;
	border-right: 1px solid #d3e2e8;
	flex-shrink: 0;
}

.demo-app-sidebar-section {
	padding: 1em;
}

.demo-app-main {
	flex-grow: 1;
	padding: 3em;
	width: calc(100% - 300px); /* Calculate remaining width */
	display: flex; /* Enable flexbox for this container */
	justify-content: center; /* Center horizontally */
}

.fc {
	max-width: none;
	width: 100%; /* Take full width of parent */
	margin: 0;
}

.demo-app-calendar {
	width: 100%;
}

.fc-view-harness {
	width: 100% !important;
}

.special-component {
	background: linear-gradient(135deg, #ffdee9, #b5fffc);
	color: #1a202c;
	padding: 1rem;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.fc-button {
	background-color: #909090 !important;
	color: black !important;
	border: none !important;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.fc-button:hover {
	background-color: #505050 !important;
	color: black !important;
}

.fc-button-active {
	background-color: rgb(37 99 235) !important;
	color: black !important;
}

/*
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


.fc-timegrid-event-harness {
	margin-right: 1px;
}

.fc-timegrid-event {
	min-height: 100% !important;
}
*/

.spinner {
	position: absolute;
	width: 9px;
	height: 9px;
}

.spinner div {
	position: absolute;
	width: 50%;
	height: 150%;
	background: #000000;
	transform: rotate(calc(var(--rotation) * 1deg))
		translate(0, calc(var(--translation) * 1%));
	animation: spinner-fzua35 1s calc(var(--delay) * 1s) infinite ease;
}

.spinner div:nth-child(1) {
	--delay: 0.1;
	--rotation: 36;
	--translation: 150;
}

.spinner div:nth-child(2) {
	--delay: 0.2;
	--rotation: 72;
	--translation: 150;
}

.spinner div:nth-child(3) {
	--delay: 0.3;
	--rotation: 108;
	--translation: 150;
}

.spinner div:nth-child(4) {
	--delay: 0.4;
	--rotation: 144;
	--translation: 150;
}

.spinner div:nth-child(5) {
	--delay: 0.5;
	--rotation: 180;
	--translation: 150;
}

.spinner div:nth-child(6) {
	--delay: 0.6;
	--rotation: 216;
	--translation: 150;
}

.spinner div:nth-child(7) {
	--delay: 0.7;
	--rotation: 252;
	--translation: 150;
}

.spinner div:nth-child(8) {
	--delay: 0.8;
	--rotation: 288;
	--translation: 150;
}

.spinner div:nth-child(9) {
	--delay: 0.9;
	--rotation: 324;
	--translation: 150;
}

.spinner div:nth-child(10) {
	--delay: 1;
	--rotation: 360;
	--translation: 150;
}

@keyframes spinner-fzua35 {
	0%,
	10%,
	20%,
	30%,
	50%,
	60%,
	70%,
	80%,
	90%,
	100% {
		transform: rotate(calc(var(--rotation) * 1deg))
			translate(0, calc(var(--translation) * 1%));
	}

	50% {
		transform: rotate(calc(var(--rotation) * 1deg))
			translate(0, calc(var(--translation) * 1.5%));
	}
}
</style>
