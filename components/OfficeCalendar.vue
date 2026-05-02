<script setup>
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useOfficeStore } from "~/stores/officeStore";
import { useUserStore } from "#imports";

const officeStore = useOfficeStore();
const userStore = useUserStore();

const props = defineProps({
	options: {
		type: Object,
		default: () => ({}),
	},
	ownerId: {
		type: [Number, String, null],
		default: null,
	},
});

// form states
const selectedDate = ref(null);
const selectedEvent = ref(null);
const currentDate = ref(new Date()); // Track current month/year

onMounted(async () => {
	if (!userStore.user) {
		await userStore.fetchUser();
	}
	console.log("User fetched:", userStore.user);
});

// Get current month start and end dates
const getCurrentMonthRange = () => {
	const year = currentDate.value.getFullYear();
	const month = currentDate.value.getMonth();

	const startOfMonth = new Date(year, month, 1);
	startOfMonth.setHours(0, 0, 0, 0);

	const endOfMonth = new Date(year, month + 1, 0);
	endOfMonth.setHours(23, 59, 59, 999);

	return { startOfMonth, endOfMonth };
};

// Computed stats based on office activities for current month only
const activityStats = computed(() => {
	const activities = officeStore.officeActivities || [];
	const { startOfMonth, endOfMonth } = getCurrentMonthRange();

	// Filter activities for current month
	const currentMonthActivities = activities.filter((activity) => {
		const activityDate = new Date(activity.datum_cas);
		return activityDate >= startOfMonth && activityDate <= endOfMonth;
	});

	const total = currentMonthActivities.length;
	const check = currentMonthActivities.filter(
		(a) => a.activity_status === "check" || a.activity_status === "accepted",
	).length;
	const discarded = currentMonthActivities.filter(
		(a) => a.activity_status === "discarded",
	).length;
	const questionmark = currentMonthActivities.filter(
		(a) => a.activity_status === "questionmark",
	).length;

	return {
		total,
		check,
		discarded,
		questionmark,
	};
});

// Format month name in Slovak
const currentMonthName = computed(() => {
	return currentDate.value.toLocaleString("sk", {
		month: "long",
		year: "numeric",
	});
});

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

	// Event class names based on status
	eventClassNames: (arg) => {
		const status = arg.event.extendedProps.activity_status;
		if (status === "discarded") {
			return ["discarded-event"];
		}
		if (status === "check" || status === "accepted") {
			return ["completed-event"];
		}
		if (status === "questionmark") {
			return ["pending-event"];
		}
		return [];
	},

	// Track calendar date changes to update stats
	datesSet: (info) => {
		// Update current date based on calendar view
		if (info.view.type === "dayGridMonth") {
			currentDate.value = info.view.currentStart;
		} else {
			// For week/day views, get the month from the visible date
			currentDate.value = new Date(info.view.currentStart);
		}
	},

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
			activity_status: activity.activity_status,
		},
	})),
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
	<!-- Statistics Section -->
	<div
		class="stats-container mb-6 p-4 bg-white rounded-lg shadow-md"
		v-if="props.ownerId == userStore.user?.id"
	>
		<div class="flex justify-between items-center mb-3">
			<h3 class="text-lg font-semibold">Štatistiky aktivít</h3>
			<span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
				{{ currentMonthName }}
			</span>
		</div>

		<div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card bg-blue-50 p-3 rounded-lg border border-blue-200">
				<div class="stat-label text-sm text-gray-600">Celkom aktivít</div>
				<div class="stat-value text-2xl font-bold text-blue-600">
					{{ activityStats.total }}
				</div>
			</div>

			<div class="stat-card bg-green-50 p-3 rounded-lg border border-green-200">
				<div class="stat-label text-sm text-gray-600">Dokončené ✅</div>
				<div class="stat-value text-2xl font-bold text-green-600">
					{{ activityStats.check }}
				</div>
				<div class="stat-percentage text-xs text-gray-500">
					{{
						activityStats.total
							? Math.round((activityStats.check / activityStats.total) * 100)
							: 0
					}}%
				</div>
			</div>

			<div class="stat-card bg-gray-50 p-3 rounded-lg border border-gray-200">
				<div class="stat-label text-sm text-gray-600">Zamietnuté ❌</div>
				<div class="stat-value text-2xl font-bold text-gray-600">
					{{ activityStats.discarded }}
				</div>
				<div class="stat-percentage text-xs text-gray-500">
					{{
						activityStats.total
							? Math.round(
									(activityStats.discarded / activityStats.total) * 100,
								)
							: 0
					}}%
				</div>
			</div>

			<div
				class="stat-card bg-yellow-50 p-3 rounded-lg border border-yellow-200"
			>
				<div class="stat-label text-sm text-gray-600">Čakajúce ❓</div>
				<div class="stat-value text-2xl font-bold text-yellow-600">
					{{ activityStats.questionmark }}
				</div>
				<div class="stat-percentage text-xs text-gray-500">
					{{
						activityStats.total
							? Math.round(
									(activityStats.questionmark / activityStats.total) * 100,
								)
							: 0
					}}%
				</div>
			</div>
		</div>

		<!-- Progress bar for completion rate -->
		<div v-if="activityStats.total > 0" class="mt-4">
			<div class="flex justify-between text-xs text-gray-600 mb-1">
				<span>Miera dokončenia</span>
				<span
					>{{
						Math.round((activityStats.check / activityStats.total) * 100)
					}}%</span
				>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2">
				<div
					class="bg-green-500 rounded-full h-2 transition-all duration-300"
					:style="{
						width: `${(activityStats.check / activityStats.total) * 100}%`,
					}"
				></div>
			</div>
		</div>
	</div>

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

<style scoped>
.stats-container {
	border: 1px solid #e5e7eb;
}

.stat-card {
	transition: all 0.2s ease;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Discarded events - grey background */
:deep(.discarded-event) {
	background-color: #9ca3af !important;
	border-color: #6b7280 !important;
	opacity: 0.75;
}

:deep(.discarded-event .fc-event-title) {
	text-decoration: line-through;
}

/* Completed events - green background */
:deep(.completed-event) {
	background-color: #10b981 !important;
	border-color: #059669 !important;
}

/* Pending events - yellow background */
:deep(.pending-event) {
	background-color: #f59e0b !important;
	border-color: #d97706 !important;
}

/* Optional: Add hover effects */
:deep(.discarded-event:hover) {
	background-color: #6b7280 !important;
	opacity: 0.9;
}

:deep(.completed-event:hover) {
	background-color: #059669 !important;
}

:deep(.pending-event:hover) {
	background-color: #d97706 !important;
}

.event-content-wrapper {
	padding: 2px 4px;
	overflow: hidden;
}

.event-time {
	font-size: 0.75rem;
	font-weight: bold;
}

.event-title {
	font-size: 0.875rem;
	white-space: normal;
	word-wrap: break-word;
}

.event-owner {
	font-size: 0.7rem;
	color: #f3f4f6;
	margin-top: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.stat-value {
		font-size: 1.5rem;
	}
}
</style>
