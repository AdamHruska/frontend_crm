<script setup>
import axios from "axios";
const config = useRuntimeConfig();

import { useTodosStore } from "../stores/todoStore";
const todoStore = useTodosStore();

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();

import { useContactsStore } from "#imports";
const contactsStore = useContactsStore();

import { useToast } from "vue-toastification";
const toast = useToast();

const activeGroup = ref("today");

const todoItems = ref([]);

const yesterDayUncompletedActivities = ref([]);

const allUncompletedActivities = ref([]);
const showingAllUncompletedActivities = ref(false);

// Add current date state for pagination
const currentDate = ref(new Date());

// Add state to track if showing all todos
const showingAllTodos = ref(false);

// Add state to track if showing todos without contact
const showingTodosWithoutContact = ref(false);

const contactNames = reactive({});

const newTodo = ref({
	activity: "",
	dueDate: "",
	assignedTo: "",
	completed: false,
	updated_at: "",
});

const showAllUncompletedActivities = async () => {
	activeGroup.value = "allUncompleted";
	showingAllUncompletedActivities.value = true;
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;

	const response = await axios.get(
		`${config.public.apiUrl}get-all-uncompleted-activities`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		},
	);

	allUncompletedActivities.value = response.data.activities;
};

const loadContactName = async (contactId) => {
	if (!contactId || contactNames[contactId]) return;
	contactNames[contactId] = "Načítava...";
	try {
		const contact = await contactsStore.findContactById(contactId);
		const name = contact?.meno + " " + contact?.priezvisko;
		contactNames[contactId] = name ? name.trim() : "Neznámy kontakt";
	} catch (error) {
		contactNames[contactId] = "Neznámy kontakt";
	}
};

const formatCurrentDate = (date) => {
	return date.toLocaleDateString("sk-SK", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

const goToPreviousDay = async () => {
	const newDate = new Date(currentDate.value);
	newDate.setDate(newDate.getDate() - 1);
	currentDate.value = newDate;
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	activeGroup.value = "today";
	await loadTodosForCurrentDate();
};

const goToNextDay = async () => {
	const newDate = new Date(currentDate.value);
	newDate.setDate(newDate.getDate() + 1);
	currentDate.value = newDate;
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	activeGroup.value = "today";
	await loadTodosForCurrentDate();
};

const goToToday = async () => {
	currentDate.value = new Date();
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	activeGroup.value = "today";
	await loadTodosForCurrentDate();
};

const showAllTodos = async () => {
	activeGroup.value = "all";
	showingAllTodos.value = true;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	await todoStore.fetchTodos();
	todoItems.value = todoStore.todos.map((todo, index) => ({
		id: todo.id || index,
		activity: todo.activity_name,
		dueDate: todo.due_date,
		assignedTo: todo.contact_id,
		contact_name: todo.contact_name,
		completed: todo.is_completed,
		updated_at: todo.is_completed ? todo.updated_at : null,
	}));
};

const showTodosWithoutContact = async () => {
	activeGroup.value = "withoutContact";
	showingTodosWithoutContact.value = true;
	showingAllTodos.value = false;
	showingAllUncompletedActivities.value = false;
	const response = await axios.get(`${config.public.apiUrl}contact1`, {
		headers: { Authorization: `Bearer ${authStore.token}` },
	});
	todoItems.value = response.data.data.map((todo) => ({
		id: todo.id,
		activity: todo.activity_name,
		dueDate: todo.due_date,
		assignedTo: todo.contact_id,
		contact_name: todo.contact_name,
		completed: todo.is_completed,
		updated_at: todo.is_completed ? todo.updated_at : null,
	}));
};

const loadTodosForCurrentDate = async () => {
	const year = currentDate.value.getFullYear();
	const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");
	const day = String(currentDate.value.getDate()).padStart(2, "0");
	const selectedDate = `${year}-${month}-${day}`;

	await todoStore.fetchTodosByDate(selectedDate);

	todoItems.value = todoStore.todosByDate.map((todo, index) => ({
		id: todo.id || index,
		activity: todo.activity_name,
		dueDate: todo.due_date,
		assignedTo: todo.contact_id,
		contact_name: todo.contact_name,
		completed: todo.is_completed,
		updated_at: todo.is_completed ? todo.updated_at : null,
	}));
};

const isToday = computed(() => {
	const today = new Date();
	return currentDate.value.toDateString() === today.toDateString();
});

watch(
	() => todoStore.todos,
	(newTodos) => {
		todoItems.value = newTodos.map((todo, index) => ({
			id: todo.id || index,
			activity: todo.activity_name,
			dueDate: todo.due_date,
			completed: todo.is_completed,
			updated_at: todo.is_completed ? todo.updated_at : null,
			contact_name: todo.contact_name,
		}));
	},
	{ deep: true, immediate: true },
);

onMounted(async () => {
	newTodo.value.dueDate = getNowForDatetimeLocal();
	if (contactsStore.contacts.length === 0) {
		await contactsStore.fetchContacts();
	}
	if (contactsStore.allContacts.length === 0) {
		await contactsStore.fetchAllContacts();
	}

	const yesterDay = await axios.get(
		`${config.public.apiUrl}get-yesterday-uncompleted-activities`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		},
	);

	yesterDayUncompletedActivities.value = yesterDay.data.activities;
	yesterDayUncompletedActivities.value =
		yesterDayUncompletedActivities.value.map((activity) => {
			const contact = contactsStore.allContacts.find(
				(contact) => contact.id === activity.contact_id,
			);
			if (contact) {
				return {
					...activity,
					meno: contact.meno,
					priezvisko: contact.priezvisko,
				};
			}
			return activity;
		});

	activeGroup.value = "today";
	await loadTodosForCurrentDate();
});

const columns = [
	{ key: "dueDate", label: "Termín dokončenia" },
	{ key: "activity", label: "Aktivita" },
	{ key: "assignedTo", label: "Priradené k" },
	{ key: "completed", label: "Dokončené" },
	{ key: "updated_at", label: "Dokonané dňa" },
	{ key: "actions", label: "Akcie" },
];

const columns_yesterday = [
	{ key: "aktivita", label: "Aktivita" },
	{ key: "datumCas", label: "Plánovaná" },
	{ label: "Meno a priezvisko" },
	{ key: "poznamka", label: "Poznámka" },
	{ key: "activity_status", label: "Status aktivity" },
];

watch(
	() => newTodo.value.dueDate,
	async (value) => {
		if (!value) return;

		currentDate.value = new Date(value);

		showingAllTodos.value = false;
		showingTodosWithoutContact.value = false;
		showingAllUncompletedActivities.value = false;
		activeGroup.value = "today";

		await loadTodosForCurrentDate();
	},
);

const formatDateTime = (dateTimeString) => {
	if (!dateTimeString) return "";
	const date = new Date(dateTimeString);
	return date.toLocaleString("sk-SK", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatDate = (dateString) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("sk-SK");
};

const addTodoWithoutContact = async () => {
	if (newTodo.value.activity && newTodo.value.dueDate) {
		const todoData = {
			activity_name: newTodo.value.activity,
			due_date: newTodo.value.dueDate,
		};
		try {
			await todoStore.createTodoWithoutContact(todoData);
			newTodo.value = {
				activity: "",
				dueDate: "",
				assignedTo: "",
				completed: false,
			};
		} catch (error) {
			console.error("Error creating todo without contact:", error);
		}
	}
};

const selectedItem = ref(null);
const showUpdateForm = ref(false);
const toggleUpdateForm = (item) => {
	selectedItem.value = item;
	showUpdateForm.value = !showUpdateForm.value;
};

const deleteToDo = async (id) => {
	await todoStore.deleteTodo(id);
	todoItems.value = todoItems.value.filter((item) => item.id !== id);
};

const router = useRouter();
const goToContact = (id) => {
	if (id && id !== 1) {
		router.push(`/contact/${id}`);
	}
};

const markAsDone = async (id) => {
	const todo = todoItems.value.find((item) => item.id === id);
	if (!todo) return;
	const newCompletionStatus = !todo.completed;
	await todoStore.updateTodo(id, {
		activity_name: todo.activity,
		due_date: todo.dueDate,
		is_completed: newCompletionStatus,
	});
	switch (activeGroup.value) {
		case "all":
			await showAllTodos();
			break;
		case "withoutContact":
			await showTodosWithoutContact();
			break;
		case "past":
			await showPastUncompletedTodos();
			break;
		case "future":
			await showFutureUncompletedTodos();
			break;
		default:
			await loadTodosForCurrentDate();
			break;
	}
};

const resetDate = async () => {
	newTodo.value.dueDate = "";
	currentDate.value = new Date();
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	await todoStore.fetchTodos();
	todoItems.value = todoStore.todos.map((todo, index) => ({
		id: todo.id || index,
		activity: todo.activity_name,
		dueDate: todo.due_date,
		completed: todo.is_completed,
		assignedTo: todo.contact_id,
		updated_at: todo.updated_at,
	}));
};

const pendingFirstMeetingRow = ref(null);
const showConfirmEvent = ref(false);
const changeConfirmEventModal = () => {
	showConfirmEvent.value = !showConfirmEvent.value;
};

const currentActivity = ref(null);
const showDiscardActivityModal = ref(false);
const changeDiscardActivityModal = () => {
	showDiscardActivityModal.value = !showDiscardActivityModal.value;
};

const selectedActivtyId = ref(null);
const showNewNamesModal = ref(false);
const newNamesModalContactId = ref(null);
const changeNewNamesModal = (contactId = null) => {
	showNewNamesModal.value = !showNewNamesModal.value;
	if (contactId !== null) {
		newNamesModalContactId.value = contactId;
	}
};

const changeActivityStatus = async (
	item,
	status,
	isFromAllUncompleted = false,
) => {
	if (item.aktivita === "Prvé stretnutie" && status === "check") {
		// Check if a non-discarded Analýza already exists for this contact
		const activitiesForContact = isFromAllUncompleted
			? allUncompletedActivities.value
			: yesterDayUncompletedActivities.value;

		// Also check across both lists combined
		const allLoaded = [
			...yesterDayUncompletedActivities.value,
			...allUncompletedActivities.value,
		];

		const alreadyHasAnalyza = allLoaded.some(
			(a) =>
				a.contact_id === item.contact_id &&
				a.aktivita === "Analýza osobných financí" &&
				a.activity_status !== "discarded",
		);

		if (!alreadyHasAnalyza) {
			// Also check via API since the Analýza might not be in our local lists
			try {
				const response = await axios.get(
					`${config.public.apiUrl}contacts/${item.contact_id}/activities`,
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);
				const contactActivities = response.data.activities ?? [];
				const hasAnalyzaInDb = contactActivities.some(
					(a) =>
						a.aktivita === "Analýza osobných financí" &&
						a.activity_status !== "discarded",
				);

				if (!hasAnalyzaInDb) {
					changeConfirmEventModal();
					pendingFirstMeetingRow.value = item;
					return;
				}
				// Has Analýza in DB — skip modal, fall through
			} catch (err) {
				console.error("Error checking for existing Analýza:", err);
				// On error, be safe and show the modal
				changeConfirmEventModal();
				pendingFirstMeetingRow.value = item;
				return;
			}
		}
		// Already has a non-discarded Analýza in local lists — skip modal, fall through
	}

	if (item.aktivita === "Analýza osobných financí" && status === "check") {
		selectedActivtyId.value = item.id;
		changeNewNamesModal(item.contact_id);
	}

	if (status === "discarded") {
		currentActivity.value = item;
		changeDiscardActivityModal();
	}

	try {
		await axios.patch(
			`${config.public.apiUrl}activities/${item.id}/status`,
			{ activity_status: status },
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		if (isFromAllUncompleted) {
			allUncompletedActivities.value = allUncompletedActivities.value.filter(
				(activity) => activity.id !== item.id,
			);
		} else {
			yesterDayUncompletedActivities.value =
				yesterDayUncompletedActivities.value.filter(
					(activity) => activity.id !== item.id,
				);
		}
		toast.success("Status aktivity bol úspešne aktualizovaný!");
	} catch (error) {
		console.error("Error updating activity status:", error);
	}
};

// // Unified handler for status changes — works for BOTH tables
// const changeActivityStatus = async (
// 	item,
// 	status,
// 	isFromAllUncompleted = false,
// ) => {
// 	if (item.aktivita === "Prvé stretnutie" && status === "check") {
// 		changeConfirmEventModal();
// 		pendingFirstMeetingRow.value = item;
// 	}
// 	if (item.aktivita === "Analýza osobných financí" && status === "check") {
// 		selectedActivtyId.value = item.id;
// 		changeNewNamesModal(item.contact_id);
// 	}
// 	if (status === "discarded") {
// 		currentActivity.value = item;
// 		changeDiscardActivityModal();
// 	}
// 	try {
// 		await axios.patch(
// 			`${config.public.apiUrl}activities/${item.id}/status`,
// 			{ activity_status: status },
// 			{ headers: { Authorization: `Bearer ${authStore.token}` } },
// 		);

// 		if (isFromAllUncompleted) {
// 			// Remove from allUncompletedActivities list
// 			allUncompletedActivities.value = allUncompletedActivities.value.filter(
// 				(activity) => activity.id !== item.id,
// 			);
// 		} else {
// 			yesterDayUncompletedActivities.value =
// 				yesterDayUncompletedActivities.value.filter(
// 					(activity) => activity.id !== item.id,
// 				);
// 		}
// 		toast.success("Status aktivity bol úspešne aktualizovaný!");
// 	} catch (error) {
// 		console.error("Error updating activity status:", error);
// 	}
// };

async function addFinancialAnalysisActivity(contactId, dateTimeStart) {
	try {
		const startTime = new Date(dateTimeStart);
		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
		const dateTimeEnd = endTime
			.toISOString()
			.replace("T", " ")
			.substring(0, 19);

		const response = await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: contactId,
				aktivita: "Analýza osobných financí",
				datumCas: dateTimeStart,
				koniec: dateTimeEnd,
				volane: null,
				dovozne: null,
				dohodnute: null,
				online_meeting: false,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		const contact = contactsStore.allContacts.find((c) => c.id === contactId);
		const newActivity = {
			...response.data.activity,
			meno: contact?.meno || "",
			priezvisko: contact?.priezvisko || "",
		};
		yesterDayUncompletedActivities.value.push(newActivity);
		return response.data;
	} catch (error) {
		console.error(
			"Error creating activity:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

const handleConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			pendingFirstMeetingRow.value.activity_status = "check";
			await addFinancialAnalysisActivity(
				pendingFirstMeetingRow.value.contact_id,
				pendingFirstMeetingRow.value.koniec,
			);
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{ activity_status: "check" },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
	} finally {
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

const showPastUncompletedTodos = async () => {
	activeGroup.value = "past";
	showingAllTodos.value = true;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	await todoStore.fetchPastUncompletedTodos();
	todoItems.value = todoStore.todosByDate.map((todo, index) => ({
		id: todo.id || index,
		activity: todo.activity_name,
		dueDate: todo.due_date,
		assignedTo: todo.contact_id,
		contact_name: todo.contact_name,
		completed: todo.is_completed,
		updated_at: todo.is_completed ? todo.updated_at : null,
	}));
};

const showFutureUncompletedTodos = async () => {
	activeGroup.value = "future";
	showingAllTodos.value = true;
	showingTodosWithoutContact.value = false;
	showingAllUncompletedActivities.value = false;
	await todoStore.fetchFutureUncompletedTodos();
	todoItems.value = todoStore.todosByDate.map((todo, index) => ({
		id: todo.id || index,
		activity: todo.activity_name,
		dueDate: todo.due_date,
		assignedTo: todo.contact_id,
		contact_name: todo.contact_name,
		completed: todo.is_completed,
		updated_at: todo.is_completed ? todo.updated_at : null,
	}));
};

const getNowForDatetimeLocal = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Computed label for the top section
const topSectionLabel = computed(() => {
	if (showingAllUncompletedActivities.value)
		return "Všetky nevyhodnotené aktivity";
	return "Nevyhodnotené aktivity za posledný týždeň";
});
</script>

<template>
	<NewNamesModal
		v-if="showNewNamesModal"
		@close="changeNewNamesModal"
		:contactId="newNamesModalContactId"
		:activityId="selectedActivtyId"
	/>
	<DiscardActivityModal
		v-if="showDiscardActivityModal"
		:activityData="currentActivity"
		@closeDiscardActivity="changeDiscardActivityModal"
		@confirmDiscardActivity="changeDiscardActivityModal"
	/>
	<ConfirmEventModal
		v-if="showConfirmEvent"
		@close="changeConfirmEventModal"
		@confirm="handleConfirmEvent"
	/>

	<loadigcomponent v-if="todoStore.loadingState" />

	<div class="page-wrapper">
		<UpdateToDoForm
			v-if="showUpdateForm"
			@cancelToDoActivity="toggleUpdateForm"
			:item="selectedItem"
		/>

		<!-- Page Header -->
		<div class="page-header">
			<h1 class="page-title">ToDo Zoznam</h1>
		</div>

		<!-- Day Navigation Bar -->
		<div class="nav-bar">
			<button
				class="nav-arrow"
				@click="goToPreviousDay"
				title="Predchádzajúci deň"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				<span>Predchádzajúci</span>
			</button>

			<div class="nav-center">
				<div class="current-date-label">
					<span
						v-if="
							!showingAllTodos &&
							!showingTodosWithoutContact &&
							!showingAllUncompletedActivities
						"
					>
						{{ formatCurrentDate(currentDate) }}
					</span>
					<span v-else-if="showingAllUncompletedActivities"
						>Všetky nevyhodnotené aktivity</span
					>
					<span v-else-if="activeGroup === 'past'"
						>Nedokončené z minulosti</span
					>
					<span v-else-if="activeGroup === 'future'"
						>Nedokončené z budúcnosti</span
					>
					<span v-else-if="showingAllTodos">Všetky úlohy</span>
					<span v-else-if="showingTodosWithoutContact">Úlohy bez kontaktu</span>
				</div>

				<div class="filter-chips">
					<button
						:class="['chip', activeGroup === 'today' ? 'chip-active' : '']"
						@click="goToToday"
					>
						Dnes
					</button>

					<button
						:class="[
							'chip chip-blue',
							activeGroup === 'all' ? 'chip-active' : '',
						]"
						@click="showAllTodos"
					>
						Všetky úlohy
					</button>

					<button
						:class="[
							'chip chip-green',
							activeGroup === 'past' ? 'chip-active' : '',
						]"
						@click="showPastUncompletedTodos"
					>
						Úlohy z minulosti
					</button>

					<button
						:class="[
							'chip chip-purple',
							activeGroup === 'future' ? 'chip-active' : '',
						]"
						@click="showFutureUncompletedTodos"
					>
						Úlohy z budúcnosti
					</button>

					<button
						:class="[
							'chip chip-gray',
							activeGroup === 'withoutContact' ? 'chip-active' : '',
						]"
						@click="showTodosWithoutContact"
					>
						Všetky moje vlastné úlohy
					</button>

					<button
						:class="[
							'chip chip-orange',
							activeGroup === 'allUncompleted' ? 'chip-active' : '',
						]"
						@click="showAllUncompletedActivities"
					>
						Všetky nevyhodnotené aktivity
					</button>
				</div>
			</div>

			<button class="nav-arrow" @click="goToNextDay" title="Nasledujúci deň">
				<span>Nasledujúci</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</button>
		</div>

		<!-- Main Layout -->
		<div class="main-layout">
			<!-- Sidebar (Add form) -->
			<aside class="sidebar">
				<div class="sidebar-card">
					<h3 class="sidebar-title">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						Vybrať dátum
					</h3>
					<input
						type="datetime-local"
						v-model="newTodo.dueDate"
						class="datepicker-input"
					/>
					<button class="btn-reset" @click="resetDate">↺ Reset dátumu</button>
				</div>

				<div class="sidebar-card">
					<h3 class="sidebar-title">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Nová úloha bez kontaktu
					</h3>
					<div class="form-group">
						<label>Aktivita</label>
						<input
							type="text"
							v-model="newTodo.activity"
							placeholder="Názov aktivity..."
						/>
					</div>
					<div class="form-group">
						<label>Termín a čas</label>
						<input type="datetime-local" v-model="newTodo.dueDate" />
					</div>
					<button class="btn-add" @click="addTodoWithoutContact">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Pridať vlastnú úlohu
					</button>
				</div>
			</aside>

			<!-- Main content -->
			<div class="content-area">
				<!-- TOP TABLE: switches between "Nevyhodnotené" and "Všetky nedokončené aktivity" -->
				<section class="table-section">
					<div class="section-header">
						<div class="section-title-row">
							<span
								class="section-badge"
								:class="
									showingAllUncompletedActivities
										? 'badge-orange'
										: 'badge-amber'
								"
							>
								{{
									showingAllUncompletedActivities
										? allUncompletedActivities.length
										: yesterDayUncompletedActivities.length
								}}
							</span>
							<h2 class="section-title">{{ topSectionLabel }}</h2>
						</div>
					</div>

					<!-- All uncompleted activities table (shown when button is clicked) -->
					<div v-if="showingAllUncompletedActivities">
						<div
							v-if="allUncompletedActivities.length === 0"
							class="empty-state"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								fill="none"
								viewBox="0 0 24 24"
								stroke="#aaa"
								stroke-width="1.5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p>Žiadne nedokončené aktivity</p>
						</div>
						<div v-else class="table-wrapper">
							<table class="data-table">
								<thead>
									<tr>
										<th>Aktivita</th>
										<th>Plánovaná</th>
										<th>Kontakt</th>
										<th>Poznámka</th>

										<th>Akcie</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="item in allUncompletedActivities" :key="item.id">
										<td class="fw-medium">{{ item.aktivita }}</td>
										<td class="text-muted">
											{{ formatDateTime(item.datumCas) }}
										</td>
										<td>
											<a
												:href="'/contact/' + item.contact_id"
												class="contact-link"
											>
												{{ item.meno }} {{ item.priezvisko }}
											</a>
										</td>
										<td class="text-muted text-sm">
											{{ item.poznamka || "—" }}
										</td>

										<td>
											<div class="action-icons">
												<button
													class="icon-btn icon-success"
													title="Dokončené"
													@click.stop="
														changeActivityStatus(item, 'check', true)
													"
												>
													✓
												</button>
												<button
													class="icon-btn icon-question"
													title="Otáznik"
													@click.stop="
														changeActivityStatus(item, 'questionmark', true)
													"
												>
													?
												</button>
												<button
													class="icon-btn icon-danger"
													title="Zahodiť"
													@click.stop="
														changeActivityStatus(item, 'discarded', true)
													"
												>
													✕
												</button>
												<template v-if="item.aktivita === 'Pohovor'">
													<button
														class="icon-btn icon-success"
														title="Prijatý"
														@click.stop="
															changeActivityStatus(item, 'accepted', true)
														"
													>
														<Icon name="fa6-solid:thumbs-up" class="h-4 w-4" />
													</button>
													<button
														class="icon-btn icon-danger"
														title="Odmietnutý"
														@click.stop="
															changeActivityStatus(item, 'rejected', true)
														"
													>
														<Icon
															name="fa6-solid:thumbs-down"
															class="h-4 w-4"
														/>
													</button>
												</template>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- Yesterday uncompleted activities (default) -->
					<div v-else>
						<div
							v-if="yesterDayUncompletedActivities.length === 0"
							class="empty-state"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								fill="none"
								viewBox="0 0 24 24"
								stroke="#aaa"
								stroke-width="1.5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p>Žiadne nevyhodnotené aktivity</p>
						</div>
						<div v-else class="table-wrapper">
							<table class="data-table">
								<thead>
									<tr>
										<th v-for="column in columns_yesterday" :key="column.key">
											{{ column.label }}
										</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="(item, index) in yesterDayUncompletedActivities"
										:key="index"
									>
										<td class="fw-medium">{{ item.aktivita }}</td>
										<td class="text-muted">
											{{ formatDateTime(item.datumCas) }}
										</td>
										<td>
											<a
												:href="'/contact/' + item.contact_id"
												class="contact-link"
											>
												{{ item.meno }} {{ item.priezvisko }}
											</a>
										</td>
										<td class="text-muted text-sm">
											{{ item.poznamka || "—" }}
										</td>
										<td>
											<div class="action-icons">
												<button
													class="icon-btn icon-success"
													title="Dokončené"
													@click.stop="
														changeActivityStatus(item, 'check', false)
													"
												>
													✓
												</button>
												<button
													class="icon-btn icon-question"
													:class="{
														'icon-question-active':
															item.activity_status === 'questionmark',
													}"
													title="Otáznik"
													@click.stop="
														changeActivityStatus(item, 'questionmark', false)
													"
												>
													?
												</button>
												<button
													class="icon-btn icon-danger"
													title="Zahodiť"
													@click.stop="
														changeActivityStatus(item, 'discarded', false)
													"
												>
													✕
												</button>
												<template v-if="item.aktivita === 'Pohovor'">
													<button
														class="icon-btn icon-success"
														title="Prijatý"
														@click.stop="
															changeActivityStatus(item, 'accepted', false)
														"
													>
														<Icon name="fa6-solid:thumbs-up" class="h-4 w-4" />
													</button>
													<button
														class="icon-btn icon-danger"
														title="Odmietnutý"
														@click.stop="
															changeActivityStatus(item, 'rejected', false)
														"
													>
														<Icon
															name="fa6-solid:thumbs-down"
															class="h-4 w-4"
														/>
													</button>
												</template>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</section>

				<!-- BOTTOM TABLE: Todo items -->
				<section class="table-section" v-if="!showingAllUncompletedActivities">
					<div class="section-header">
						<div class="section-title-row">
							<span class="section-badge badge-blue">{{
								todoItems.length
							}}</span>
							<h2 class="section-title">
								<span v-if="activeGroup === 'today'"
									>Úlohy na
									{{ isToday ? "dnes" : formatCurrentDate(currentDate) }}</span
								>
								<span v-else-if="activeGroup === 'all'">Všetky úlohy</span>
								<span v-else-if="activeGroup === 'past'"
									>Nedokončené z minulosti</span
								>
								<span v-else-if="activeGroup === 'future'"
									>Nedokončené z budúcnosti</span
								>
								<span v-else-if="activeGroup === 'withoutContact'"
									>Úlohy bez kontaktu</span
								>
							</h2>
						</div>
					</div>

					<div v-if="todoItems.length === 0" class="empty-state">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							fill="none"
							viewBox="0 0 24 24"
							stroke="#aaa"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<p>Žiadne úlohy pre toto obdobie</p>
					</div>
					<div v-else class="table-wrapper">
						<table class="data-table">
							<thead>
								<tr>
									<th v-for="column in columns" :key="column.key">
										{{ column.label }}
									</th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="(item, index) in todoItems"
									:key="index"
									:class="{ 'row-completed': item.completed }"
								>
									<td class="text-muted">{{ formatDateTime(item.dueDate) }}</td>
									<td
										class="fw-medium"
										:class="{ 'text-strike': item.completed }"
									>
										{{ item.activity }}
									</td>
									<td
										@click="goToContact(item.assignedTo)"
										class="contact-cell"
									>
										<span v-if="item.contact_name" class="contact-link">{{
											item.contact_name
										}}</span>
										<span v-else class="no-contact">Osobné Todo</span>
									</td>
									<td class="text-center">
										<label class="toggle-wrap">
											<input
												type="checkbox"
												:checked="item.completed"
												@click="markAsDone(item.id)"
												class="toggle-input"
											/>
											<span class="toggle-visual"></span>
										</label>
									</td>
									<td class="text-muted text-sm">
										{{ formatDateTime(item.updated_at) || "—" }}
									</td>
									<td>
										<div class="row-actions">
											<button class="btn-edit" @click="toggleUpdateForm(item)">
												Upraviť
											</button>
											<button class="btn-delete" @click="deleteToDo(item.id)">
												Vymazať
											</button>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* ===== Base ===== */
*,
*::before,
*::after {
	box-sizing: border-box;
}

.page-wrapper {
	min-height: 100vh;
	background: #f4f6f9;
	padding: 0 0 60px;
	font-family: "Segoe UI", system-ui, sans-serif;
	color: #1a1d23;
}

/* ===== Page header ===== */
.page-header {
	background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
	padding: 32px 40px 28px;
	margin-bottom: 0;
}

.page-title {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	color: #fff;
	letter-spacing: -0.3px;
}

/* ===== Navigation Bar ===== */
.nav-bar {
	background: #fff;
	border-bottom: 1px solid #e5e8ef;
	padding: 14px 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
	position: sticky;
	top: 0;
	z-index: 50;
}

.nav-arrow {
	display: flex;
	align-items: center;
	gap: 6px;
	background: #f0f4ff;
	color: #2563eb;
	border: none;
	padding: 8px 14px;
	border-radius: 8px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	transition:
		background 0.18s,
		transform 0.15s;
	white-space: nowrap;
}
.nav-arrow:hover {
	background: #dbeafe;
	transform: translateX(-2px);
}
.nav-arrow:last-child:hover {
	transform: translateX(2px);
}

.nav-center {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	flex: 1;
}

.current-date-label {
	font-size: 15px;
	font-weight: 600;
	color: #1a1d23;
	text-transform: capitalize;
}

.filter-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	justify-content: center;
}

.chip {
	border: 1.5px solid #d1d5db;
	background: #fff;
	color: #4b5563;
	padding: 5px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.18s;
}
.chip:hover {
	border-color: #9ca3af;
	background: #f9fafb;
}
.chip-active {
	background: #1e3a5f !important;
	color: #fff !important;
	border-color: #1e3a5f !important;
}

.chip-blue {
	border-color: #3b82f6;
	color: #2563eb;
}
.chip-blue:hover {
	background: #eff6ff;
}
.chip-green {
	border-color: #22c55e;
	color: #16a34a;
}
.chip-green:hover {
	background: #f0fdf4;
}
.chip-purple {
	border-color: #a855f7;
	color: #7c3aed;
}
.chip-purple:hover {
	background: #faf5ff;
}
.chip-gray {
	border-color: #9ca3af;
	color: #6b7280;
}
.chip-gray:hover {
	background: #f9fafb;
}
.chip-orange {
	border-color: #f97316;
	color: #ea580c;
}
.chip-orange:hover {
	background: #fff7ed;
}

/* ===== Main Layout ===== */
.main-layout {
	display: flex;
	gap: 24px;
	padding: 28px 40px;
	align-items: flex-start;
}

/* ===== Sidebar ===== */
.sidebar {
	width: 240px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.sidebar-card {
	background: #fff;
	border-radius: 12px;
	padding: 18px;
	border: 1px solid #e5e8ef;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.sidebar-title {
	display: flex;
	align-items: center;
	gap: 7px;
	font-size: 13px;
	font-weight: 700;
	color: #374151;
	margin: 0 0 14px;
	text-transform: uppercase;
	letter-spacing: 0.4px;
}

.datepicker-input {
	width: 100%;
	padding: 9px 10px;
	border: 1px solid #d1d5db;
	border-radius: 7px;
	font-size: 13px;
	background: #f9fafb;
	cursor: pointer;
	color: #1a1d23;
}
.datepicker-input:hover {
	border-color: #3b82f6;
}

.btn-reset {
	margin-top: 8px;
	width: 100%;
	background: none;
	border: 1.5px solid #d1d5db;
	color: #6b7280;
	padding: 6px 10px;
	border-radius: 7px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.18s;
}
.btn-reset:hover {
	border-color: #9ca3af;
	color: #374151;
	background: #f9fafb;
}

.form-group {
	margin-bottom: 12px;
}
.form-group label {
	display: block;
	font-size: 11px;
	font-weight: 600;
	color: #6b7280;
	margin-bottom: 5px;
	text-transform: uppercase;
	letter-spacing: 0.3px;
}
.form-group input {
	width: 100%;
	padding: 8px 10px;
	border: 1px solid #d1d5db;
	border-radius: 7px;
	font-size: 13px;
	background: #f9fafb;
	color: #1a1d23;
	transition: border 0.15s;
}
.form-group input:focus {
	outline: none;
	border-color: #3b82f6;
	background: #fff;
}

.btn-add {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	background: #2563eb;
	color: #fff;
	border: none;
	padding: 9px 14px;
	border-radius: 8px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.18s;
}
.btn-add:hover {
	background: #1d4ed8;
}

/* ===== Content Area ===== */
.content-area {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

/* ===== Table Section ===== */
.table-section {
	background: #fff;
	border-radius: 12px;
	border: 1px solid #e5e8ef;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
	overflow: hidden;
}

.section-header {
	padding: 16px 20px;
	border-bottom: 1px solid #f0f2f5;
	background: #fafbfc;
}

.section-title-row {
	display: flex;
	align-items: center;
	gap: 10px;
}

.section-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 26px;
	height: 26px;
	padding: 0 8px;
	border-radius: 13px;
	font-size: 12px;
	font-weight: 700;
	color: #fff;
}
.badge-amber {
	background: #f59e0b;
}
.badge-orange {
	background: #f97316;
}
.badge-blue {
	background: #3b82f6;
}

.section-title {
	margin: 0;
	font-size: 15px;
	font-weight: 700;
	color: #1a1d23;
}

.table-wrapper {
	overflow-x: auto;
}

.data-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
}

.data-table th {
	background: #f8f9fb;
	padding: 10px 14px;
	text-align: left;
	font-size: 11px;
	font-weight: 700;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	border-bottom: 1px solid #e5e8ef;
	white-space: nowrap;
}

.data-table td {
	padding: 11px 14px;
	border-bottom: 1px solid #f0f2f5;
	vertical-align: middle;
}

.data-table tbody tr:last-child td {
	border-bottom: none;
}
.data-table tbody tr:hover {
	background: #f8faff;
}
.row-completed {
	background: #f0fdf4 !important;
}
.row-completed:hover {
	background: #dcfce7 !important;
}

.fw-medium {
	font-weight: 500;
	color: #1a1d23;
}
.text-muted {
	color: #6b7280;
}
.text-sm {
	font-size: 12px;
}
.text-strike {
	text-decoration: line-through;
	color: #9ca3af;
}
.text-center {
	text-align: center;
}

.contact-cell {
	cursor: pointer;
}
.contact-link {
	color: #2563eb;
	font-weight: 500;
	text-decoration: none;
}
.contact-link:hover {
	text-decoration: underline;
	color: #1d4ed8;
}
.no-contact {
	color: #9ca3af;
	font-style: italic;
	font-size: 12px;
}

/* ===== Action icons (status buttons) ===== */
.action-icons {
	display: flex;
	align-items: center;
	gap: 5px;
}

.icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 6px;
	border: 1.5px solid transparent;
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.15s;
	background: #f3f4f6;
	color: #374151;
}

.icon-success {
	border-color: #bbf7d0;
	color: #16a34a;
	background: #f0fdf4;
}
.icon-success:hover {
	background: #22c55e;
	color: #fff;
	border-color: #22c55e;
}

.icon-question {
	border-color: #fed7aa;
	color: #d97706;
	background: #fffbeb;
}
.icon-question:hover {
	background: #f59e0b;
	color: #fff;
	border-color: #f59e0b;
}
.icon-question-active {
	background: #ef4444 !important;
	color: #fff !important;
	border-color: #ef4444 !important;
}

.icon-danger {
	border-color: #fecaca;
	color: #dc2626;
	background: #fef2f2;
}
.icon-danger:hover {
	background: #ef4444;
	color: #fff;
	border-color: #ef4444;
}

/* ===== Status tag ===== */
.status-tag {
	display: inline-block;
	padding: 2px 9px;
	border-radius: 12px;
	font-size: 11px;
	font-weight: 600;
	background: #e5e7eb;
	color: #374151;
}
.status-pending {
	background: #fef3c7;
	color: #92400e;
}

/* ===== Row actions (edit/delete) ===== */
.row-actions {
	display: flex;
	gap: 5px;
}

.btn-edit,
.btn-delete {
	border: none;
	padding: 5px 10px;
	border-radius: 6px;
	font-size: 11px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
}
.btn-edit {
	background: #dbeafe;
	color: #2563eb;
}
.btn-edit:hover {
	background: #2563eb;
	color: #fff;
}
.btn-delete {
	background: #fee2e2;
	color: #dc2626;
}
.btn-delete:hover {
	background: #ef4444;
	color: #fff;
}

/* ===== Toggle checkbox ===== */
.toggle-wrap {
	display: inline-flex;
	cursor: pointer;
	position: relative;
}
.toggle-input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}
.toggle-visual {
	width: 18px;
	height: 18px;
	border-radius: 5px;
	border: 2px solid #d1d5db;
	background: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.18s;
}
.toggle-input:checked + .toggle-visual {
	background: #22c55e;
	border-color: #22c55e;
}
.toggle-input:checked + .toggle-visual::after {
	content: "✓";
	color: #fff;
	font-size: 11px;
	font-weight: 700;
	line-height: 1;
}

/* ===== Empty state ===== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 48px 24px;
	color: #9ca3af;
}
.empty-state p {
	margin: 0;
	font-size: 14px;
	font-weight: 500;
}
</style>
