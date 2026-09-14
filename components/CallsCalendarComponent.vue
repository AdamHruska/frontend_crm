<script setup>
import { Icon } from "@iconify/vue";
import { ref, onMounted, computed, watch } from "vue";
import { useCalendarstore } from "#imports";
import { useUserStore } from "#imports";
import { useContactsStore } from "#imports";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import axios from "axios";

import FullCalendar from "@fullcalendar/vue3";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const calendarStore = useCalendarstore();
const userStore = useUserStore();
const contactsStore = useContactsStore();
const authStore = useAuthStore();
authStore.loadToken();
const config = useRuntimeConfig();

const rawData = ref([]);
const events = ref([]);
const microsoftEvents = ref([]);
const icsEvents = ref([]); // ← nové
const contactMap = ref(new Map()); // contact_id -> contact
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
	contactId: {
		type: [String, Number],
		default: null,
	},
});

const fetchIcsEventsForComponent = async () => {
	try {
		const icsData = await calendarStore.fetchAndCacheIcsEvents(
			config.public.apiUrl,
			authStore.token,
			userStore.user?.id,
		);
		icsEvents.value = icsData;
		updateCalendarEvents();
	} catch (error) {
		console.error("Error fetching ICS events:", error);
	}
};

watch(
	() => props.date,
	(newDate) => {
		if (newDate && calendarApi.value) {
			calendarApi.value.gotoDate(newDate);
			const dateObj = new Date(newDate);
			fetchMicrosoftEvents(dateObj.getMonth() + 1, dateObj.getFullYear());
		}
	},
);

const emit = defineEmits([
	"updateDate",
	"timeClicked",
	"activityAdded",
	"slotClicked",
	"eventClicked",
]);

const calendarRef = ref(null);
const calendarApi = computed(() => calendarRef.value?.getApi?.() ?? null);

// ── Tooltip state ─────────────────────────────────────────────────────────
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipData = ref({});

const showEventTooltip = (info) => {
	const ep = info.event.extendedProps;
	if (ep.source === "microsoft" || ep.source === "ics") {
		tooltipData.value = { title: info.event.title, miesto: ep.miesto || "", location: ep.location || "" };
	} else {
		let { meno, priezvisko, cislo } = ep;
		// Fallback: look up contact from map if missing
		const lookupId = Number(ep.contact_id);
		if ((!meno || meno === "") && lookupId && contactMap.value.has(lookupId)) {
			const c = contactMap.value.get(lookupId);
			meno = c.meno || "";
			priezvisko = c.priezvisko || "";
			cislo = cislo || c.cislo || "";
		}
		tooltipData.value = {
			title: info.event.title,
			meno: meno || "",
			priezvisko: priezvisko || "",
			miesto: ep.miesto || "",
			cislo: cislo || "",
		};
	}
	tooltipX.value = info.jsEvent.clientX;
	tooltipY.value = info.jsEvent.clientY - 10;
	tooltipVisible.value = true;
};

const hideEventTooltip = () => {
	tooltipVisible.value = false;
};

const calendarOptions = ref({
	plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
	headerToolbar: {
		left: "prev,next today",
		center: "title",
		right: "timeGridDay,timeGridWeek",
	},
	initialView: "timeGridWeek",
	initialDate: props.date,
	slotMinTime: "06:00:00",
	slotMaxTime: "23:00:00",
	scrollTime: "08:00:00",
	height: "100%",
	events: [],
	editable: false,
	selectable: true,
	selectMirror: true,
	dayMaxEvents: true,
	select: handleDateSelect,
	eventClick: handleEventClick,
	dateClick: handleTimeClick,
	eventMouseEnter: showEventTooltip,
	eventMouseLeave: hideEventTooltip,
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

		const yearStr = currentDate.getFullYear();
		const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
		const dayStr = String(currentDate.getDate()).padStart(2, "0");
		const formattedDate = `${yearStr}-${monthStr}-${dayStr}`;

		emit("updateDate", formattedDate);

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
		if (info.event.extendedProps.source === "microsoft") {
			info.el.style.opacity = "0.85";
			info.el.style.borderLeft = "3px solid #6b46c1";
		}
	},
	eventContent: (arg) => {
		return {
			html: `
				<div class="calls-cal-event">
					<span class="calls-cal-time">${arg.timeText}</span>
					<span class="calls-cal-title">${arg.event.title}</span>
				</div>
			`,
		};
	},
});

const fetchMicrosoftEvents = async (month, year) => {
	try {
		const microsoftEventsData = await calendarStore.fetchMicrosoftEvents(
			month,
			year,
		);
		microsoftEvents.value = microsoftEventsData.map((e) => ({
			...e,
			user_id: e.user_id ?? userStore.user?.id,
		}));
		updateCalendarEvents();
	} catch (error) {
		console.error("Error fetching Microsoft events:", error);
	}
};

const enrichContact = (item) => {
	// If activity already has contact info, use it; otherwise look up from contactMap
	const cid = Number(item.contact_id || item.id_contact);
	if ((!item.meno || item.meno === "") && cid && contactMap.value.has(cid)) {
		const c = contactMap.value.get(cid);
		return {
			meno: c.meno || "",
			priezvisko: c.priezvisko || "",
			cislo: c.cislo || "",
			kontakt: `${c.meno || ""} ${c.priezvisko || ""}`.trim(),
		};
	}
	return {
		meno: item.meno || "",
		priezvisko: item.priezvisko || "",
		cislo: item.cislo || "",
		kontakt: item.kontakt || "",
	};
};

const transformData = (data) => {
	return data.map((item) => {
		const farba =
			item.created_id == userStore.user?.id ? "rgb(37 99 235)" : "#e879f9";
		const contact = enrichContact(item);
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
				miesto: item.miesto_stretnutia || "",
				meno: contact.meno,
				priezvisko: contact.priezvisko,
				kontakt: contact.kontakt,
				cislo: contact.cislo,
				contact_id: item.contact_id || item.id_contact || null,
			},
		};
	});
};

const updateCalendarEvents = () => {
	const allEvents = [
		...events.value,
		...microsoftEvents.value,
		...icsEvents.value,
	];
	calendarOptions.value = {
		...calendarOptions.value,
		events: allEvents,
	};
};

const loadContactsMap = async () => {
	try {
		await contactsStore.fetchAllContacts();
		const ownContacts = contactsStore.allContacts || [];

		// Also fetch shared contacts (same approach as eventUpdateCalendarSecond.vue)
		let allContacts = [...ownContacts];
		const ownIds = new Set(ownContacts.map((c) => Number(c.id)));
		try {
			const sharedRes = await axios.get(
				`${config.public.apiUrl}contacts-without-pagination`,
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			const sharedContacts = sharedRes.data.contacts || [];
			for (const c of sharedContacts) {
				if (!ownIds.has(Number(c.id))) allContacts.push(c);
			}
		} catch {
			// Shared contacts not available, continue with own contacts only
		}

		const map = new Map();
		allContacts.forEach((c) => {
			map.set(Number(c.id), c);
		});
		contactMap.value = map;
	} catch (e) {
		console.error("Error loading contacts map:", e);
	}
};

onMounted(async () => {
	await Promise.all([userStore.fetchUser(), loadContactsMap()]);

	if (calendarStore.activities.length === 0) {
		await calendarStore.fetchActivities();
	}

	rawData.value = calendarStore.activities;
	events.value = transformData(rawData.value);

	const flatShared = Object.values(calendarStore.shared_activities).flat();
	if (flatShared.length > 0) {
		events.value = [...events.value, ...transformData(flatShared)];
	}

	const selectedDate = new Date(props.date);
	await fetchMicrosoftEvents(
		selectedDate.getMonth() + 1,
		selectedDate.getFullYear(),
	);

	await fetchIcsEventsForComponent(); // ← nové

	updateCalendarEvents();
});
function handleDateSelect(selectInfo) {
	end_date.value = selectInfo.startStr;
	const datePart = selectInfo.startStr.substring(0, 10);
	const timePart = selectInfo.startStr.substring(11, 16) || "09:00";
	emit("timeClicked", timePart);
	emit("updateDate", datePart);
	emit("slotClicked", `${datePart}T${timePart}`);
	selectInfo.view.calendar.unselect();
}

function handleEventClick(clickInfo) {
	const ep = clickInfo.event.extendedProps;
	emit('eventClicked', {
		id: clickInfo.event.id,
		source: ep.source || 'local',
	});
}

const addNewEvent = (newEvent) => {
	rawData.value.push(newEvent);

	if (!calendarStore.activities.find((a) => a.id === newEvent.id)) {
		calendarStore.activities.push(newEvent);
	}

	const contact = enrichContact(newEvent);
	const transformed = {
		id: newEvent.id,
		title: newEvent.aktivita,
		start: newEvent.datumCas.replace(" ", "T"),
		end: newEvent.koniec,
		backgroundColor:
			newEvent.created_id === userStore.user?.id ? "rgb(37 99 235)" : "#e879f9",
		borderColor:
			newEvent.created_id === userStore.user?.id ? "rgb(37 99 235)" : "#e879f9",
		user_id: newEvent.created_id,
		extendedProps: {
			source: "local",
			meno: contact.meno,
			priezvisko: contact.priezvisko,
			cislo: contact.cislo,
			kontakt: contact.kontakt,
			contact_id: newEvent.contact_id || null,
		},
	};
	events.value = [...events.value, transformed];
	updateCalendarEvents();
};

function handleTimeClick(info) {
	const clickedDate = info.date;
	const year = clickedDate.getFullYear();
	const month = String(clickedDate.getMonth() + 1).padStart(2, "0");
	const day = String(clickedDate.getDate()).padStart(2, "0");
	const hours = String(clickedDate.getHours()).padStart(2, "0");
	const minutes = String(clickedDate.getMinutes()).padStart(2, "0");

	const dateStr = `${year}-${month}-${day}`;
	const timeStr = `${hours}:${minutes}`;
	const fullDateTime = `${dateStr}T${timeStr}`;

	emit("timeClicked", timeStr);
	emit("updateDate", dateStr);
	emit("slotClicked", fullDateTime); // ← new emit

	info.jsEvent.preventDefault();
	info.jsEvent.stopPropagation();
}

defineExpose({ addNewEvent });
</script>

<template>
	<div class="calls-calendar-wrap">
		<FullCalendar
			ref="calendarRef"
			class="calls-fc"
			:options="calendarOptions"
		/>
		<!-- Hover tooltip -->
		<div
			v-if="tooltipVisible"
			class="cal-tooltip"
			:style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
			>
			<div v-if="tooltipData.meno" class="cal-tooltip-contact">
				<strong>{{ tooltipData.meno }} {{ tooltipData.priezvisko }}</strong>
			</div>
			<div v-if="tooltipData.title" class="cal-tooltip-title">{{ tooltipData.title }}</div>
			<div v-if="tooltipData.miesto" class="cal-tooltip-miesto">📍 {{ tooltipData.miesto }}</div>
			<div v-if="tooltipData.cislo" class="cal-tooltip-cislo">📞 {{ tooltipData.cislo }}</div>
			<div v-if="tooltipData.location && !tooltipData.miesto" class="cal-tooltip-miesto">📍 {{ tooltipData.location }}</div>
		</div>
	</div>
</template>

<style scoped>
.calls-calendar-wrap {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding: 8px;
	box-sizing: border-box;
}

.calls-fc {
	flex: 1;
	min-height: 0;
	height: 100%;
}

:deep(.fc) {
	height: 100% !important;
	font-size: 0.8rem;
}

:deep(.fc-toolbar) {
	padding: 6px 8px !important;
	margin-bottom: 4px !important;
}

:deep(.fc-toolbar-title) {
	font-size: 0.9rem !important;
	font-weight: 700;
}

:deep(.fc-button) {
	padding: 3px 8px !important;
	font-size: 0.75rem !important;
	background-color: #6366f1 !important;
	border-color: #6366f1 !important;
	color: white !important;
}

:deep(.fc-button:hover) {
	background-color: #4f46e5 !important;
	border-color: #4f46e5 !important;
}

:deep(.fc-button-active) {
	background-color: #4338ca !important;
	border-color: #4338ca !important;
}

:deep(.fc-today-button) {
	background-color: #921337 !important;
	border-color: #921337 !important;
}

:deep(.fc-today-button:hover) {
	background-color: #cc1d4d !important;
	border-color: #cc1d4d !important;
}

:deep(.fc-col-header-cell) {
	font-size: 0.75rem;
	font-weight: 600;
	padding: 4px 0;
}

:deep(.fc-timegrid-slot-label) {
	font-size: 0.7rem;
	color: #64748b;
}

:deep(.fc-event) {
	border-radius: 4px;
	font-size: 0.72rem;
	cursor: pointer;
}

:deep(.fc-daygrid-day-number) {
	font-size: 0.75rem;
}

:deep(.fc-scrollgrid) {
	border-color: #e2e8f0 !important;
}

:deep(.fc-scrollgrid td),
:deep(.fc-scrollgrid th) {
	border-color: #e2e8f0 !important;
}

:deep(.fc-timegrid-now-indicator-line) {
	border-color: #ef4444 !important;
	border-width: 2px !important;
}

:deep(.fc-timegrid-now-indicator-arrow) {
	border-color: #ef4444 !important;
}

:deep(.fc-highlight) {
	background: #eef2ff !important;
}

.calls-cal-event {
	display: flex;
	flex-direction: column;
	padding: 1px 3px;
	overflow: hidden;
	height: 100%;
}
.calls-cal-time {
	font-size: 0.65rem;
	opacity: 0.85;
	white-space: nowrap;
}
.calls-cal-title {
	font-size: 0.72rem;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* ── Hover tooltip ── */
.cal-tooltip {
	position: fixed;
	z-index: 9999;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 10px 14px;
	box-shadow: 0 4px 16px rgba(0,0,0,0.15);
	pointer-events: none;
	max-width: 260px;
	font-size: 0.8rem;
	line-height: 1.4;
	transform: translate(-50%, -100%);
}
.cal-tooltip-contact {
	font-size: 0.85rem;
	margin-bottom: 4px;
}
.cal-tooltip-title {
	color: #6366f1;
	font-weight: 600;
	margin-bottom: 2px;
}
.cal-tooltip-miesto {
	color: #059669;
	font-size: 0.78rem;
}
.cal-tooltip-cislo {
	color: #64748b;
	font-size: 0.78rem;
}
</style>
