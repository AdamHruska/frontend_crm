<script setup>
import ICAL from "ical.js";
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

const loadingSharedUser = ref(false);

const router = useRouter();

const user = ref({});
const sharedIDs = ref([]);

const icsEvents = ref([]);
const icsLoading = ref(false);

const selectedIcsCalendars = ref([]);
const availableIcsCalendars = ref([]);
const icsGlobalColor = ref("#F59E0B");

const showIcsCalendarDropdown = ref(false);

const showContactNames = ref(true);
const showActivityTitle = ref(true);

// const getIcsCalendarColor = (calendarName) => {
// 	const index = availableIcsCalendars.value.indexOf(calendarName);

// 	if (index === -1) return "#DB2777";

// 	return icsCalendarColors[index % icsCalendarColors.length];
// };

const ICS_COLOR = "#F59E0B";
// const getIcsCalendarColor = () => {
// 	return ICS_COLOR;
// };

const getIcsCalendarColor = () => {
	return icsGlobalColor.value;
};

// const icsCalendarColors = [
// 	"#16A34A", // green
// 	"#DC2626", // red
// 	"#F59E0B", // orange
// 	"#DB2777", // pink
// 	"#0891B2", // cyan
// 	"#7C3AED", // violet
// 	"#65A30D", // lime
// 	"#EA580C", // amber
// ];

function parseIcsToEvents(icsText, userId, color = "#DB2777") {
	try {
		const jcalData = ICAL.parse(icsText);
		const comp = new ICAL.Component(jcalData);
		const vevents = comp.getAllSubcomponents("vevent");

		return vevents.map((vevent) => {
			const event = new ICAL.Event(vevent);

			return {
				id: `ics-${event.uid}-${Math.random().toString(36).substr(2, 5)}`,
				title: event.summary || "Bez názvu",
				start: event.startDate.toJSDate().toISOString(),
				end: event.endDate?.toJSDate().toISOString() ?? null,
				allDay: event.startDate.isDate,
				backgroundColor: color,
				borderColor: color,
				user_id: userId,
				extendedProps: {
					source: "ics",
					location: event.location || "",
					note: event.description || "",
					organizer: event.organizer || null,
					calendar: "",
				},
			};
		});
	} catch (err) {
		console.error("Failed to parse ICS data:", err);
		return [];
	}
}

const icsRefreshInterval = ref(null);

async function fetchIcsEvents(forceRefresh = false) {
	console.log("[ICS] fetchIcsEvents called, forceRefresh:", forceRefresh);
	// if (!forceRefresh && calendarStore.isIcsCacheValid()) {
	// 	const cachedEvents = calendarStore.icsEventCache;
	// 	const nonIcsEvents = events.value.filter(
	// 		(e) => e.extendedProps?.source !== "ics",
	// 	);
	// 	events.value = [...nonIcsEvents, ...cachedEvents];
	// 	calendarOptions.value = {
	// 		...calendarOptions.value,
	// 		events: [...events.value],
	// 	};
	// 	return;
	// }

	if (!forceRefresh && calendarStore.isIcsCacheValid()) {
		const cachedEvents = calendarStore.icsEventCache;

		// ← toto chýbalo
		availableIcsCalendars.value = calendarStore.icsCalendarNames;
		if (selectedIcsCalendars.value.length === 0) {
			selectedIcsCalendars.value = [...availableIcsCalendars.value];
		}

		const nonIcsEvents = events.value.filter(
			(e) => e.extendedProps?.source !== "ics",
		);
		events.value = [...nonIcsEvents, ...cachedEvents];
		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
		};
		return;
	}

	console.log("[ICS] Making API request...");
	icsLoading.value = true;

	try {
		const response = await axios.get(`${config.public.apiUrl}proxy-ics-all`, {
			headers: { Authorization: `Bearer ${authStore.token}` },
		});

		let allParsedEvents = [];
		const loadedCalendarNames = [];

		availableIcsCalendars.value = response.data.map(
			(calendar) => calendar.calendar_name,
		);

		if (selectedIcsCalendars.value.length === 0) {
			selectedIcsCalendars.value = [...availableIcsCalendars.value];
		}

		response.data.forEach((calendar, index) => {
			if (!selectedIcsCalendars.value.includes(calendar.calendar_name)) return;

			// const color = icsCalendarColors[index % icsCalendarColors.length];
			//const color = ICS_COLOR;

			const color = icsGlobalColor.value; // ← single global color

			const parsed = parseIcsToEvents(
				calendar.ics_data,
				userStore.user.id,
				color,
			);

			parsed.forEach((event) => {
				event.extendedProps.calendar = calendar.calendar_name;
			});

			if (parsed.length > 0) {
				loadedCalendarNames.push(calendar.calendar_name);
			}

			allParsedEvents.push(...parsed);
		});

		// Save to cache
		//calendarStore.setIcsCache(allParsedEvents);
		calendarStore.setIcsCache(allParsedEvents, availableIcsCalendars.value);

		icsEvents.value = allParsedEvents;

		const nonIcsEvents = events.value.filter(
			(e) => e.extendedProps?.source !== "ics",
		);
		events.value = [...nonIcsEvents, ...allParsedEvents];

		calendarOptions.value = {
			...calendarOptions.value,
			events: [...events.value],
		};

		if (loadedCalendarNames.length > 0) {
			toast.success(
				`Načítaných ${allParsedEvents.length} ICS udalostí z kalendárov: ${loadedCalendarNames.join(", ")}`,
			);
		}
	} catch (err) {
		console.error("Error fetching ICS events:", err);
		toast.error("Nepodarilo sa načítať ICS udalosti.");
	} finally {
		icsLoading.value = false;
	}
}

// async function fetchIcsEvents(forceRefresh = false) {
// 	// Return cached events if still valid
// 	if (!forceRefresh && calendarStore.isIcsCacheValid()) {
// 		const cachedEvents = calendarStore.icsEventCache;

// 		const nonIcsEvents = events.value.filter(
// 			(e) => e.extendedProps?.source !== "ics",
// 		);
// 		events.value = [...nonIcsEvents, ...cachedEvents];
// 		calendarOptions.value = {
// 			...calendarOptions.value,
// 			events: [...events.value],
// 		};
// 		return;
// 	}

// 	icsLoading.value = true;

// 	try {
// 		const response = await axios.get(`${config.public.apiUrl}proxy-ics-all`, {
// 			headers: {
// 				Authorization: `Bearer ${authStore.token}`,
// 			},
// 		});

// 		let allParsedEvents = [];
// 		const loadedCalendarNames = [];

// 		availableIcsCalendars.value = response.data.map(
// 			(calendar) => calendar.calendar_name,
// 		);

// 		if (selectedIcsCalendars.value.length === 0) {
// 			selectedIcsCalendars.value = [...availableIcsCalendars.value];
// 		}

// 		response.data.forEach((calendar, index) => {
// 			if (!selectedIcsCalendars.value.includes(calendar.calendar_name)) {
// 				return;
// 			}

// 			const color = icsCalendarColors[index % icsCalendarColors.length];
// 			const parsed = parseIcsToEvents(
// 				calendar.ics_data,
// 				userStore.user.id,
// 				color,
// 			);

// 			parsed.forEach((event) => {
// 				event.extendedProps.calendar = calendar.calendar_name;
// 			});

// 			if (parsed.length > 0) {
// 				loadedCalendarNames.push(calendar.calendar_name);
// 			}

// 			allParsedEvents.push(...parsed);
// 		});

// 		// Store in cache
// 		calendarStore.setIcsCache(allParsedEvents);

// 		icsEvents.value = allParsedEvents;

// 		const nonIcsEvents = events.value.filter(
// 			(e) => e.extendedProps?.source !== "ics",
// 		);
// 		events.value = [...nonIcsEvents, ...allParsedEvents];

// 		calendarOptions.value = {
// 			...calendarOptions.value,
// 			events: [...events.value],
// 		};

// 		if (loadedCalendarNames.length > 0) {
// 			toast.success(
// 				`Načítaných ${allParsedEvents.length} ICS udalostí z kalendárov: ${loadedCalendarNames.join(", ")}`,
// 			);
// 		}
// 	} catch (err) {
// 		console.error("Error fetching ICS events:", err);
// 		toast.error("Nepodarilo sa načítať ICS udalosti.");
// 	} finally {
// 		icsLoading.value = false;
// 	}
// }

// async function fetchIcsEvents() {
// 	icsLoading.value = true;

// 	try {
// 		const response = await axios.get(`${config.public.apiUrl}proxy-ics-all`, {
// 			headers: {
// 				Authorization: `Bearer ${authStore.token}`,
// 			},
// 		});

// 		let allParsedEvents = [];
// 		const loadedCalendarNames = [];

// 		availableIcsCalendars.value = response.data.map(
// 			(calendar) => calendar.calendar_name,
// 		);

// 		// First load = all selected
// 		if (selectedIcsCalendars.value.length === 0) {
// 			selectedIcsCalendars.value = [...availableIcsCalendars.value];
// 		}

// 		response.data.forEach((calendar, index) => {
// 			// Skip unchecked calendars
// 			if (!selectedIcsCalendars.value.includes(calendar.calendar_name)) {
// 				return;
// 			}

// 			const color = icsCalendarColors[index % icsCalendarColors.length];

// 			const parsed = parseIcsToEvents(
// 				calendar.ics_data,
// 				userStore.user.id,
// 				color,
// 			);

// 			parsed.forEach((event) => {
// 				event.extendedProps.calendar = calendar.calendar_name;
// 			});

// 			if (parsed.length > 0) {
// 				loadedCalendarNames.push(calendar.calendar_name);
// 			}

// 			allParsedEvents.push(...parsed);
// 		});

// 		icsEvents.value = allParsedEvents;

// 		const nonIcsEvents = events.value.filter(
// 			(e) => e.extendedProps?.source !== "ics",
// 		);

// 		events.value = [...nonIcsEvents, ...allParsedEvents];

// 		calendarOptions.value = {
// 			...calendarOptions.value,
// 			events: [...events.value],
// 		};

// 		toast.success(
// 			`Načítaných ${allParsedEvents.length} ICS udalostí z kalendárov: ${loadedCalendarNames.join(", ")}`,
// 		);
// 	} catch (err) {
// 		console.error("Error fetching ICS events:", err);
// 		toast.error("Nepodarilo sa načítať ICS udalosti.");
// 	} finally {
// 		icsLoading.value = false;
// 	}
// }

const toggleIcsCalendar = async (calendarName) => {
	if (selectedIcsCalendars.value.includes(calendarName)) {
		selectedIcsCalendars.value = selectedIcsCalendars.value.filter(
			(name) => name !== calendarName,
		);
	} else {
		selectedIcsCalendars.value.push(calendarName);
	}
	await fetchIcsEvents(true);
};

// const toggleIcsCalendar = async (calendarName) => {
// 	if (selectedIcsCalendars.value.includes(calendarName)) {
// 		selectedIcsCalendars.value = selectedIcsCalendars.value.filter(
// 			(name) => name !== calendarName,
// 		);
// 	} else {
// 		selectedIcsCalendars.value.push(calendarName);
// 	}

// 	await fetchIcsEvents();
// };

// async function fetchIcsEvents() {
// 	icsLoading.value = true;

// 	try {
// 		const response = await axios.get(`${config.public.apiUrl}proxy-ics-all`, {
// 			headers: {
// 				Authorization: `Bearer ${authStore.token}`,
// 			},
// 		});

// 		let allParsedEvents = [];
// 		const loadedCalendarNames = [];

// 		response.data.forEach((calendar, index) => {
// 			const color = icsCalendarColors[index % icsCalendarColors.length];

// 			const parsed = parseIcsToEvents(
// 				calendar.ics_data,
// 				userStore.user.id,
// 				color,
// 			);

// 			parsed.forEach((event) => {
// 				event.extendedProps.calendar = calendar.calendar_name;
// 			});

// 			if (parsed.length > 0) {
// 				loadedCalendarNames.push(calendar.calendar_name);
// 			}

// 			allParsedEvents.push(...parsed);
// 		});

// 		icsEvents.value = allParsedEvents;

// 		const nonIcsEvents = events.value.filter(
// 			(e) => e.extendedProps?.source !== "ics",
// 		);

// 		events.value = [...nonIcsEvents, ...allParsedEvents];

// 		calendarOptions.value = {
// 			...calendarOptions.value,
// 			events: [...events.value],
// 		};

// 		toast.success(
// 			`Načítaných ${allParsedEvents.length} ICS udalostí z kalendárov: ${loadedCalendarNames.join(", ")}`,
// 		);
// 	} catch (err) {
// 		console.error("Error fetching ICS events:", err);
// 		toast.error("Nepodarilo sa načítať ICS udalosti.");
// 	} finally {
// 		icsLoading.value = false;
// 	}
// }

import { ref, computed, onMounted, onUnmounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
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
	"#FFB3BA", // koralovo ružová
	"#FFDFBA", // broskyňová
	"#FFFFBA", // svetlo žltá
	"#BAFFC9", // mätovo zelená
	"#FFD7BA", // marhuľová
	"#FFB3E6", // svetlo ružová
	"#C9FFE5", // aqua zelená
	"#FFE4BA", // vanilková
	"#FFCCE5", // bubble gum ružová
	"#D4F0C9", // limetková zelená
	"#FFC6D9", // lososová ružová
	"#FFEAA7", // pastelovo žltá
];

// Collapsible menu state for account/calendar actions
const showEventMenu = ref(false);

const toggleUpdateActivity = () => {
	if (updateActivity.value === true) {
		// location.reload();
	}
	updateActivity.value = !updateActivity.value;
};

const toggleAddActivity = () => {
	addActivity.value = !addActivity.value;
};

const events = ref([]);

const currentLoadedMonth = ref(null);
const currentLoadedYear = ref(null);

// Helper to fetch and merge all event types for a given month/year
async function fetchAndMergeAllEvents(month, year) {
	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}
	rawData.value = calendarStore.activities;
	const localEvents = transformData(rawData.value);

	const [googleEvents, microsoftEvents] = await Promise.all([
		calendarStore.fetchGoogleEvents(month, year),
		showMicrosoftEventsOnCalendar.value
			? calendarStore.fetchMicrosoftEvents(month, year)
			: Promise.resolve([]),
	]);

	// events.value = [...localEvents, ...googleEvents, ...microsoftEvents];

	const existingIcsEvents = events.value.filter(
		(event) => event.extendedProps?.source === "ics",
	);

	events.value = [
		...localEvents,
		...googleEvents,
		...microsoftEvents,
		...existingIcsEvents,
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
	if (
		!confirm(`Naozaj chcete aktualizovať udalosť "${dropInfo.event.title}"?`)
	) {
		dropInfo.revert();
		return;
	}

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
			},
		);

		console.log("Backend update response:", response.data);
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
			{
				koniec: newEnd,
			},
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
	await userStore.fetchUser();

	const savedColor = localStorage.getItem("icsGlobalColor");
	if (savedColor) {
		icsGlobalColor.value = savedColor;
	}

	await fetchIcsEvents();

	if (!calendarStore.icsRefreshInterval) {
		calendarStore.setIcsRefreshInterval(
			setInterval(
				async () => {
					console.log(
						"[ICS] Auto-refresh triggered at",
						new Date().toLocaleTimeString(),
					);
					await fetchIcsEvents(true);
					console.log(
						"[ICS] Auto-refresh complete at",
						new Date().toLocaleTimeString(),
					);
				},
				5 * 60 * 1000,
			),
		);
	}

	await userStore.userGetCalendarNames();

	console.log("isc_link value:", userStore.user.ics_link);
	try {
		calendarListLoading.value = true;
		const response = await axios.get(
			`${config.public.apiUrl}microsoft/calendars`,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			},
		);
		calendarList.value = response.data.calendars;
	} catch (error) {
		console.error("Error fetching Microsoft calendars:", error);
	} finally {
		calendarListLoading.value = false;
	}

	// Fetch contacts only (shared activities now loaded per-user below)
	await Promise.all([
		contactsStore.contacts.data.length === 0
			? contactsStore.fetchContacts()
			: Promise.resolve(),
	]);

	const now = new Date();
	await fetchAndMergeAllEvents(now.getMonth() + 1, now.getFullYear());
	currentLoadedMonth.value = now.getMonth() + 1;
	currentLoadedYear.value = now.getFullYear();

	// await userStore.fetchUser();
	// await fetchIcsEvents();

	console.log("Loaded user:", userStore.user);
	console.log("ICS LINK:", userStore.user?.ics_link);

	// await fetchIcsEvents();

	// ✅ Load shared users' DB + Microsoft events using the new endpoint
	// if (userStore.user.confirmed_share_user_id) {
	// 	const confirmedIds = Object.values(userStore.user.confirmed_share_user_id);
	// 	for (const sharedUserId of confirmedIds) {
	// 		await addSharedEventsId(sharedUserId);
	// 	}
	// }

	if (calendarRef.value) {
		setTimeout(() => {
			calendarRef.value.getApi().refetchEvents();
		}, 100);
	}

	// Set up event listener for deleteSharedEvents
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

		return `rgb(
			${Math.round(r + (avg - r) * factor)},
			${Math.round(g + (avg - g) * factor)},
			${Math.round(b + (avg - b) * factor)}
		)`;
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

// function handleEventClick(clickInfo) {
// 	activityID.value = clickInfo.event._def.publicId;
// 	eventType.value =
// 		clickInfo.event.extendedProps.source === "microsoft"
// 			? "microsoft"
// 			: clickInfo.event.extendedProps.source === "google"
// 				? "google"
// 				: "regular";

// 	if (eventType.value === "microsoft") {
// 		selectedMicrosoftEvent.value = {
// 			id: clickInfo.event.id,
// 			title: clickInfo.event.title,
// 			start: clickInfo.event.start,
// 			end: clickInfo.event.end,
// 			location:
// 				clickInfo.event.extendedProps.location || "Nebola zadaná lokalita",
// 			link: clickInfo.event.extendedProps.link || "",
// 			organizer: clickInfo.event.extendedProps.organizer,
// 			attendees: clickInfo.event.extendedProps.attendees,
// 			allDay: clickInfo.event.allDay,
// 			note: clickInfo.event.extendedProps.note || "Žiadna poznámka",
// 			importance: clickInfo.event.extendedProps.importance || "normal",
// 		};
// 		toggleMicrosoftEvents();
// 	} else if (eventType.value === "google") {
// 		selectedMicrosoftEvent.value = {
// 			id: clickInfo.event.id,
// 			title: clickInfo.event.title,
// 			start: clickInfo.event.start,
// 			end: clickInfo.event.end,
// 			note: clickInfo.event.extendedProps.description || "Žiadna poznámka",
// 			organizer: clickInfo.event.extendedProps.organizer || null,
// 			attendees: clickInfo.event.extendedProps.attendees || [],
// 			calendar: clickInfo.event.extendedProps.calendar || "",
// 		};
// 		toggleMicrosoftEvents();
// 	} else {
// 		toggleUpdateActivity();
// 	}
// }

function handleEventClick(clickInfo) {
	activityID.value = clickInfo.event._def.publicId;
	eventType.value =
		clickInfo.event.extendedProps.source === "microsoft"
			? "microsoft"
			: clickInfo.event.extendedProps.source === "google"
				? "google"
				: clickInfo.event.extendedProps.source === "ics"
					? "ics"
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
	} else if (eventType.value === "ics") {
		selectedMicrosoftEvent.value = {
			id: clickInfo.event.id,
			title: clickInfo.event.title,
			start: clickInfo.event.start,
			end: clickInfo.event.end,
			note: clickInfo.event.extendedProps.note || "",
			location: clickInfo.event.extendedProps.location || "",
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
	// Remove shared DB events + shared Microsoft events for this unchecked user
	loadedSharedUserIds.value.delete(String(userId));

	events.value = events.value.filter(
		(event) => String(event.user_id) !== String(userId),
	);

	// Remove from shared activities store too
	calendarStore.shared_activities = calendarStore.shared_activities.filter(
		(activity) => String(activity.created_id) !== String(userId),
	);

	// Update calendar immediately
	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};

	// Force FullCalendar rerender
	if (calendarRef.value) {
		calendarRef.value.getApi().removeAllEvents();
		calendarRef.value.getApi().addEventSource(events.value);
	}
};

// const deleteSharedEventsId = (userId) => {
// 	console.log("test delete eventov sa vykonal");
// 	events.value = events.value.filter((event) => event.user_id !== userId);
// 	calendarOptions.value = {
// 		...calendarOptions.value,
// 		events: [...events.value],
// 	};
// };

// ✅ Updated: calls new /with-microsoft endpoint to get both DB + Outlook events

const addSharedEventsId = async (userId, isTransitive = false) => {
	loadingSharedUser.value = true;
	const userIdString = String(userId);

	if (loadedSharedUserIds.value.has(userIdString)) {
		loadingSharedUser.value = false;
		return;
	}
	loadedSharedUserIds.value.add(userIdString);

	try {
		const response = await axios.get(
			`${config.public.apiUrl}get-activities-by-creator/${userId}/with-microsoft`,
			{
				params: {
					month: currentLoadedMonth.value ?? new Date().getMonth() + 1,
					year: currentLoadedYear.value ?? new Date().getFullYear(),
					transitive: isTransitive,
				},
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (response?.data) {
			if (response.data.activities?.length) {
				const sharedEvents = transformData(response.data.activities);

				const rawActivities = toRaw(calendarStore.shared_activities);
				const currentActivities = Array.isArray(rawActivities)
					? rawActivities
					: Object.values(rawActivities)[0] || [];

				calendarStore.shared_activities = [
					...currentActivities,
					...response.data.activities,
				];

				events.value = [...events.value, ...sharedEvents];
			}

			if (response.data.microsoft_events?.length) {
				const sharedMicrosoftEvents = response.data.microsoft_events.map(
					(event) => {
						if (!calendarStore.userColors[event.created_id]) {
							const userIds = Object.keys(calendarStore.userColors).length;
							calendarStore.userColors[event.created_id] =
								pastelColors[userIds % pastelColors.length];
						}
						const color = calendarStore.userColors[event.created_id];

						return {
							id: event.microsoft_id,
							title: event.subject || "Bez názvu",
							start: event.start,
							end: event.end,
							allDay: event.isAllDay ?? false,
							backgroundColor: color,
							borderColor: color,
							user_id: event.created_id,
							extendedProps: {
								source: "microsoft",
								location: event.location,
								link: event.joinUrl,
								note: event.note,
								organizer: event.organizer,
								attendees: event.attendees,
								calendar: event.calendar,
								importance: "normal",
							},
						};
					},
				);

				events.value = [...events.value, ...sharedMicrosoftEvents];
			}

			calendarOptions.value = {
				...calendarOptions.value,
				events: [...events.value],
			};

			if (response.data.confirmed_share_user_id?.length) {
				await userStore.fetchTransitiveSharedUsers(
					response.data.confirmed_share_user_id,
					userId,
				);
			}
		}
	} catch (error) {
		console.error("Error loading shared user events:", error);
	} finally {
		loadingSharedUser.value = false;
	}
};

// const addSharedEventsId = async (userId, isTransitive = false) => {
// 	loadingStateCalendar.value = true;
// 	const userIdString = String(userId);

// 	// Prevent loading the same user twice
// 	if (loadedSharedUserIds.value.has(userIdString)) return;
// 	loadedSharedUserIds.value.add(userIdString);

// 	loadingStateCalendar.value = true;

// 	try {
// 		const response = await axios.get(
// 			`${config.public.apiUrl}get-activities-by-creator/${userId}/with-microsoft`,
// 			{
// 				params: {
// 					month: currentLoadedMonth.value ?? new Date().getMonth() + 1,
// 					year: currentLoadedYear.value ?? new Date().getFullYear(),
// 					transitive: isTransitive,
// 				},
// 				headers: {
// 					Authorization: `Bearer ${authStore.token}`,
// 					"Content-Type": "application/json",
// 				},
// 			},
// 		);

// 		if (response?.data) {
// 			// Handle DB activities
// 			if (response.data.activities?.length) {
// 				const sharedEvents = transformData(response.data.activities);

// 				const rawActivities = toRaw(calendarStore.shared_activities);
// 				const currentActivities = Array.isArray(rawActivities)
// 					? rawActivities
// 					: Object.values(rawActivities)[0] || [];

// 				calendarStore.shared_activities = [
// 					...currentActivities,
// 					...response.data.activities,
// 				];

// 				events.value = [...events.value, ...sharedEvents];
// 			}

// 			// Handle Microsoft events
// 			if (response.data.microsoft_events?.length) {
// 				const sharedMicrosoftEvents = response.data.microsoft_events.map(
// 					(event) => {
// 						if (!calendarStore.userColors[event.created_id]) {
// 							const userIds = Object.keys(calendarStore.userColors).length;
// 							calendarStore.userColors[event.created_id] =
// 								pastelColors[userIds % pastelColors.length];
// 						}
// 						const color = calendarStore.userColors[event.created_id];

// 						return {
// 							id: event.microsoft_id,
// 							title: event.subject || "Bez názvu",
// 							start: event.start,
// 							end: event.end,
// 							allDay: event.isAllDay ?? false,
// 							backgroundColor: color,
// 							borderColor: color,
// 							user_id: event.created_id,
// 							extendedProps: {
// 								source: "microsoft",
// 								location: event.location,
// 								link: event.joinUrl,
// 								note: event.note,
// 								organizer: event.organizer,
// 								attendees: event.attendees,
// 								calendar: event.calendar,
// 								importance: "normal",
// 							},
// 						};
// 					},
// 				);

// 				events.value = [...events.value, ...sharedMicrosoftEvents];
// 			}

// 			calendarOptions.value = {
// 				...calendarOptions.value,
// 				events: [...events.value],
// 			};

// 			if (response.data.confirmed_share_user_id?.length) {
// 				await userStore.fetchTransitiveSharedUsers(
// 					response.data.confirmed_share_user_id,
// 					userId,
// 				);
// 			}
// 		}
// 	} catch (error) {
// 		console.error("Error loading shared user events:", error);
// 	} finally {
// 		loadingStateCalendar.value = false;
// 	}
// };

const recentEvents = computed(() => {
	const now = new Date();

	const endOfDay = new Date();
	endOfDay.setHours(23, 59, 59, 999);

	return currentEvents.value
		.filter((event) => {
			const eventStart = new Date(event.start);

			return eventStart >= now && eventStart <= endOfDay;
		})
		.sort((a, b) => {
			return new Date(a.start) - new Date(b.start);
		});
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
const loadedSharedUserIds = ref(new Set());

const areMicrosofEventsShown = ref(false);

async function fetchMicrosoftEvents(month, year) {
	loadingStateCalendar.value = true;

	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}
	rawData.value = calendarStore.activities;

	const localEvents = transformData(rawData.value);

	const newMicrosoftEvents = await calendarStore.fetchMicrosoftEvents(
		month,
		year,
	);

	const existingGoogleEvents = events.value.filter(
		(event) => event.extendedProps?.source === "google",
	);

	// Preserve shared user events (both DB and Microsoft) that were already loaded
	const existingSharedEvents = events.value.filter(
		(event) =>
			event.user_id !== userStore.user.id &&
			event.extendedProps?.source !== "google",
	);

	events.value = [
		...localEvents,
		...existingGoogleEvents,
		...existingSharedEvents,
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
				params: {
					userId: userStore.user.id,
				},
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

	const state = JSON.stringify({
		userId,
		csrf: authStore.csrfToken,
	});

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

	const state = JSON.stringify({
		userId: userId,
		csrf: authStore.csrfToken,
	});

	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
		redirectUriRaw,
	)}&scope=${encodeURIComponent(
		scope,
	)}&response_mode=query&state=${encodeURIComponent(state)}`;

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

		console.log(response.data.message);
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
	fetchMicrosoftEvents(currentLoadedMonth.value, currentLoadedYear.value);
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

const toggleMyActivities = (isChecked) => {
	const userId = userStore.user.id;

	if (!isChecked) {
		// Hide — save current events and filter out all mine
		calendarStore.originalEvents = [...events.value];

		events.value = calendarStore.originalEvents.filter((event) => {
			// Hide my DB and shared DB events by user_id
			if (String(event.user_id) === String(userId)) return false;

			// Hide my Microsoft events
			if (
				event.extendedProps?.source === "microsoft" &&
				String(event.user_id) === String(userId)
			)
				return false;

			// Hide my Google events
			if (event.extendedProps?.source === "google") return false;

			// Hide my ICS events
			if (event.extendedProps?.source === "ics") return false;

			return true;
		});

		toast.success("Boli skryté vaše aktivity.");
		calendarStore.showOnlyMine = true;
	} else {
		// Restore all saved events
		events.value = [...calendarStore.originalEvents];
		toast.success("Boli obnovené vaše aktivity.");
		calendarStore.showOnlyMine = false;
	}

	calendarOptions.value = {
		...calendarOptions.value,
		events: [...events.value],
	};
};

// const toggleMyActivities = () => {
// 	const userId = useUserStore().user.id;

// 	if (!calendarStore.showOnlyMine) {
// 		calendarStore.originalEvents = [...events.value];

// 		events.value = calendarStore.originalEvents.filter(
// 			(event) => event.user_id !== userId,
// 		);
// 		toast.success("Boli skryté vaše aktivity.");
// 		calendarStore.showOnlyMine = true;
// 	} else {
// 		events.value = [...calendarStore.originalEvents];
// 		toast.success("Boli obnovené vaše aktivity.");
// 		calendarStore.showOnlyMine = false;
// 	}

// 	calendarOptions.value = {
// 		...calendarOptions.value,
// 		events: [...events.value],
// 	};
// };

watch(icsGlobalColor, (color) => {
	localStorage.setItem("icsGlobalColor", color);
	fetchIcsEvents(true);
});

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
	<div class="h-screen">
		<loadigcomponent
			v-if="calendarStore.loadingState || loadingStateCalendar.value"
		/>

		<div
			v-if="loadingSharedUser"
			class="fixed top-6 left-1/2 z-50 flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2.5 text-sm text-gray-700 pointer-events-none"
		>
			<svg
				class="animate-spin h-4 w-4 text-blue-500 shrink-0"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				/>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
			</svg>
			Načítavajú sa zdieľané udalosti...
		</div>

		<!-- ICS Loading Banner -->
		<div
			class="absolute top-5 left-1/2 -translate-x-1/2 z-50"
			v-if="icsLoading"
		>
			<div class="flex items-center gap-3 px-5 py-2">
				<div class="spinner">
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
				<span class="ml-8 font-medium text-sm"
					>Načítavajú sa ICS udalosti...</span
				>
			</div>
		</div>

		<!-- <AddActivityCalendar
			v-if="addActivity"
			@cancelAddActivity="toggleAddActivity"
			@addNewEvent="addNewEvent"
			:end_date="end_date"
		/> -->

		<AddActivityCalendarSecond
			v-if="addActivity"
			@cancelAddActivity="toggleAddActivity"
			@addNewEvent="addNewEvent"
			:end_date="end_date"
		/>

		<!-- <EventUpdateCalendar
			:activityID="activityID"
			:eventType="eventType"
			v-if="updateActivity"
			@cancelAddActivity="toggleUpdateActivity"
			@alterEvents="alterEvents"
			:user.value="user"
		/> -->

		<EventUpdateCalendarSecond
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
						<h2 class="underline">Nasledujúce udalosti:</h2>
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
				<div
					class="demo-app-sidebar-section text-black border-t border-gray-200 pt-3 flex flex-col justify-center items-center mb-6"
				>
					<h3
						class="font-semibold text-sm mb-2 text-gray-600 uppercase tracking-wide"
					>
						Zobrazenie udalostí
					</h3>
					<div class="">
						<label
							class="flex items-center gap-2 text-sm mb-2 cursor-pointer select-none"
						>
							<input
								type="checkbox"
								v-model="showActivityTitle"
								class="accent-blue-600"
							/>
							<span>Zobraziť názov aktivity</span>
						</label>
						<label
							class="flex items-center gap-2 text-sm cursor-pointer select-none"
						>
							<input
								type="checkbox"
								v-model="showContactNames"
								class="accent-blue-600"
							/>
							<span>Zobraziť meno kontaktu</span>
						</label>
					</div>
				</div>
				<div class="shadow pb-4 rounded-b-lg">
					<CalendarSharing
						class="mt-4"
						:disabled="loadingSharedUser"
						@deleteSharedEventsId="deleteSharedEventsId"
						@addSharedEventsId="addSharedEventsId"
						@toggleMyActivities="toggleMyActivities"
					/>
				</div>
				<div class="flex flex-col items-center py-6 shadow-lg rounded-b-lg">
					<button
						class="bg-blue-200 px-4 py-4 rounded-md shadow hover:bg-blue-300 mb-3 font-semibold"
						@click="showEventMenu = !showEventMenu"
					>
						{{
							showEventMenu
								? "Skryť menu"
								: "Zobraziť menu pre účty a kalendáre"
						}}
					</button>
					<transition name="fade">
						<div v-if="showEventMenu" class="w-full flex flex-col items-center">
							<button
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="fetchGoogleEvents"
							>
								<span>Zobraziť Google udalosti</span>
								<img src="/public/google_icon.png" alt="logo" />
							</button>

							<!-- <button
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="loginWithGoogle"
							>
								<span>Prihlásiť sa pomocou Google</span>
								<img src="/public/google_icon.png" alt="logo" />
							</button> -->

							<button
								v-if="showMicrosoftEventsOnCalendar"
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="toggleMicrosoftEventsVisibility"
							>
								<span>Skryť microsoft eventy</span>
								<img src="/public/icons8-microsoft-48.png" alt="logo" />
							</button>
							<button
								v-else
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="toggleMicrosoftEventsVisibility"
							>
								<span>Zobraziť microsoft eventy</span>
								<img src="/public/icons8-microsoft-48.png" alt="logo" />
							</button>

							<button
								v-if="showMicrosoftEventsOnCalendar"
								class="bg-blue-500 px-4 rounded-md shadow hover:bg-blue-600 flex items-center gap-2 cursor-pointer w-[240px] py-4 mt-3"
								@click="fetchIcsEvents(true)"
								:disabled="icsLoading"
							>
								<span v-if="icsLoading">Načítavam...</span>
								<span v-else>🔄 Obnoviť ICS udalosti</span>
							</button>

							<!-- <button
								v-if="!isLoggedInWithMicrosoft"
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="loginWithMicrosoft"
							>
								<span>Prihlásiť pomocou Microsoft</span>
								<img src="/public/icons8-microsoft-48.png" alt="logo" />
							</button> -->
							<!-- <button
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="logoutWithMicrosoft"
							>
								<span>Odhlásiť sa z Microsoft účtu</span>
								<img src="/public/icons8-microsoft-48.png" alt="logo" />
							</button> -->

							<!-- <button
								class="bg-[#D1D5DB] px-4 rounded-md shadow hover:bg-slate-200 flex items-center gap-2 cursor-pointer w-[240px] py-1 mt-3"
								@click="logoutWithGoogle"
							>
								<span>Odhlásiť sa z Google účtu</span>
								<img src="/public/google_icon.png" alt="logo" />
							</button> -->

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
											currentLoadedYear,
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
								<div
									v-if="calendarListLoading"
									class="mt-3 font-bold text-base"
								>
									Načitavanie kalendárov...
								</div>
							</div>
						</div>
					</transition>

					<div class="bg-[#D1D5DB] px-2 py-2 rounded-md shadow mt-3 w-[270px]">
						<button
							class="w-full bg-gray-300 hover:bg-gray-400 rounded-md py-2 font-semibold"
							@click="showIcsCalendarDropdown = !showIcsCalendarDropdown"
						>
							{{
								showIcsCalendarDropdown
									? "Skryť ICS Kalendáre"
									: "Zobraziť ICS Kalendáre"
							}}
						</button>

						<div class="flex items-center justify-between px-2 mt-2">
							<span class="text-sm font-medium text-gray-700"
								>Farba ICS udalostí</span
							>
							<input
								type="color"
								v-model="icsGlobalColor"
								class="w-10 h-8 cursor-pointer border rounded"
							/>
						</div>

						<transition name="fade">
							<div v-if="showIcsCalendarDropdown" class="mt-3">
								<!-- <div
									v-for="calendar in availableIcsCalendars"
									:key="calendar"
									@click="toggleIcsCalendar(calendar)"
									class="w-full rounded-md py-2 px-2 cursor-pointer transition-colors mb-2 text-center font-medium"
									:style="
										selectedIcsCalendars.includes(calendar)
											? {
													backgroundColor: getIcsCalendarColor(calendar),
													color: 'white',
												}
											: {}
									"
									:class="
										selectedIcsCalendars.includes(calendar)
											? ''
											: 'bg-gray-200 hover:bg-slate-100'
									"
								>
									{{ calendar }}
								</div> -->

								<div
									v-for="calendar in availableIcsCalendars"
									:key="calendar"
									class="mb-2"
								>
									<div
										@click="toggleIcsCalendar(calendar)"
										class="w-full rounded-md py-2 px-2 cursor-pointer transition-colors text-center font-medium"
										:style="
											selectedIcsCalendars.includes(calendar)
												? {
														backgroundColor: getIcsCalendarColor(calendar),
														color: 'white',
													}
												: {}
										"
										:class="
											selectedIcsCalendars.includes(calendar)
												? ''
												: 'bg-gray-200 hover:bg-slate-100'
										"
									>
										{{ calendar }}
									</div>
								</div>
							</div>
						</transition>
					</div>
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
							<div v-if="showActivityTitle" class="event-title">
								{{ arg.event.title }}
							</div>
							<div
								v-if="
									showContactNames &&
									(arg.event.extendedProps.firstName ||
										arg.event.extendedProps.lastName)
								"
								class="event-contact"
							>
								{{ arg.event.extendedProps.firstName }}
								{{ arg.event.extendedProps.lastName }}
							</div>
						</div>
					</template>
				</FullCalendar>
			</div>
		</div>
	</div>
</template>

<style lang="css">
.event-contact {
	font-size: 0.75em;
	opacity: 0.85;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-top: 1px;
}

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
	font-family:
		Arial,
		Helvetica Neue,
		Helvetica,
		sans-serif;
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
	width: calc(100% - 300px);
	display: flex;
	justify-content: center;
}

.fc {
	max-width: none;
	width: 100%;
	margin: 0;
}

.demo-app-calendar {
	width: 100%;
}

.fc-view-harness {
	width: 100% !important;
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

.fade-enter-active,
.fade-leave-active {
	transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	max-height: 0;
	transform: translateY(-10px);
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
	max-height: 500px;
	transform: translateY(0);
}
</style>
