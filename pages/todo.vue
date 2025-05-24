<script setup>
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";

import { useTodosStore } from "../stores/todoStore";
const todoStore = useTodosStore();

const datepickerInput = ref(null);

const todoItems = ref([]);

watch(
	() => todoStore.todos,
	(newTodos) => {
		todoItems.value = newTodos.map((todo, index) => ({
			id: todo.id || index,
			activity: todo.activity_name,
			dueDate: todo.due_date.split("T")[0],
			completed: todo.is_completed,
		}));
	},
	{ deep: true, immediate: true }
);

onMounted(async () => {
	if (datepickerInput.value) {
		new AirDatepicker(datepickerInput.value, {
			autoClose: true,
			dateFormat: "yyyy-MM-dd",
			async onSelect({ date }) {
				// Fix: Use local date instead of UTC
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				const selectedDate = `${year}-${month}-${day}`;

				newTodo.value.dueDate = selectedDate;
				console.log("Selected date:", selectedDate);
				await todoStore.fetchTodosByDate(selectedDate);

				todoItems.value = todoStore.todosByDate.map((todo, index) => ({
					id: todo.id || index,
					activity: todo.activity_name,
					dueDate: todo.due_date.split("T")[0],
					assignedTo: todo.contact_id,
					completed: todo.is_completed,
				}));
			},
		});
	}

	await todoStore.fetchTodos();

	todoItems.value = todoStore.todos.map((todo, index) => ({
		id: todo.id || index, // use actual id if available, otherwise use index
		activity: todo.activity_name,
		dueDate: todo.due_date.split("T")[0],

		assignedTo: todo.contact_id,
		// use a fallback if not present
		completed: todo.is_completed,
	}));
});

// const todoItems = ref([
// 	{
// 		activity: "Dokončiť projektovú dokumentáciu",
// 		dueDate: "2025-06-15",
// 		assignedTo: "Adam Hruska",
// 		completed: false,
// 	},
// 	{
// 		activity: "Pripraviť prezentáciu",
// 		dueDate: "2025-06-10",
// 		assignedTo: "Lucia Kováčová",
// 		completed: true,
// 	},
// 	{
// 		activity: "Kontaktovať dodávateľa",
// 		dueDate: "2025-05-25",
// 		assignedTo: "Peter Novák",
// 		completed: false,
// 	},
// ]);

// Define the table columns
const columns = [
	{
		key: "activity",
		label: "Aktivita",
	},
	{
		key: "dueDate",
		label: "Termín dokončenia",
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
		key: "actions",
		label: "Akcie",
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

// Function to format date
const formatDate = (dateString) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("sk-SK");
};

// Add new todo item
const newTodo = ref({
	activity: "",
	dueDate: "",
	assignedTo: "",
	completed: false,
});

const addTodo = () => {
	if (
		newTodo.value.activity &&
		newTodo.value.dueDate &&
		newTodo.value.assignedTo
	) {
		const newId =
			todoItems.value.length > 0
				? Math.max(...todoItems.value.map((item) => item.id || 0)) + 1
				: 1;
		todoItems.value.push({
			...newTodo.value,
			id: newId,
		});
		// Reset form
		newTodo.value = {
			activity: "",
			dueDate: "",
			assignedTo: "",
			completed: false,
		};
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
	router.push(`/contact/${id}`);
};

const markAsDDone = async (id) => {
	await todoStore.updateTodo(id, {
		activity_name: todoItems.value.find((item) => item.id === id).activity,
		due_date: todoItems.value.find((item) => item.id === id).dueDate,
		is_completed: true,
	});
};

const resetDate = () => {
	console.log("resetDate");

	newTodo.value.dueDate = "";
	todoStore.fetchTodos();
	todoItems.value = todoStore.todos.map((todo, index) => ({
		id: todo.id || index,
		activity: todo.activity_name,
		dueDate: todo.due_date.split("T")[0],
		completed: todo.is_completed,
	}));
};
</script>

<template>
	<loadigcomponent v-if="todoStore.loadingState" />
	<div>
		<UpdateToDoForm
			v-if="showUpdateForm"
			@cancelToDoActivity="toggleUpdateForm"
			:item="selectedItem"
		/>
		/>
		<!-- <addToDoForm /> -->
		<h1 class="heading">ToDo Zoznam</h1>

		<div class="todo-container">
			<!-- Add new todo form -->
			<div class="left">
				<div class="date-picker">
					<div>Vyberte dátum:</div>
					<input
						type="text"
						id="datepicker"
						ref="datepickerInput"
						v-model="newTodo.dueDate"
						readonly
						class="datepicker-input"
					/>
					<button class="reset-button" @click="resetDate">Reset</button>
				</div>

				<div class="add-form">
					<h3 class="form-title">Pridať novú úlohu</h3>
					<div class="form-group">
						<label for="activity">Aktivita:</label>
						<input type="text" id="activity" v-model="newTodo.activity" />
					</div>

					<div class="form-group">
						<label for="date">Termín:</label>
						<input type="date" id="date" v-model="newTodo.dueDate" />
					</div>

					<button class="add-button" @click="addTodo">Pridať úlohu</button>
				</div>
			</div>

			<!-- Todo list table -->
			<div class="right">
				<table class="todo-table">
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
							:class="{ 'completed-row': item.completed }"
						>
							<td>{{ item.activity }}</td>
							<td>{{ formatDate(item.dueDate) }}</td>
							<td @click="goToContact(item.assignedTo)">
								{{ item.assignedTo }}
							</td>
							<td>
								<input
									type="checkbox"
									:checked="item.completed"
									@change="toggleCompleted(index)"
									class="checkbox"
								/>
							</td>
							<td>
								<button class="edit-button" @click="toggleUpdateForm(item)">
									Upraviť
								</button>
							</td>

							<td>
								<button class="delete-button" @click="deleteToDo(item.id)">
									Vymazať
								</button>
							</td>

							<td>
								<button class="done-button" @click="markAsDDone(item.id)">
									Dokončené
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<style scoped>
input {
	background-color: white;
	border-radius: 6px;
	border: 1px solid #ddd;
	padding-left: 10px;
}

.date-picker {
	width: 100%;
	padding: 16px;
	display: flex;
	justify-content: space-between;
	margin-bottom: 10px;
	padding-top: 0;
	background-color: #f5f5f5;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
	width: 25%;
	padding: 20px;
}

.add-form {
	background-color: #f5f5f5;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.edit-button {
	background-color: #2196f3;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
}

.edit-button:hover {
	background-color: #1976d2;
}

.delete-button {
	background-color: red;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
}

.delete-button:hover {
	background-color: #d32f2f;
}

.reset-button {
	background-color: #2196f3;
	color: white;
	border: none;
	padding: 1px 10px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
}

.reset-button:hover {
	background-color: #1976d2;
}

.done-button {
	background-color: #4caf50;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
}

.done-button:hover {
	background-color: #45a049;
}

.right {
	width: 75%;
	padding: 20px;
}

.todo-table {
	width: 100%;
	border-collapse: collapse;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	background-color: white;
}

.todo-table th,
.todo-table td {
	padding: 12px 15px;
	text-align: left;
	border-bottom: 1px solid #ddd;
}

.todo-table th {
	background-color: #f2f2f2;
	font-weight: bold;
	color: #333;
}

.todo-table tr:hover {
	background-color: #f9f9f9;
}

.checkbox {
	width: 18px;
	height: 18px;
	cursor: pointer;
}

.completed-row {
	background-color: #e8f5e9;
	color: #666;
}

.completed-row td:first-child {
	text-decoration: line-through;
}
</style>
