// stores/todosStore.js
import { defineStore } from "pinia";
const config = useRuntimeConfig();
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "vue-toastification";

export const useTodosStore = defineStore("todos", {
	state: () => ({
		todos: [],
		todosByDate: [],
		todosByContact: [],
		loadingState: false,
		selectedDate: null,
		selectedContactId: null,
	}),
	actions: {
		// Fetch all todos for the authenticated user
		async fetchTodos() {
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(`${config.public.apiUrl}todos`, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				this.todos = response.data.data;
				console.log("Todos fetched successfully:", this.todos);
			} catch (error) {
				console.error("Error fetching todos:", error.response || error);
				const toast = useToast();
				toast.error("Nepodarilo sa načítať úlohy");
			}
			this.loadingState = false;
		},

		// Create a new todo
		async createTodo(todoData) {
			const toast = useToast();
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return false;
			}

			try {
				const response = await axios.post(
					`${config.public.apiUrl}todos`,
					{
						activity_name: todoData.activity_name,
						due_date: todoData.due_date,
						contact_id: todoData.contact_id,
					},
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				if (response.status === 201) {
					// Add the new todo to the beginning of the array
					this.todos.unshift(response.data.data);
					toast.success("Úloha bola úspešne vytvorená");
					this.loadingState = false;
					return true;
				}
			} catch (error) {
				console.error("Error creating todo:", error.response || error);
				if (error.response?.data?.errors) {
					// Handle validation errors
					const errors = error.response.data.errors;
					Object.keys(errors).forEach((key) => {
						errors[key].forEach((message) => {
							toast.error(message);
						});
					});
				} else {
					toast.error("Nepodarilo sa vytvoriť úlohu");
				}
				return false;
			}
			this.loadingState = false;
		},

		// Update an existing todo
		async updateTodo(todoId, todoData) {
			const toast = useToast();
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				this.loadingState = false; // Don't forget to set loading to false
				return false;
			}

			try {
				const response = await axios.put(
					`${config.public.apiUrl}todos/${todoId}`,
					todoData,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				if (response.status === 200) {
					// Update the todo in the array
					this.updateTodoInStore(response.data.data);
					toast.success("Úloha bola úspešne aktualizovaná");
					this.loadingState = false; // Set loading to false on success
					return true;
				}
			} catch (error) {
				console.error("Error updating todo:", error.response || error);
				if (error.response?.data?.errors) {
					const errors = error.response.data.errors;
					Object.keys(errors).forEach((key) => {
						errors[key].forEach((message) => {
							toast.error(message);
						});
					});
				} else {
					toast.error("Nepodarilo sa aktualizovať úlohu");
				}
				this.loadingState = false; // Set loading to false on error
				return false;
			}
		},

		// Delete a todo
		async deleteTodo(todoId) {
			const toast = useToast();
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return false;
			}

			try {
				const response = await axios.delete(
					`${config.public.apiUrl}todos/${todoId}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				if (response.status === 200) {
					// Remove the todo from all arrays
					this.todos = this.todos.filter((todo) => todo.id !== todoId);
					this.todosByDate = this.todosByDate.filter(
						(todo) => todo.id !== todoId
					);
					this.todosByContact = this.todosByContact.filter(
						(todo) => todo.id !== todoId
					);

					toast.success("Úloha bola úspešne zmazaná");
					this.loadingState = false;
					return true;
				}
			} catch (error) {
				console.error("Error deleting todo:", error.response || error);
				toast.error("Nepodarilo sa zmazať úlohu");
				return false;
			}
			this.loadingState = false;
		},

		// Fetch todos by specific date
		async fetchTodosByDate(date) {
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(
					`${config.public.apiUrl}todos-by-date?date=${date}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.todosByDate = response.data.data;
				this.selectedDate = date;
			} catch (error) {
				console.error("Error fetching todos by date:", error.response || error);
				const toast = useToast();
				toast.error("Nepodarilo sa načítať úlohy pre vybraný dátum");
			}
			this.loadingState = false;
		},

		// Fetch todos by specific contact
		async fetchTodosByContact(contactId) {
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(
					`${config.public.apiUrl}todos-by-contact?contact_id=${contactId}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.todosByContact = response.data.data;
				this.selectedContactId = contactId;
			} catch (error) {
				console.error(
					"Error fetching todos by contact:",
					error.response || error
				);
				const toast = useToast();
				toast.error("Nepodarilo sa načítať úlohy pre vybraný kontakt");
			}
			this.loadingState = false;
		},

		// Toggle todo completion status
		async toggleTodoComplete(todoId) {
			const toast = useToast();
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return false;
			}

			try {
				const response = await axios.patch(
					`${config.public.apiUrl}todos/${todoId}/toggle-complete`,
					{},
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				if (response.status === 200) {
					// Update the todo in all arrays
					this.updateTodoInStore(response.data.data);
					const status = response.data.data.is_completed
						? "dokončená"
						: "nedokončená";
					toast.success(`Úloha je teraz ${status}`);
					return true;
				}
			} catch (error) {
				console.error(
					"Error toggling todo completion:",
					error.response || error
				);
				toast.error("Nepodarilo sa zmeniť stav úlohy");
				return false;
			}
			this.loadingState = false;
		},

		// Get a single todo by ID
		async fetchTodo(todoId) {
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return null;
			}

			try {
				const response = await axios.get(
					`${config.public.apiUrl}todos/${todoId}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				return response.data.data;
			} catch (error) {
				console.error("Error fetching todo:", error.response || error);
				const toast = useToast();
				toast.error("Nepodarilo sa načítať úlohu");
				return null;
			}
			this.loadingState = false;
		},

		// Helper function to update todo in all relevant arrays
		updateTodoInStore(updatedTodo) {
			// Update in main todos array
			const mainIndex = this.todos.findIndex(
				(todo) => todo.id === updatedTodo.id
			);
			if (mainIndex !== -1) {
				this.todos[mainIndex] = { ...updatedTodo };
			}

			// Update in todosByDate array
			const dateIndex = this.todosByDate.findIndex(
				(todo) => todo.id === updatedTodo.id
			);
			if (dateIndex !== -1) {
				this.todosByDate[dateIndex] = { ...updatedTodo };
			}

			// Update in todosByContact array
			const contactIndex = this.todosByContact.findIndex(
				(todo) => todo.id === updatedTodo.id
			);
			if (contactIndex !== -1) {
				this.todosByContact[contactIndex] = { ...updatedTodo };
			}
		},

		// Clear all todos from the store
		clearTodos() {
			this.todos = [];
			this.todosByDate = [];
			this.todosByContact = [];
			this.selectedDate = null;
			this.selectedContactId = null;
		},

		// Add a new todo to the store (for real-time updates)
		addTodoToStore(newTodo) {
			this.todos.unshift({ ...newTodo });
		},

		async fetchTodosWithoutContact() {
			try {
				this.loadingState = true;

				const response = await $fetch("/api/todos/without-contact", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token.value}`,
					},
				});

				if (response.success) {
					// You might want to store these separately or merge with existing todos
					// For now, I'll assume you want to replace the current todos
					todos.value = response.data;
					return response.data;
				} else {
					throw new Error(
						response.message || "Failed to fetch todos without contact"
					);
				}
			} catch (error) {
				console.error("Error fetching todos without contact:", error);
				throw error;
			} finally {
				this.loadingState = false;
			}
		},

		async createTodoWithoutContact(todoData) {
			const authStore = useAuthStore();
			const token = authStore.token;
			try {
				this.loadingState = true; // or loadingState.value = true

				const response = await $fetch("/api/todos/without-contact", {
					method: "POST",
					body: todoData,
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token.value}`,
					},
				});

				if (response.success) {
					// Add the new todo to the existing todos array
					todos.value.unshift(response.data);
					return response.data;
				} else {
					throw new Error(response.message || "Failed to create todo");
				}
			} catch (error) {
				console.error("Error creating todo without contact:", error);
				throw error;
			} finally {
				this.loadingState = false; // or loadingState.value = false
			}
		},
	},
	getters: {
		// Get all todos
		getTodos: (state) => state.todos,

		// Get todos by date
		getTodosByDate: (state) => state.todosByDate,

		// Get todos by contact
		getTodosByContact: (state) => state.todosByContact,

		// Get loading state
		getLoadingState: (state) => state.loadingState,

		// Get completed todos
		getCompletedTodos: (state) =>
			state.todos.filter((todo) => todo.is_completed),

		// Get pending todos
		getPendingTodos: (state) =>
			state.todos.filter((todo) => !todo.is_completed),

		// Get overdue todos
		getOverdueTodos: (state) => {
			const today = new Date().toISOString().split("T")[0];
			return state.todos.filter(
				(todo) => !todo.is_completed && todo.due_date < today
			);
		},

		// Get todos due today
		getTodosForToday: (state) => {
			const today = new Date().toISOString().split("T")[0];
			return state.todos.filter((todo) => todo.due_date === today);
		},

		// Get selected date
		getSelectedDate: (state) => state.selectedDate,

		// Get selected contact ID
		getSelectedContactId: (state) => state.selectedContactId,
	},
});
