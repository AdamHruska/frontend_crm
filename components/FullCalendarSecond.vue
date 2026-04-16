// Collapsible menu state const showEventMenu = ref(false);
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

const pastelColors = [
	"#FFB3BA",
	"#FFDFBA",
	"#FFFFBA",
	"#BAFFC9",
	"#FFD7BA",
	"#FFB3E6",
	"#C9FFE5",
	"#FFE4BA",
	"#FFCCE5",
	"#D4F0C9",
	"#FFC6D9",
	"#FFEAA7",
];

const showEventMenu = ref(false);
// Mobile sidebar state
const sidebarOpen = ref(false);

const toggleUpdateActivity = () => {
	if (updateActivity.value === true) {
	}
	updateActivity.value = !updateActivity.value;
};

const toggleAddActivity = () => {
	addActivity.value = !addActivity.value;
};

const events = ref([]);

const currentLoadedMonth = ref(null);
const currentLoadedYear = ref(null);

async function fetchAndMergeAllEvents(month, year) {
	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}
	rawData.value = calendarStore.activities;
	const localEvents = transformData(rawData.value);
	const sharedEvents = transformData(
		flattenActivities(calendarStore.shared_activities),
	);

	const [googleEvents, microsoftEvents] = await Promise.all([
		calendarStore.fetchGoogleEvents(month, year),
		showMicrosoftEventsOnCalendar.value
			? calendarStore.fetchMicrosoftEvents(month, year)
			: Promise.resolve([]),
	]);

	events.value = [
		...localEvents,
		...sharedEvents,
		...googleEvents,
		...microsoftEvents,
	];

	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};
}

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
	datesSet: async (dateInfo) => {
		const currentDate = dateInfo.view.currentStart;
		const month = currentDate.getMonth() + 1;
		const year = currentDate.getFullYear();

		if (
			month !== currentLoadedMonth.value ||
			year !== currentLoadedYear.value
		) {
			await fetchAndMergeAllEvents(month, year);
			currentLoadedMonth.value = month;
			currentLoadedYear.value = year;
		}
	},
	eventDidMount: (info) => {
		if (info.event.allDay) {
			info.el.style.fontWeight = "bold";
		}
	},
});

async function handleEventDrop(dropInfo) {
	const officeStore = useOfficeStore();
	const eventId = dropInfo.event.id;
	const newStart = dropInfo.event.start;
	const newEnd = dropInfo.event.end ?? newStart;

	if (dropInfo.event.extendedProps.source === "microsoft") {
		try {
			await updateMicrosoftEvent(
				eventId,
				newStart.toISOString(),
				newEnd.toISOString(),
				dropInfo.event.title,
			);
		} catch (error) {
			console.error("Failed to update Microsoft event:", error);
			alert("Failed to update Microsoft event.");
			dropInfo.revert();
		}
		return;
	}

	const event = rawData.value.find((event) => event.id == eventId);
	if (event && event.created_id !== userStore.user.id) {
		alert("You don't have permission to edit this event.");
		dropInfo.revert();
		return;
	}

	if (event) {
		try {
			const oldStart = new Date(event.datumCas);
			oldStart.setHours(oldStart.getHours() - 1);
			const oldEnd = new Date(event.koniec);
			oldEnd.setHours(oldEnd.getHours() - 1);

			const officeActivityResult = await officeStore.findActivityId({
				datum_cas: formatDateForBackend(oldStart),
				koniec: formatDateForBackend(oldEnd),
				owner_id: userStore.user.id,
			});
			if (officeActivityResult && officeActivityResult.activity) {
				const officeActivity = officeActivityResult.activity;
				const updatePayload = {
					id: officeActivity.id,
					aktivita: dropInfo.event.title,
					datum_cas: formatDateForBackend(newStart),
					koniec: formatDateForBackend(newEnd),
					poznamka: officeActivity.poznamka || "",
					office_id: officeActivity.office_id,
					owner_number: userStore.user.vizitka_phone_num,
				};
				await officeStore.updateActivity(updatePayload);
			}
		} catch (err) {
			console.error("Failed to update office activity:", err);
		}
	}

	const formattedStart = formatDateForBackend(newStart);
	const formattedEnd = formatDateForBackend(newEnd);

	try {
		await updateEventInBackend(eventId, formattedStart, formattedEnd);
	} catch (error) {
		console.error("Failed to update local event:", error);
		alert("Failed to update event. Please try again.");
		dropInfo.revert();
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

	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activities/${eventId}`,
			updatedEvent,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (response.data.status !== 200) {
			toast.error("Failed to update event: ");
		} else {
			toast.success("Event updated successfully");
			const updatedEvent = response.data.activity;
			rawData.value = rawData.value.map((event) =>
				event.id == eventId ? updatedEvent : event,
			);
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

	if (resizeInfo.event.extendedProps.source === "microsoft") {
		updateMicrosoftEvent(
			eventId,
			resizeInfo.event.start,
			newEnd,
			resizeInfo.event.title,
		);
		return;
	}

	const event = rawData.value.find((event) => event.id == eventId);
	if (event && event.created_id !== userStore.user.id) {
		alert("You don't have permission to edit this event.");
		resizeInfo.revert();
		return;
	}

	const formattedEnd = formatDateForBackend(newEnd);
	updateEventEndInBackend(eventId, formattedEnd);
}

function formatDateForBackend(date) {
	return format(date, "yyyy-MM-dd HH:mm:ss");
}

async function updateEventEndInBackend(eventId, newEnd) {
	loadingStateCalendar.value = true;

	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activity-end/${eventId}`,
			{ koniec: newEnd },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (response.data.status === "success") {
			const updatedEvent = response.data.activity;
			rawData.value = rawData.value.map((event) =>
				event.id == eventId ? updatedEvent : event,
			);
			calendarStore.activities = calendarStore.activities.map((event) =>
				event.id == eventId ? updatedEvent : event,
			);
			toast.success("Event end time updated successfully");
		} else {
			toast.error("Failed to update event: " + response.data.message);
			calendarOptions.value.events = [...events.value];
		}
	} catch (error) {
		console.error("Error updating event:", error);
		toast.error(
			"An error occurred while updating the event. Please try again.",
		);
		calendarOptions.value.events = [...events.value];
	} finally {
		loadingStateCalendar.value = false;
	}
}

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
			},
		);

		if (response.status !== 200) {
			alert("Failed to update Microsoft event");
			calendarOptions.value.events = [...events.value];
		}
	} catch (error) {
		console.error("Error updating Microsoft event:", error);
		alert(
			"An error occurred while updating the Microsoft event. Please try again.",
		);
		calendarOptions.value.events = [...events.value];
	} finally {
		loadingStateCalendar.value = false;
	}
}

const calendarList = ref([]);
const calendarListLoading = ref(false);

onMounted(async () => {
	await userStore.userGetCalendarNames();
	try {
		calendarListLoading.value = true;
		const response = await axios.get(
			`${config.public.apiUrl}microsoft/calendars`,
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		calendarList.value = response.data.calendars;
	} catch (error) {
		console.error("Error during Microsoft login callback:", error);
	} finally {
		calendarListLoading.value = false;
	}

	await Promise.all([
		contactsStore.contacts.data.length === 0
			? contactsStore.fetchContacts()
			: Promise.resolve(),
		calendarStore.shared_activities.length === 0
			? calendarStore.fetchSharedActivities()
			: Promise.resolve(),
	]);

	const now = new Date();
	await fetchAndMergeAllEvents(now.getMonth() + 1, now.getFullYear());
	currentLoadedMonth.value = now.getMonth() + 1;
	currentLoadedYear.value = now.getFullYear();

	if (calendarRef.value) {
		setTimeout(() => {
			calendarRef.value.getApi().refetchEvents();
		}, 100);
	}

	eventBus.on("deleteSharedEvents", ({ userId }) => {
		events.value = events.value.filter((event) => event.user_id !== userId);
		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
		};
	});

	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get("code");

	if (code) {
		try {
			const response = await axios.post(
				`${config.public.apiUrl}auth/callback`,
				{ code },
			);
			const { access_token, refresh_token } = response.data;
			const rememberMe = sessionStorage.getItem("rememberMe") === "true";
			if (rememberMe) {
				localStorage.setItem("microsoft_access_token", access_token);
				localStorage.setItem("microsoft_refresh_token", refresh_token);
			} else {
				sessionStorage.setItem("microsoft_access_token", access_token);
				sessionStorage.setItem("microsoft_refresh_token", refresh_token);
			}
			sessionStorage.removeItem("rememberMe");
			window.location.href = "/calendar";
		} catch (error) {
			console.error("Error during Microsoft login callback:", error);
		}
	}

	const googleStatus = urlParams.get("google");
	if (googleStatus === "success") {
		toast.success("Prihlásenie cez Google úspešné!");
		window.history.replaceState({}, document.title, "/calendar");
	} else if (googleStatus === "error") {
		const reason = urlParams.get("reason");
		toast.error(`Prihlásenie cez Google zlyhalo: ${reason}`);
		window.history.replaceState({}, document.title, "/calendar");
	}
});

onUnmounted(() => {
	eventBus.off("deleteSharedEvents");
});

const toDisabledColor = (color, factor = 0.5) => {
	if (color.startsWith("rgb")) {
		const nums = color.match(/\d+/g).map(Number);
		const avg = (nums[0] + nums[1] + nums[2]) / 3;
		const r = Math.round(nums[0] + (avg - nums[0]) * factor);
		const g = Math.round(nums[1] + (avg - nums[1]) * factor);
		const b = Math.round(nums[2] + (avg - nums[2]) * factor);
		return `rgb(${r}, ${g}, ${b})`;
	}
	if (color.startsWith("#")) {
		const bigint = parseInt(color.slice(1), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		const avg = (r + g + b) / 3;
		return `rgb(${Math.round(r + (avg - r) * factor)},${Math.round(g + (avg - g) * factor)},${Math.round(b + (avg - b) * factor)})`;
	}
	return color;
};

const transformData = (data) => {
	return data.map((item) => {
		let farba;
		if (item.created_id === userStore.user.id) {
			farba = "rgb(37 99 235)";
		} else {
			if (!calendarStore.userColors[item.created_id]) {
				const userIds = Object.keys(calendarStore.userColors).length;
				calendarStore.userColors[item.created_id] =
					pastelColors[userIds % pastelColors.length];
			}
			farba = calendarStore.userColors[item.created_id];
		}
		if (item.activity_status === "discarded") {
			farba = toDisabledColor(farba, 0.6);
		}
		const formattedStart = item.datumCas.replace(" ", "T");
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
				isDiscarded: item.activity_status === "discarded",
			},
		};
	});
};

let eventGuid = 0;
const currentEvents = ref([]);

const handleWeekendsToggle = () => {
	calendarOptions.value.weekends = !calendarOptions.value.weekends;
};

const selectedMicrosoftEvent = ref(null);

function handleEventClick(clickInfo) {
	activityID.value = clickInfo.event._def.publicId;
	eventType.value =
		clickInfo.event.extendedProps.source === "microsoft"
			? "microsoft"
			: clickInfo.event.extendedProps.source === "google"
				? "google"
				: "regular";

	if (eventType.value === "microsoft") {
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
			allDay: clickInfo.event.allDay,
			note: clickInfo.event.extendedProps.note || "Žiadna poznámka",
			importance: clickInfo.event.extendedProps.importance || "normal",
		};
		toggleMicrosoftEvents();
	} else if (eventType.value === "google") {
		selectedMicrosoftEvent.value = {
			id: clickInfo.event.id,
			title: clickInfo.event.title,
			start: clickInfo.event.start,
			end: clickInfo.event.end,
			note: clickInfo.event.extendedProps.description || "Žiadna poznámka",
			organizer: clickInfo.event.extendedProps.organizer || null,
			attendees: clickInfo.event.extendedProps.attendees || [],
			calendar: clickInfo.event.extendedProps.calendar || "",
		};
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
}

const flattenActivities = (activitiesObject) => {
	return Object.values(activitiesObject).flat();
};

const deleteSharedEventsId = (userId) => {
	events.value = events.value.filter((event) => event.user_id !== userId);
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
			(id) => String(id) === userIdString,
		)
	) {
		try {
			const response = await axios.get(
				`${config.public.apiUrl}get-activities-by-creator/${userId}`,
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (response && response.data && response.data.activities) {
				const sharedEvents = transformData(
					flattenActivities(response.data.activities),
				);
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
	}

	loadingStateCalendar.value = false;
};

const recentEvents = computed(() => {
	const now = new Date();
	const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
	const endOfDay = new Date(now);
	endOfDay.setHours(23, 59, 59, 999);

	return currentEvents.value
		.filter((event) => {
			const eventStart = new Date(event.start);
			return eventStart >= twoHoursAgo && eventStart <= endOfDay;
		})
		.sort((a, b) => new Date(a.start) - new Date(b.start));
});

const formatDate = (dateString) => {
	const date = new Date(dateString);
	return format(date, "dd.MM.yyyy HH:mm");
};

const displayUpdateEvent = (event) => {
	toggleUpdateActivity();
	activityID.value = event.id;
};

const alterEvents = (updatedEvent) => {
	if (updatedEvent === null) {
		events.value = events.value.filter((event) => event.id != activityID.value);
		rawData.value = rawData.value.filter(
			(event) => event.id !== activityID.value,
		);
		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
		};
		updateActivity.value = false;
		activityID.value = "";
	} else {
		rawData.value = rawData.value.map((event) =>
			event.id === updatedEvent.id ? updatedEvent : event,
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
			events: [...events.value],
		};
		updateActivity.value = false;
		activityID.value = "";
	}
};

const addNewEvent = (newEvent) => {
	rawData.value.push(newEvent);
	const [transformedEvent] = transformData([newEvent]);
	events.value = [...events.value, transformedEvent];
	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};
	addActivity.value = false;
	toggleAddActivity();
};

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

	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}
	rawData.value = calendarStore.activities;

	const sharedACT = transformData(
		flattenActivities(calendarStore.shared_activities),
	);
	const localEvents = [...transformData(rawData.value), ...sharedACT];

	const newMicrosoftEvents = await calendarStore.fetchMicrosoftEvents(
		month,
		year,
	);

	const existingGoogleEvents = events.value.filter(
		(event) => event.extendedProps?.source === "google",
	);

	events.value = [
		...localEvents,
		...existingGoogleEvents,
		...newMicrosoftEvents,
	];
	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};

	loadingStateCalendar.value = false;
	return newMicrosoftEvents;
}

async function fetchGoogleEventsForMonth(month, year) {
	const newGoogleEvents = await calendarStore.fetchGoogleEvents(month, year);
	const nonGoogleEvents = events.value.filter(
		(event) => event.extendedProps?.source !== "google",
	);
	events.value = [...nonGoogleEvents, ...newGoogleEvents];
	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};
}

const eventType = ref("regular");

const fetchGoogleEvents = async () => {
	try {
		const response = await axios.get(
			`${config.public.apiUrl}google/calendar/events`,
			{
				params: { userId: userStore.user.id },
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);

		const googleEvents = response.data.map((event) => ({
			id: event.id,
			title: event.summary?.trim() || "Bez názvu",
			start: event.start,
			end: event.end,
			backgroundColor: "#34A853",
			borderColor: "#34A853",
			extendedProps: {
				source: "google",
				description: event.description ?? null,
				calendar: event.calendar ?? null,
				organizer: event.organizer ?? event.creator ?? null,
				attendees: event.attendees ?? [],
				location: event.location ?? null,
			},
		}));

		const nonGoogleEvents = events.value.filter(
			(e) => e.extendedProps?.source !== "google",
		);
		events.value = [...nonGoogleEvents, ...googleEvents];
		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
		};
		toast.success(`Načítaných ${googleEvents.length} Google udalostí`);
	} catch (error) {
		console.error("Error fetching Google events:", error);
		toast.error("Nepodarilo sa načítať Google udalosti.");
	}
};

const loginWithGoogle = () => {
	const clientId = config.public.GOOGLE_CLIENT_ID;
	const redirectUri = config.public.GOOGLE_REDIRECT_URI;
	const scope = config.public.GOOGLE_SCOPE;
	const userId = userStore.user.id;

	if (!userId) {
		console.error("No user logged in");
		return;
	}

	const state = JSON.stringify({ userId, csrf: authStore.csrfToken });
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: redirectUri,
		scope,
		access_type: "offline",
		prompt: "consent",
		state,
	});

	window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

const logoutWithGoogle = async (userId) => {
	try {
		const response = await $fetch(`/api/google/logout?userId=${userId}`, {
			method: "POST",
		});
		if (response.success) {
			alert("Successfully logged out from Google.");
			window.location.href = "/calendar";
		} else {
			alert("Failed to log out from Google.");
		}
	} catch (error) {
		console.error(error);
		alert("An error occurred while logging out from Google.");
	}
};

const loginWithMicrosoft = () => {
	const config = useRuntimeConfig();
	const authStore = useAuthStore();
	const clientId = config.public.AZURE_CLIENT_ID;
	const redirectUriRaw = config.public.AZURE_REDIRECT_URI;
	const scope = config.public.AZURE_SCOPE;
	const userId = userStore.user.id;

	if (!userId) {
		console.error("No user logged in");
		return;
	}

	const state = JSON.stringify({ userId, csrf: authStore.csrfToken });
	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUriRaw)}&scope=${encodeURIComponent(scope)}&response_mode=query&state=${encodeURIComponent(state)}`;
	window.location.href = authUrl;
};

const logoutWithMicrosoft = async () => {
	try {
		const response = await axios.post(
			`${config.public.apiUrl}microsoft/logout`,
			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		toast.success("Successfully logged out from Microsoft");
		return response.data;
	} catch (error) {
		console.error("Microsoft logout failed:", error);
		throw error;
	} finally {
		location.reload();
	}
};

const createMicrosoftEvent = ref(false);
const selectedDate = ref("");

const toggleCreateMicrosoftEvent = () => {
	createMicrosoftEvent.value = !createMicrosoftEvent.value;
};

const handleMicrosoftEventCreated = (newEvent) => {
	fetchMicrosoftEvents();
};

const deleteMicrosoftEvent = async (eventId) => {
	if (!eventId) {
		console.error("No event ID provided for deletion");
		return;
	}

	loadingStateCalendar.value = true;
	try {
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
			},
		);

		if (response.status === 200) {
			events.value = events.value.filter((event) => event.id !== eventId);
			calendarOptions.value = {
				...calendarOptions.value,
				events: [...events.value],
			};
			if (showMicrosoftEvents.value) {
				toggleMicrosoftEvents();
			}
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
		} else {
			this.loginWithMicrosoft();
		}
	} catch (error) {
		this.loginWithMicrosoft();
	}
};

const toggleMyActivities = () => {
	const userId = useUserStore().user.id;

	if (!calendarStore.showOnlyMine) {
		calendarStore.originalEvents = [...events.value];
		events.value = calendarStore.originalEvents.filter(
			(event) => event.user_id !== userId,
		);
		toast.success("Boli skryté vaše aktivity.");
		calendarStore.showOnlyMine = true;
	} else {
		events.value = [...calendarStore.originalEvents];
		toast.success("Boli obnovené vaše aktivity.");
		calendarStore.showOnlyMine = false;
	}

	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};
};

const showMicrosoftEventsOnCalendar = ref(true);

const toggleMicrosoftEventsVisibility = () => {
	showMicrosoftEventsOnCalendar.value = !showMicrosoftEventsOnCalendar.value;

	if (!showMicrosoftEventsOnCalendar.value) {
		events.value = events.value.filter(
			(event) => event.extendedProps?.source !== "microsoft",
		);
		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
		};
	} else {
		fetchMicrosoftEvents(currentLoadedMonth.value, currentLoadedYear.value);
	}
};

const isMounted = ref(false);
</script>

<template>
	<div class="calendar-layout">
		<!-- Loading overlay -->
		<loadigcomponent v-if="calendarStore.loadingState" />

		<!-- Modals -->
		<AddActivityCalendar
			v-if="addActivity"
			@cancelAddActivity="toggleAddActivity"
			@addNewEvent="addNewEvent"
			:end_date="end_date"
		/>

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
			:eventType="eventType"
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

		<!-- Mobile header bar -->
		<header class="mobile-topbar">
			<button
				class="mobile-menu-btn"
				@click="sidebarOpen = !sidebarOpen"
				aria-label="Toggle sidebar"
			>
				<span class="hamburger-line"></span>
				<span class="hamburger-line"></span>
				<span class="hamburger-line"></span>
			</button>
			<span class="mobile-title">Diár</span>
		</header>

		<!-- Sidebar backdrop (mobile) -->
		<div
			v-if="sidebarOpen"
			class="sidebar-backdrop"
			@click="sidebarOpen = false"
		></div>

		<!-- Sidebar -->
		<aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
			<div class="sidebar-header">
				<h1 class="sidebar-title">Diár</h1>
				<button
					class="sidebar-close"
					@click="sidebarOpen = false"
					aria-label="Close sidebar"
				>
					✕
				</button>
			</div>

			<!-- Weekends toggle -->
			<div class="sidebar-section">
				<label class="toggle-label">
					<span class="toggle-track">
						<input
							type="checkbox"
							:checked="calendarOptions.weekends"
							@change="handleWeekendsToggle"
							class="toggle-input"
						/>
						<span class="toggle-thumb"></span>
					</span>
					<span class="toggle-text">Zobraziť víkendy</span>
				</label>
			</div>

			<!-- Recent events -->
			<div class="sidebar-section" v-if="recentEvents.length > 0">
				<h3 class="section-label">Dnešné udalosti</h3>
				<ul class="recent-events-list">
					<li
						v-for="event in recentEvents"
						:key="event.id"
						@click="displayUpdateEvent(event)"
						class="recent-event-item"
					>
						<span class="event-dot"></span>
						<div class="event-info">
							<span class="event-item-title">{{ event.title }}</span>
							<span class="event-item-time">{{
								formatDate(event.startStr)
							}}</span>
						</div>
					</li>
				</ul>
			</div>
			<div class="sidebar-section" v-else>
				<h3 class="section-label">Dnešné udalosti</h3>
				<p class="empty-state">Žiadne nadchádzajúce udalosti</p>
			</div>

			<!-- Calendar sharing -->
			<div class="sidebar-section">
				<CalendarSharing
					@deleteSharedEventsId="deleteSharedEventsId"
					@addSharedEventsId="addSharedEventsId"
					@toggleMyActivities="toggleMyActivities"
				/>
			</div>

			<!-- Account & Calendars collapsible -->
			<div class="sidebar-section">
				<button
					class="collapsible-btn"
					@click="showEventMenu = !showEventMenu"
					:class="{ 'collapsible-btn--active': showEventMenu }"
				>
					<span>Účty a kalendáre</span>
					<svg
						class="chevron"
						:class="{ 'chevron--rotated': showEventMenu }"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
					>
						<path
							d="M4 6l4 4 4-4"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>

				<transition name="slide-down">
					<div v-if="showEventMenu" class="account-menu">
						<!-- Google section -->
						<div class="account-group">
							<p class="account-group-label">
								<img
									src="/public/google_icon.png"
									alt="Google"
									class="provider-icon"
								/>
								Google
							</p>
							<button class="action-btn" @click="fetchGoogleEvents">
								Zobraziť Google udalosti
							</button>
							<button class="action-btn" @click="loginWithGoogle">
								Prihlásiť sa
							</button>
							<button
								class="action-btn action-btn--danger"
								@click="logoutWithGoogle"
							>
								Odhlásiť sa
							</button>
						</div>

						<!-- Microsoft section -->
						<div class="account-group">
							<p class="account-group-label">
								<img
									src="/public/icons8-microsoft-48.png"
									alt="Microsoft"
									class="provider-icon"
								/>
								Microsoft
							</p>
							<button
								class="action-btn"
								@click="toggleMicrosoftEventsVisibility"
							>
								{{
									showMicrosoftEventsOnCalendar
										? "Skryť udalosti"
										: "Zobraziť udalosti"
								}}
							</button>
							<button
								v-if="!isLoggedInWithMicrosoft"
								class="action-btn"
								@click="loginWithMicrosoft"
							>
								Prihlásiť sa
							</button>
							<button
								class="action-btn action-btn--danger"
								@click="logoutWithMicrosoft"
							>
								Odhlásiť sa
							</button>
						</div>

						<!-- Microsoft calendars -->
						<div class="calendar-list-section">
							<p class="account-group-label">Kalendáre</p>
							<div v-if="calendarListLoading" class="loading-text">
								Načítavanie…
							</div>
							<div v-else class="calendar-chips">
								<div
									v-for="calendar in calendarList"
									:key="calendar.id"
									@click="
										userStore.userAddCalendarName(
											calendar.name,
											currentLoadedMonth,
											currentLoadedYear,
										)
									"
									class="calendar-chip"
									:class="{
										'calendar-chip--active':
											Array.isArray(userStore.selected_calendar_names) &&
											userStore.selected_calendar_names.includes(calendar.name),
									}"
								>
									{{ calendar.name }}
								</div>
							</div>
						</div>
					</div>
				</transition>
			</div>
		</aside>

		<!-- Main calendar area -->
		<main class="calendar-main">
			<!-- Microsoft loading indicator -->
			<transition name="fade">
				<div
					v-if="calendarStore.microsoftLoadingState"
					class="ms-loading-badge"
				>
					<div class="mini-spinner"></div>
					<span>Načítava Microsoft kalendár…</span>
				</div>
			</transition>

			<FullCalendar
				ref="calendarRef"
				class="fc-wrapper"
				:options="calendarOptions"
			>
				<template v-slot:eventContent="arg">
					<div class="event-pill">
						<span class="event-pill-time">{{ arg.timeText }}</span>
						<span class="event-pill-title">{{ arg.event.title }}</span>
						<span
							v-if="
								arg.event.extendedProps.firstName ||
								arg.event.extendedProps.lastName
							"
							class="event-pill-contact"
						>
							{{ arg.event.extendedProps.firstName }}
							{{ arg.event.extendedProps.lastName }}
						</span>
					</div>
				</template>
			</FullCalendar>
		</main>
	</div>
</template>

<style lang="css">
/* ────────────────────────────────────────────
   Design tokens
──────────────────────────────────────────── */
:root {
	--sidebar-width: 280px;
	--topbar-height: 52px;

	--color-bg: #f5f6fa;
	--color-surface: #ffffff;
	--color-surface-2: #f0f2f8;
	--color-border: #e2e5ef;
	--color-primary: rgb(37, 99, 235);
	--color-primary-light: #eff4ff;
	--color-danger: #ef4444;
	--color-danger-light: #fef2f2;
	--color-text: #1e2433;
	--color-text-muted: #6b7594;
	--color-google: #4285f4;
	--color-ms: #00a1f1;

	--radius-sm: 6px;
	--radius-md: 10px;
	--radius-lg: 16px;

	--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
	--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
	--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.13);

	--font-body: "DM Sans", system-ui, sans-serif;
	--transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ────────────────────────────────────────────
   Layout shell
──────────────────────────────────────────── */
.calendar-layout {
	display: flex;
	height: 100dvh;
	background: var(--color-bg);
	font-family: var(--font-body);
	color: var(--color-text);
	overflow: hidden;
}

/* ────────────────────────────────────────────
   Mobile top bar (hidden on desktop)
──────────────────────────────────────────── */
.mobile-topbar {
	display: none;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: var(--topbar-height);
	background: var(--color-surface);
	border-bottom: 1px solid var(--color-border);
	align-items: center;
	gap: 12px;
	padding: 0 16px;
	z-index: 200;
	box-shadow: var(--shadow-sm);
}

.mobile-menu-btn {
	display: flex;
	flex-direction: column;
	gap: 5px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px;
}

.hamburger-line {
	display: block;
	width: 22px;
	height: 2px;
	background: var(--color-text);
	border-radius: 2px;
	transition: var(--transition);
}

.mobile-title {
	font-size: 17px;
	font-weight: 600;
	letter-spacing: -0.3px;
}

/* ────────────────────────────────────────────
   Sidebar backdrop (mobile only)
──────────────────────────────────────────── */
.sidebar-backdrop {
	display: none;
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.35);
	backdrop-filter: blur(2px);
	z-index: 249;
}

/* ────────────────────────────────────────────
   Sidebar
──────────────────────────────────────────── */
.sidebar {
	width: var(--sidebar-width);
	flex-shrink: 0;
	background: var(--color-surface);
	border-right: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	overflow-x: hidden;
	z-index: 250;
	transition: transform var(--transition);
}

.sidebar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 20px 12px;
	border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
	font-size: 20px;
	font-weight: 700;
	letter-spacing: -0.5px;
	margin: 0;
}

.sidebar-close {
	display: none;
	background: none;
	border: none;
	font-size: 18px;
	cursor: pointer;
	color: var(--color-text-muted);
	padding: 4px 8px;
	border-radius: var(--radius-sm);
	transition: background var(--transition);
}

.sidebar-close:hover {
	background: var(--color-surface-2);
}

.sidebar-section {
	padding: 14px 16px;
	border-bottom: 1px solid var(--color-border);
}

.section-label {
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.8px;
	color: var(--color-text-muted);
	margin: 0 0 10px;
}

/* ────────────────────────────────────────────
   Toggle switch
──────────────────────────────────────────── */
.toggle-label {
	display: flex;
	align-items: center;
	gap: 10px;
	cursor: pointer;
}

.toggle-track {
	position: relative;
	width: 40px;
	height: 22px;
	background: var(--color-border);
	border-radius: 99px;
	transition: background var(--transition);
	flex-shrink: 0;
}

.toggle-input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.toggle-thumb {
	position: absolute;
	top: 3px;
	left: 3px;
	width: 16px;
	height: 16px;
	background: white;
	border-radius: 50%;
	box-shadow: var(--shadow-sm);
	transition: transform var(--transition);
}

.toggle-input:checked ~ .toggle-thumb {
	transform: translateX(18px);
}

.toggle-track:has(.toggle-input:checked) {
	background: var(--color-primary);
}

.toggle-text {
	font-size: 14px;
	font-weight: 500;
}

/* ────────────────────────────────────────────
   Recent events
──────────────────────────────────────────── */
.recent-events-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.recent-event-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: background var(--transition);
}

.recent-event-item:hover {
	background: var(--color-primary-light);
}

.event-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--color-primary);
	flex-shrink: 0;
}

.event-info {
	display: flex;
	flex-direction: column;
	gap: 1px;
	min-width: 0;
}

.event-item-title {
	font-size: 13px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-item-time {
	font-size: 11px;
	color: var(--color-text-muted);
}

.empty-state {
	font-size: 13px;
	color: var(--color-text-muted);
	margin: 0;
	font-style: italic;
}

/* ────────────────────────────────────────────
   Collapsible button
──────────────────────────────────────────── */
.collapsible-btn {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	background: var(--color-surface-2);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	padding: 10px 14px;
	font-size: 13px;
	font-weight: 600;
	color: var(--color-text);
	cursor: pointer;
	transition: background var(--transition);
}

.collapsible-btn:hover,
.collapsible-btn--active {
	background: var(--color-primary-light);
	border-color: var(--color-primary);
	color: var(--color-primary);
}

.chevron {
	transition: transform var(--transition);
}

.chevron--rotated {
	transform: rotate(180deg);
}

/* ────────────────────────────────────────────
   Account menu
──────────────────────────────────────────── */
.account-menu {
	margin-top: 10px;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.account-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.account-group-label {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.7px;
	color: var(--color-text-muted);
	margin: 0 0 4px;
}

.provider-icon {
	width: 14px;
	height: 14px;
	object-fit: contain;
}

.action-btn {
	width: 100%;
	padding: 8px 12px;
	border-radius: var(--radius-sm);
	font-size: 13px;
	font-weight: 500;
	text-align: left;
	cursor: pointer;
	background: var(--color-surface-2);
	border: 1px solid var(--color-border);
	color: var(--color-text);
	transition:
		background var(--transition),
		border-color var(--transition);
}

.action-btn:hover {
	background: var(--color-primary-light);
	border-color: var(--color-primary);
	color: var(--color-primary);
}

.action-btn--danger {
	color: var(--color-danger);
}

.action-btn--danger:hover {
	background: var(--color-danger-light);
	border-color: var(--color-danger);
	color: var(--color-danger);
}

/* Calendar chips */
.calendar-list-section {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.loading-text {
	font-size: 13px;
	color: var(--color-text-muted);
	font-style: italic;
}

.calendar-chips {
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.calendar-chip {
	padding: 7px 12px;
	border-radius: var(--radius-sm);
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	background: var(--color-surface-2);
	border: 1px solid var(--color-border);
	transition: all var(--transition);
}

.calendar-chip:hover {
	border-color: var(--color-primary);
}

.calendar-chip--active {
	background: #d1fae5;
	border-color: #10b981;
	color: #065f46;
	font-weight: 600;
}

/* ────────────────────────────────────────────
   Main calendar
──────────────────────────────────────────── */
.calendar-main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: relative;
	padding: 20px;
	background: var(--color-bg);
}

.fc-wrapper {
	flex: 1;
	min-height: 0;
	background: var(--color-surface);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-md);
	overflow: hidden;
}

/* ────────────────────────────────────────────
   Microsoft loading badge
──────────────────────────────────────────── */
.ms-loading-badge {
	position: absolute;
	top: 28px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	gap: 10px;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: 99px;
	padding: 8px 16px;
	font-size: 13px;
	font-weight: 500;
	box-shadow: var(--shadow-md);
	z-index: 100;
	white-space: nowrap;
}

.mini-spinner {
	width: 14px;
	height: 14px;
	border: 2px solid var(--color-border);
	border-top-color: var(--color-primary);
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

/* ────────────────────────────────────────────
   Event pill (event content slot)
──────────────────────────────────────────── */
.event-pill {
	display: flex;
	flex-direction: column;
	gap: 1px;
	padding: 1px 3px;
	overflow: hidden;
	width: 100%;
}

.event-pill-time {
	font-size: 10px;
	font-weight: 700;
	opacity: 0.85;
	white-space: nowrap;
}

.event-pill-title {
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-pill-contact {
	font-size: 10px;
	opacity: 0.75;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* ────────────────────────────────────────────
   FullCalendar overrides
──────────────────────────────────────────── */
.fc {
	height: 100% !important;
	font-family: var(--font-body) !important;
}

.fc-toolbar-title {
	font-size: 16px !important;
	font-weight: 700 !important;
	letter-spacing: -0.3px;
}

.fc-button {
	background: var(--color-surface-2) !important;
	color: var(--color-text) !important;
	border: 1px solid var(--color-border) !important;
	box-shadow: none !important;
	font-family: var(--font-body) !important;
	font-size: 13px !important;
	font-weight: 500 !important;
	border-radius: var(--radius-sm) !important;
	padding: 5px 12px !important;
	transition: background var(--transition) !important;
}

.fc-button:hover {
	background: var(--color-primary-light) !important;
	color: var(--color-primary) !important;
	border-color: var(--color-primary) !important;
}

.fc-button-active,
.fc-button-primary:not(:disabled).fc-button-active {
	background: var(--color-primary) !important;
	color: #fff !important;
	border-color: var(--color-primary) !important;
}

.fc-today-button:disabled {
	opacity: 0.5 !important;
}

.fc-col-header-cell {
	font-weight: 600 !important;
	font-size: 12px !important;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.fc-timegrid-slot-label {
	font-size: 11px !important;
	color: var(--color-text-muted) !important;
}

.fc-daygrid-day-number,
.fc-col-header-cell-cushion {
	color: var(--color-text) !important;
	text-decoration: none !important;
}

.fc-day-today {
	background: var(--color-primary-light) !important;
}

.fc-now-indicator-line {
	border-color: var(--color-primary) !important;
	border-width: 2px !important;
}

.fc-event {
	border-radius: 5px !important;
	border-width: 0 0 0 3px !important;
	font-size: 12px !important;
}

/* ────────────────────────────────────────────
   Transitions
──────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.slide-down-enter-active {
	transition: all 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-leave-active {
	transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}

/* ────────────────────────────────────────────
   Responsive — tablet / mobile
──────────────────────────────────────────── */
@media (max-width: 768px) {
	.calendar-layout {
		flex-direction: column;
		padding-top: var(--topbar-height);
	}

	.mobile-topbar {
		display: flex;
	}

	.sidebar-backdrop {
		display: block;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		height: 100dvh;
		transform: translateX(-100%);
		box-shadow: var(--shadow-lg);
	}

	.sidebar--open {
		transform: translateX(0);
	}

	.sidebar-close {
		display: block;
	}

	.calendar-main {
		padding: 10px;
	}

	.fc-toolbar-title {
		font-size: 14px !important;
	}

	.fc-button {
		font-size: 11px !important;
		padding: 4px 8px !important;
	}

	.ms-loading-badge {
		font-size: 12px;
		padding: 6px 12px;
	}
}

@media (max-width: 480px) {
	.calendar-main {
		padding: 6px;
	}

	.fc-header-toolbar {
		flex-wrap: wrap;
		gap: 6px;
	}
}
</style>
