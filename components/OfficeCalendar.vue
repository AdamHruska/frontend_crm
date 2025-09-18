<script setup>
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useOfficeStore } from "~/stores/officeStore";

const officeStore = useOfficeStore();

const props = defineProps({
	options: {
		type: Object,
		default: () => ({}),
	},
});

// form states
const selectedDate = ref(null);
const selectedEvent = ref(null);

const defaultOptions = {
	plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
	headerToolbar: {
		left: "prev,next today",
		center: "title",
		right: "dayGridMonth,timeGridWeek,timeGridDay",
	},
	initialView: "timeGridWeek",
	slotMinTime: "05:00:00",
	slotMaxTime: "24:00:00",
	scrollTime: "08:00:00",
	editable: true,
	selectable: true,
	selectMirror: true,
	dayMaxEvents: 1,
	weekends: true,
	allDaySlot: true,
	allDayText: "Celý deň",
	nowIndicator: true,
	contentHeight: "auto",
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

	// clicking on empty date slot
	dateClick: (info) => {
		selectedEvent.value = null; // reset editing mode
		selectedDate.value = info.dateStr;
	},

	// clicking on an event
	eventClick: (info) => {
		info.jsEvent.preventDefault(); // prevent navigation if event has url
		selectedDate.value = null; // reset new-date mode
		selectedEvent.value = {
			id: info.event.id,
			title: info.event.title,
			start: info.event.start,
			end: info.event.end,
			...info.event.extendedProps,
		};
	},
};

const calendarEvents = computed(() =>
	officeStore.officeActivities.map((activity) => ({
		id: activity.id,
		title: activity.aktivita,
		start: activity.datum_cas,
		end: activity.koniec,
		created_at: activity.created_at,
		extendedProps: {
			poznamka: activity.poznamka,
			office_id: activity.office_id,
			owner: activity.owner_name,
			owner_number: activity.owner_number,
		},
	}))
);

const mergedOptions = computed(() => {
	return {
		...defaultOptions,
		...props.options,
		events: [...calendarEvents.value],
	};
});

const closeForm = () => {
	selectedDate.value = null;
	selectedEvent.value = null;
};
</script>

<template>
	<!-- new event form -->
	<OfficeEventForm
		v-if="selectedDate"
		:startDate="selectedDate"
		@closeForm="closeForm"
	/>

	<!-- edit event form -->
	<OfficeEventForm
		v-if="selectedEvent"
		:eventData="selectedEvent"
		@closeForm="closeForm"
	/>

	<FullCalendar :options="mergedOptions">
		<template #eventContent="arg">
			<div class="event-content-wrapper">
				<div class="event-time">
					<b>{{ arg.timeText }}</b>
				</div>
				<div class="event-title">{{ arg.event.title }}</div>
				<div class="event-owner text-xs text-gray-600">
					{{ arg.event.extendedProps.owner }}
				</div>
			</div>
		</template>
	</FullCalendar>
</template>
