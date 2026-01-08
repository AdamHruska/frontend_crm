<script setup>
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";
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

const datepickerInput = ref(null);

const activeGroup = ref("today");

const todoItems = ref([]);

const yesterDayUncompletedActivities = ref([]);

// Add current date state for pagination
const currentDate = ref(new Date());

// Add state to track if showing all todos
const showingAllTodos = ref(false);

// Add state to track if showing todos without contact
const showingTodosWithoutContact = ref(false);

const contactNames = reactive({});

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

// Format date for display;
const formatCurrentDate = (date) => {
	return date.toLocaleDateString("sk-SK", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

// Navigate to previous day
const goToPreviousDay = async () => {
	const newDate = new Date(currentDate.value);
	newDate.setDate(newDate.getDate() - 1);
	currentDate.value = newDate;
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	await loadTodosForCurrentDate();
};

// Navigate to next day
const goToNextDay = async () => {
	const newDate = new Date(currentDate.value);
	newDate.setDate(newDate.getDate() + 1);
	currentDate.value = newDate;
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	await loadTodosForCurrentDate();
};

// Go to today
const goToToday = async () => {
	currentDate.value = new Date();
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
	await loadTodosForCurrentDate();
};

// Show all todos
// const showAllTodos = async () => {
// 	showingAllTodos.value = true;
// 	showingTodosWithoutContact.value = false;
// 	await todoStore.fetchTodos();
// 	todoItems.value = todoStore.todos.map((todo, index) => ({
// 		id: todo.id || index,
// 		activity: todo.activity_name,
// 		dueDate: todo.due_date,
// 		assignedTo: todo.contact_id,
// 		contact_name: todo.contact_name,
// 		completed: todo.is_completed,
// 		updated_at: todo.is_completed ? todo.updated_at : null,
// 	}));
// };

const showAllTodos = async () => {
	activeGroup.value = "all";
	showingAllTodos.value = true;
	showingTodosWithoutContact.value = false;
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

// const showTodosWithoutContact = async () => {
// 	const response = await axios.get(`${config.public.apiUrl}contact1`, {
// 		headers: {
// 			Authorization: `Bearer ${authStore.token}`,
// 		},
// 	});

// 	todoItems.value = response.data.data.map((todo) => ({
// 		id: todo.id,
// 		activity: todo.activity_name,
// 		dueDate: todo.due_date,
// 		assignedTo: todo.contact_id,
// 		contact_name: todo.contact_name,
// 		completed: todo.is_completed,
// 		updated_at: todo.is_completed ? todo.updated_at : null,
// 	}));
// };

const showTodosWithoutContact = async () => {
	activeGroup.value = "withoutContact";
	showingTodosWithoutContact.value = true;
	showingAllTodos.value = false;
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
// Load todos for current date
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

// Check if current date is today
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
			dueDate: todo.due_date, // Keep full datetime
			completed: todo.is_completed,
			updated_at: todo.is_completed ? todo.updated_at : null,
			contact_name: todo.contact_name,
		}));
	},
	{ deep: true, immediate: true }
);

onMounted(async () => {
	newTodo.value.dueDate = getNowForDatetimeLocal();
	if (contactsStore.contacts.length === 0) {
		await contactsStore.fetchContacts();
	}

	if (contactsStore.allContacts.length === 0) {
		await contactsStore.fetchAllContacts();
	}

	console.log("skuska vsetky kontakty", contactsStore.allContacts);

	const yesterDay = await axios.get(
		`${config.public.apiUrl}get-yesterday-uncompleted-activities`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);

	yesterDayUncompletedActivities.value = yesterDay.data.activities;

	yesterDayUncompletedActivities.value =
		yesterDayUncompletedActivities.value.map((activity) => {
			// Find the corresponding contact
			const contact = contactsStore.allContacts.find(
				(contact) => contact.id === activity.contact_id
			);

			// If contact is found, add meno and priezvisko to the activity
			if (contact) {
				return {
					...activity,
					meno: contact.meno,
					priezvisko: contact.priezvisko,
				};
			}

			// If no contact found, return the activity as is
			return activity;
		});

	console.log(
		"yesterday uncompleted activities with names",
		yesterDayUncompletedActivities.value
	);

	if (datepickerInput.value) {
		new AirDatepicker(datepickerInput.value, {
			autoClose: true,
			timepicker: true, // Enable time picker
			dateFormat: "yyyy-MM-dd",
			timeFormat: "HH:mm",
			position: "bottom left",
			async onSelect({ date }) {
				// Format datetime for backend (ISO format)
				const selectedDateTime = date.toISOString();

				// Format for display (local format)
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				const hours = String(date.getHours()).padStart(2, "0");
				const minutes = String(date.getMinutes()).padStart(2, "0");
				const selectedDateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

				newTodo.value.dueDate = selectedDateTimeLocal;
				console.log("Selected datetime:", selectedDateTime);

				// Update current date and load todos for selected date
				currentDate.value = new Date(date);
				showingAllTodos.value = false;
				showingTodosWithoutContact.value = false;
				await loadTodosForCurrentDate();
			},
		});
	}

	// Load todos for today initially
	await loadTodosForCurrentDate();
});

// Define the table columns
const columns = [
	{
		key: "dueDate",
		label: "Termín dokončenia",
	},
	{
		key: "activity",
		label: "Aktivita",
	},
	{
		key: "assignedTo",
		label: "Priradené k",
	},
	{
		key: "completed",
		label: "Dokončené",
	},
	{
		key: "updated_at",
		label: "Dokonané dňa",
	},
	{
		key: "actions",
		label: "Akcie",
	},
];

const columns_yesterday = [
	{
		key: "aktivita",
		label: "Aktivita",
	},
	{
		key: "datumCas",
		label: "Plánovaná",
	},
	{
		label: "Meno a priezvisko",
	},
	{
		key: "poznamka",
		label: "Poznámka",
	},
	{
		key: "activity_status",
		label: "Status aktivity",
	},
];

// Function to toggle completed status
const toggleCompleted = (index) => {
	todoItems.value[index].completed = !todoItems.value[index].completed;
};

// Function to handle edit button click
const editTodo = (id, activity) => {
	console.log("edit", id);
	console.log("activity:", activity);
};

// Function to format datetime
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

// Function to format date only (for backward compatibility)
const formatDate = (dateString) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("sk-SK");
};

// Add new todo item
const newTodo = ref({
	activity: "",
	dueDate: "",
	assignedTo: "",
	completed: false,
	updated_at: "",
});

// const addTodo = async () => {
// 	if (
// 		newTodo.value.activity &&
// 		newTodo.value.dueDate &&
// 		newTodo.value.assignedTo
// 	) {
// 		// Send datetime to backend
// 		const todoData = {
// 			activity_name: newTodo.value.activity,
// 			due_date: newTodo.value.dueDate,
// 			contact_id: newTodo.value.assignedTo,
// 			is_completed: false,
// 		};

// 		try {
// 			await todoStore.createTodo(todoData);
// 			// Reset form
// 			newTodo.value = {
// 				activity: "",
// 				dueDate: "",
// 				assignedTo: "",
// 				completed: false,
// 			};
// 			// Refresh the todo list for current date
// 			if (showingAllTodos.value) {
// 				await showAllTodos();
// 			} else if (showingTodosWithoutContact.value) {
// 				await showTodosWithoutContact();
// 			} else {
// 				await loadTodosForCurrentDate();
// 			}
// 		} catch (error) {
// 			console.error("Error creating todo:", error);
// 		}
// 	}
// };

// Add new todo without contact
const addTodoWithoutContact = async () => {
	if (newTodo.value.activity && newTodo.value.dueDate) {
		const todoData = {
			activity_name: newTodo.value.activity,
			due_date: newTodo.value.dueDate,
		};

		try {
			const createdTodo = await todoStore.createTodoWithoutContact(todoData);

			todoItems.value.unshift({
				id: createdTodo.id,
				activity: createdTodo.activity_name,
				dueDate: createdTodo.due_date,
				assignedTo: null,
				completed: createdTodo.is_completed ?? false,
				updated_at: createdTodo.updated_at ?? null,
			});
			// Reset form
			newTodo.value = {
				activity: "",
				dueDate: "",
				assignedTo: "",
				completed: false,
			};
			// Refresh the todo list
			// if (showingAllTodos.value) {
			// 	await showAllTodos();
			// } else if (showingTodosWithoutContact.value) {
			// 	await showTodosWithoutContact();
			// } else {
			// 	await loadTodosForCurrentDate();
			// }
		} catch (error) {
			console.error("Error creating todo without contact:", error);
		}
	}
};

const selectedItem = ref(null);

const showUpdateForm = ref(false);
const toggleUpdateForm = (item) => {
	console.log("toggleUpdateForm", item);
	selectedItem.value = item;
	showUpdateForm.value = !showUpdateForm.value;
};

const deleteToDo = async (id) => {
	await todoStore.deleteTodo(id);
	todoItems.value = todoItems.value.filter((item) => item.id !== id);
};

const router = useRouter();
const goToContact = (id) => {
	if (id) {
		router.push(`/contact/${id}`);
	}
};

// const markAsDone = async (id) => {
// 	const todo = todoItems.value.find((item) => item.id === id);
// 	if (!todo) return;

// 	// Check the current completion status and toggle it
// 	const newCompletionStatus = !todo.completed;

// 	await todoStore.updateTodo(id, {
// 		activity_name: todo.activity,
// 		due_date: todo.dueDate,
// 		is_completed: newCompletionStatus,
// 	});

// 	// Reload the list after update
// 	if (showingAllTodos.value) {
// 		await showAllTodos();
// 	} else if (showingTodosWithoutContact.value) {
// 		await showTodosWithoutContact();
// 	} else {
// 		await loadTodosForCurrentDate();
// 	}
// };

const markAsDone = async (id) => {
	const todo = todoItems.value.find((item) => item.id === id);
	if (!todo) return;

	const newCompletionStatus = !todo.completed;

	await todoStore.updateTodo(id, {
		activity_name: todo.activity,
		due_date: todo.dueDate,
		is_completed: newCompletionStatus,
	});

	// Reload **the same group** instead of defaulting
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
	console.log("resetDate");
	newTodo.value.dueDate = "";
	currentDate.value = new Date(); // Reset to today
	showingAllTodos.value = false;
	showingTodosWithoutContact.value = false;
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

const changeActivityStatus = async (item, status) => {
	if (item.aktivita === "Prvé stretnutie" && status === "check") {
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = item;
	}

	if (status === "discarded") {
		currentActivity.value = item;
		changeDiscardActivityModal();
	}

	try {
		await axios.patch(
			`${config.public.apiUrl}activities/${item.id}/status`,
			{
				activity_status: status,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		yesterDayUncompletedActivities.value =
			yesterDayUncompletedActivities.value.filter(
				(activity) => activity.id !== item.id
			);
		toast.success("Status aktivity bol úspešne aktualizovaný!");
	} catch (error) {
		console.error("Error updating activity status:", error);
		// Handle error appropriately (show toast notification, etc.)
	}
};

// async function addFinancialAnalysisActivity(contactId, dateTimeStart) {
// 	try {
// 		// Convert the start time string to a Date object
// 		const startTime = new Date(dateTimeStart);

// 		// Add one hour to create the end time
// 		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

// 		// Format the end time back to the same string format
// 		const dateTimeEnd = endTime
// 			.toISOString()
// 			.replace("T", " ")
// 			.substring(0, 19);

// 		const response = await axios.post(
// 			`${config.public.apiUrl}add-activity`,
// 			{
// 				contact_id: contactId,
// 				aktivita: "Analýza osobných financí",
// 				datumCas: dateTimeStart,
// 				koniec: dateTimeEnd,
// 				volane: null,
// 				dovozene: null,
// 				dohodnute: null,
// 				online_meeting: false,
// 			},
// 			{
// 				headers: {
// 					Authorization: `Bearer ${authStore.token}`,
// 				},
// 			}
// 		);

// 		// Add the new activity to the local state
// 		yesterDayUncompletedActivities.value.push(response.data.activity);

// 		console.log("Activity created:", response.data);
// 		return response.data;
// 	} catch (error) {
// 		console.error(
// 			"Error creating activity:",
// 			error.response?.data || error.message
// 		);
// 		throw error;
// 	}
// }

async function addFinancialAnalysisActivity(contactId, dateTimeStart) {
	try {
		// Convert the start time string to a Date object
		const startTime = new Date(dateTimeStart);

		// Add one hour to create the end time
		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

		// Format the end time back to the same string format
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
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		// Find the contact information to add to the activity
		const contact = contactsStore.allContacts.find(
			(contact) => contact.id === contactId
		);

		// Create the activity object with contact information
		const newActivity = {
			...response.data.activity,
			meno: contact?.meno || "",
			priezvisko: contact?.priezvisko || "",
		};

		// Add the new activity to the local state with contact info
		yesterDayUncompletedActivities.value.push(newActivity);

		console.log("Activity created:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error creating activity:",
			error.response?.data || error.message
		);
		throw error;
	}
}

const handleConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			// Update local state immediately for better UX
			pendingFirstMeetingRow.value.activity_status = "check";

			// Create the financial analysis activity
			await addFinancialAnalysisActivity(
				pendingFirstMeetingRow.value.contact_id,
				pendingFirstMeetingRow.value.koniec
			);

			// Now update the status of the original meeting in the backend
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{
					activity_status: "check",
				},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);

			// Refresh activities to show the new one
			await findActivities(id);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
		// Optionally show error message to user
	} finally {
		// Close the modal and clear the pending row
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

// const showPastUncompletedTodos = async () => {
// 	showingAllTodos.value = true;
// 	showingTodosWithoutContact.value = false;

// 	await todoStore.fetchPastUncompletedTodos();

// 	todoItems.value = todoStore.todosByDate.map((todo, index) => ({
// 		id: todo.id || index,
// 		activity: todo.activity_name,
// 		dueDate: todo.due_date,
// 		assignedTo: todo.contact_id,
// 		contact_name: todo.contact_name, // ✅ THIS WAS MISSING
// 		completed: todo.is_completed,
// 		updated_at: todo.is_completed ? todo.updated_at : null,
// 	}));
// };

const showPastUncompletedTodos = async () => {
	activeGroup.value = "past";
	showingAllTodos.value = true;
	showingTodosWithoutContact.value = false;
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

// const showFutureUncompletedTodos = async () => {
// 	showingAllTodos.value = true;
// 	showingTodosWithoutContact.value = false;

// 	await todoStore.fetchFutureUncompletedTodos();

// 	todoItems.value = todoStore.todosByDate.map((todo, index) => ({
// 		id: todo.id || index,
// 		activity: todo.activity_name,
// 		dueDate: todo.due_date,
// 		assignedTo: todo.contact_id,
// 		contact_name: todo.contact_name, // ✅ REQUIRED
// 		completed: todo.is_completed,
// 		updated_at: todo.is_completed ? todo.updated_at : null,
// 	}));
// };

const showFutureUncompletedTodos = async () => {
	activeGroup.value = "future";
	showingAllTodos.value = true;
	showingTodosWithoutContact.value = false;
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
</script>

<template>
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
	<div>
		<UpdateToDoForm
			v-if="showUpdateForm"
			@cancelToDoActivity="toggleUpdateForm"
			:item="selectedItem"
		/>
		<h1 class="heading">ToDo Zoznam</h1>

		<!-- Day Navigation -->
		<div class="day-navigation">
			<button class="nav-button" @click="goToPreviousDay">
				← Predchádzajúci deň
			</button>
			<div class="current-date">
				<h2 v-if="!showingAllTodos && !showingTodosWithoutContact">
					{{ formatCurrentDate(currentDate) }}
				</h2>
				<h2 v-else-if="showingAllTodos">Všetky úlohy</h2>
				<h2 v-else-if="showingTodosWithoutContact">Úlohy bez kontaktu</h2>
				<div class="date-buttons">
					<button
						v-if="!isToday && !showingAllTodos && !showingTodosWithoutContact"
						class="today-button"
						@click="goToToday"
					>
						Dnes
					</button>
					<button
						v-if="!showingAllTodos && !showingTodosWithoutContact"
						class="show-all-button"
						@click="showAllTodos"
					>
						Zobraziť všetky
					</button>
					<button
						v-if="!showingAllTodos && !showingTodosWithoutContact"
						class="show-all-button !bg-green-500 hover:!bg-green-600"
						@click="showPastUncompletedTodos"
					>
						Nedokončené z minulosti
					</button>
					<button
						v-if="!showingAllTodos && !showingTodosWithoutContact"
						class="show-all-button !bg-purple-500 hover:!bg-purple-600"
						@click="showFutureUncompletedTodos"
					>
						Nedokončené z budúcnosti
					</button>
					<button
						v-if="!showingTodosWithoutContact && !showingAllTodos"
						class="show-without-contact-button"
						@click="showTodosWithoutContact"
					>
						Bez kontaktu
					</button>
					<button
						v-if="showingAllTodos || showingTodosWithoutContact"
						class="today-button"
						@click="goToToday"
					>
						Späť na dnes
					</button>
				</div>
			</div>
			<button class="nav-button" @click="goToNextDay">Nasledujúci deň →</button>
		</div>

		<div class="todo-container">
			<!-- Add new todo form -->
			<div class="left">
				<div class="date-picker flex flex-col mb-6 !justify-start !items-start">
					<div class="mb-2">Vyberte dátum a čas:</div>
					<input
						type="text"
						id="datepicker"
						ref="datepickerInput"
						v-model="newTodo.dueDate"
						readonly
						class="datepicker-input"
						placeholder="Vyberte dátum a čas"
					/>
					<button class="reset-button" @click="resetDate">Reset</button>
				</div>

				<!-- Form for todo with contact -->

				<!-- Form for todo without contact -->
				<div class="add-form without-contact">
					<h3 class="form-title">Pridať úlohu bez kontaktu</h3>
					<div class="form-group">
						<label for="activity-no-contact">Aktivita:</label>
						<input
							type="text"
							id="activity-no-contact"
							v-model="newTodo.activity"
						/>
					</div>

					<div class="form-group">
						<label for="datetime-no-contact">Termín a čas:</label>
						<input
							type="datetime-local"
							id="datetime-no-contact"
							v-model="newTodo.dueDate"
						/>
					</div>

					<button
						class="add-button without-contact-btn"
						@click="addTodoWithoutContact"
					>
						Pridať úlohu bez kontaktu
					</button>
				</div>
			</div>

			<!-- Todo list table -->
			<div class="right">
				<h3 class="font-semibold mb-2">
					Nevyhodnotené aktivity za posledný týždeň:
				</h3>
				<table class="todo-table mb-8 w-full">
					<thead>
						<tr>
							<th
								v-for="column in columns_yesterday"
								:key="column.key"
								:class="'col-' + column.key"
							>
								{{ column.label }}
							</th>
						</tr>
					</thead>
					<tbody class="">
						<tr
							v-for="(item, index) in yesterDayUncompletedActivities"
							:key="index"
						>
							<td class="col-dueDate">{{ item.aktivita }}</td>
							<td class="col-dueDate">{{ formatDateTime(item.datumCas) }}</td>
							<td class="col-dueDate">
								<a
									:href="'/contact/' + item.contact_id"
									class="text-blue-700 hover:underline"
								>
									{{ item.meno }} {{ item.priezvisko }}
								</a>
							</td>
							<td class="col-dueDate">
								{{ item.poznamka || "Žiadna poznámka" }}
							</td>
							<td class="col-dueDate">
								<div class="flex items-center gap-4">
									<!-- Checkmark (success) -->
									<span
										@click.stop="changeActivityStatus(item, 'check')"
										class="text-xl cursor-pointer"
										>✓</span
									>

									<span
										@click.stop="changeActivityStatus(item, 'questionmark')"
										:class="{
											'text-red-500': item.activity_status === 'questionmark',
											'text-black': item.activity_status !== 'questionmark',
										}"
										class="text-xl cursor-pointer"
										>?</span
									>

									<!-- X mark (failed/closed) -->
									<span
										@click.stop="changeActivityStatus(item, 'discarded')"
										class="text-xl cursor-pointer"
										>✕</span
									>

									<span
										v-if="item.aktivita === 'Pohovor'"
										@click.stop="changeActivityStatus(item, 'accepted')"
										class="cursor-pointer"
									>
										<Icon name="fa6-solid:thumbs-up" class="h-5 w-5" />
									</span>

									<span
										v-if="item.aktivita === 'Pohovor'"
										@click.stop="changeActivityStatus(item, 'rejected')"
										class="cursor-pointer ml-2"
									>
										<Icon name="fa6-solid:thumbs-down" class="h-5 w-5" />
									</span>
								</div>
							</td>
						</tr>
					</tbody>
				</table>

				<table class="todo-table">
					<thead>
						<tr>
							<th
								v-for="column in columns"
								:key="column.key"
								:class="'col-' + column.key"
							>
								{{ column.label }}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="(item, index) in todoItems"
							:key="index"
							:class="{ 'completed-row': item.completed }"
						>
							<td class="col-dueDate">{{ formatDateTime(item.dueDate) }}</td>
							<td class="col-activity">{{ item.activity }}</td>
							<td class="col-assignedTo" @click="goToContact(item.assignedTo)">
								<span v-if="item.contact_name">
									{{ item.contact_name }}
								</span>
								<span v-else class="no-contact">Bez kontaktu</span>
							</td>
							<td class="col-completed">
								<input
									type="checkbox"
									:checked="item.completed"
									@click="markAsDone(item.id)"
									class="checkbox"
								/>
							</td>
							<td class="col-updated_at">
								{{ formatDateTime(item.updated_at) }}
							</td>
							<td class="col-actions">
								<div class="action-buttons">
									<button class="edit-button" @click="toggleUpdateForm(item)">
										Upraviť
									</button>
									<button class="delete-button" @click="deleteToDo(item.id)">
										Vymazať
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<style scoped>
.date-buttons {
	display: flex;
	gap: 10px;
}

input {
	background-color: white;
	border-radius: 6px;
	border: 1px solid #ddd;
	padding-left: 10px;
}

.day-navigation {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30px;
	padding: 20px;
	background-color: #f8f9fa;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	max-width: 70%;
	margin: 0 auto;
}

.nav-button {
	background-color: #007bff;
	color: white;
	border: none;
	padding: 12px 20px;
	border-radius: 6px;
	cursor: pointer;
	font-weight: bold;
	font-size: 14px;
	transition: background-color 0.3s;
}

.nav-button:hover {
	background-color: #0056b3;
}

.current-date {
	text-align: center;
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
}

.current-date h2 {
	margin: 0;
	color: #333;
	font-size: 20px;
	font-weight: 600;
}

.today-button {
	background-color: #28a745;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
	transition: background-color 0.3s;
}

.today-button:hover {
	background-color: #218838;
}

.date-picker {
	width: 100%;
	padding: 16px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
	padding-top: 0;
	background-color: #f5f5f5;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	position: relative;
}

.reset-button {
	margin-top: 6px;
	margin-left: auto;
	margin-right: 35px;
}

.datepicker-input {
	padding: 8px;
	border: 1px solid #ddd;
	border-radius: 4px;
}

.heading {
	font-size: 34px;
	font-weight: bold;
	margin-bottom: 40px;
	margin-top: 32px;
	text-align: center;
	color: #333;
}

.todo-container {
	display: flex;
	width: 100%;
	gap: 20px;
}

.left {
	width: 20%;
	padding: 20px;
}

.add-form {
	background-color: #f5f5f5;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;
}

.form-title {
	margin-top: 0;
	margin-bottom: 20px;
	color: #333;
}

.form-group {
	margin-bottom: 15px;
}

.form-group label {
	display: block;
	margin-bottom: 5px;
	color: #555;
}

.form-group input {
	width: 100%;
	padding: 8px;
	border: 1px solid #ddd;
	border-radius: 4px;
	box-sizing: border-box;
}

.add-button {
	background-color: #4caf50;
	color: white;
	border: none;
	padding: 10px 15px;
	border-radius: 4px;
	cursor: pointer;
	width: 100%;
	font-weight: bold;
}

.add-button:hover {
	background-color: #45a049;
}

.add-button.without-contact-btn {
	background-color: #007bff;
}

.add-button.without-contact-btn:hover {
	background-color: #0056b3;
}

.show-all-button,
.show-without-contact-button {
	background-color: #007bff;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
}

.show-all-button:hover,
.show-without-contact-button:hover {
	background-color: #0056b3;
}

.show-without-contact-button {
	background-color: #6c757d;
}

.show-without-contact-button:hover {
	background-color: #545b62;
}

.reset-button {
	background-color: #2196f3;
	color: white;
	border: none;
	padding: 8px 10px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
}

.reset-button:hover {
	background-color: #1976d2;
}

.right {
	width: 80%;
	padding: 40px 20px;
}

.todo-table {
	width: 100%;
	border-collapse: collapse;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	background-color: white;
	table-layout: fixed;
}

.todo-table th,
.todo-table td {
	padding: 8px 6px;
	text-align: left;
	border-bottom: 1px solid #ddd;
	font-size: 13px;
}

.todo-table th {
	background-color: #f2f2f2;
	font-weight: bold;
	color: #333;
}

.todo-table tr:hover {
	background-color: #f9f9f9;
}

/* Adjusted column widths - all narrower except activity */
.col-dueDate {
	width: 14%;
}

.col-activity {
	width: 35%;
	word-wrap: break-word;
	word-break: break-word;
}

.col-assignedTo {
	width: 10%;
	cursor: pointer;
}

.col-completed {
	width: 6%;
	text-align: center;
}

.col-updated_at {
	width: 12%;
}

.col-actions {
	width: 23%;
}

.action-buttons {
	display: flex;
	gap: 4px;
	flex-wrap: wrap;
}

.edit-button,
.delete-button,
.done-button {
	border: none;
	padding: 4px 6px;
	border-radius: 3px;
	cursor: pointer;
	font-size: 10px;
	font-weight: bold;
	white-space: nowrap;
	flex: 1;
	min-width: 50px;
}

.edit-button {
	background-color: #2196f3;
	color: white;
}

.edit-button:hover {
	background-color: #1976d2;
}

.delete-button {
	background-color: #f44336;
	color: white;
}

.delete-button:hover {
	background-color: #d32f2f;
}

.done-button {
	background-color: #4caf50;
	color: white;
}

.done-button:hover {
	background-color: #45a049;
}

.checkbox {
	width: 16px;
	height: 16px;
	cursor: pointer;
}

.completed-row {
	background-color: #e8f5e9;
	color: #666;
}

.completed-row td:first-child {
	text-decoration: line-through;
}

.no-contact {
	color: #6c757d;
	font-style: italic;
}
</style>
