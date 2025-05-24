// stores/contactsStore.js
import { defineStore } from "pinia";
const config = useRuntimeConfig();
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "vue-toastification";

export const useContactsStore = defineStore("contacts", {
	state: () => ({
		contacts: [],
		page: null,
		prev_page_url: null,
		next_page_url: null,
		loadingState: false,
		lastShowenDetails: null,
	}),
	actions: {
		// Fetch contacts from the API using token from authStore
		async goToPage(pageNumber) {
			this.loadingState = true;
			const authStore = useAuthStore();
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(
					`${config.public.apiUrl}contacts?page=${pageNumber}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.prev_page_url = response.data.contacts.prev_page_url;
				this.next_page_url = response.data.contacts.next_page_url;
				this.page = response.data.contacts.current_page;
				this.contacts = response.data.contacts;
			} catch (error) {
				console.error("Error fetching contacts page:", error.response || error);
				const toast = useToast();
				toast.error("Nepodarilo sa načítať kontakty");
			}
			this.loadingState = false;
		},

		async fetchContacts() {
			this.loadingState = true;
			const authStore = useAuthStore(); // Access authStore
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(`${config.public.apiUrl}contacts`, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				this.prev_page_url = response.data.contacts.prev_page_url;
				this.next_page_url = response.data.contacts.next_page_url;
				this.page = response.data.contacts.current_page;
				this.contacts = response.data.contacts; // Store contacts in state
			} catch (error) {
				console.error("Error fetching contacts:", error.response || error);
			}
			this.loadingState = false;
		},

		async nextPage() {
			this.loadingState = true;
			const authStore = useAuthStore(); // Access authStore
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(this.next_page_url, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				this.prev_page_url = response.data.contacts.prev_page_url;
				this.next_page_url = response.data.contacts.next_page_url;
				this.page = response.data.contacts.current_page;
				this.contacts = response.data.contacts; // Store contacts in state
			} catch (error) {
				console.error("Error fetching contacts:", error.response || error);
			}
			this.loadingState = false;
		},

		async prevPage() {
			this.loadingState = true;
			const authStore = useAuthStore(); // Access authStore
			const token = authStore.token;

			if (!token) {
				console.error("Token not found. Please log in.");
				return;
			}

			try {
				const response = await axios.get(this.prev_page_url, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				this.prev_page_url = response.data.contacts.prev_page_url;
				this.next_page_url = response.data.contacts.next_page_url;
				this.page = response.data.contacts.current_page;
				this.contacts = response.data.contacts; // Store contacts in state
			} catch (error) {
				console.error("Error fetching contacts:", error.response || error);
			}
			this.loadingState = false;
		},

		async deleteContact(id) {
			const toast = useToast();
			this.loadingState = true;
			const authStore = useAuthStore(); // Access authStore
			const token = authStore.token;

			try {
				const response = await axios.delete(
					`${config.public.apiUrl}delete-delete-contact/${id}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.contacts.data = this.contacts.data
					.filter((contact) => contact.id !== id)
					// Optional: ensure we're dealing with plain objects
					.map((contact) => ({ ...contact }));

				console.log(this.contacts.data);
				if (response.status === 201 || response.status === 200) {
					toast.success("Kontakt bol úspešne zmazaný");
				}
			} catch (error) {
				console.error("Error deleting contact:", error.response || error);
				toast.error("Kontakt sa nepodarilo zmazať");
			}
			this.loadingState = false;
		},

		// async updatePerson(updatedContact) {
		// 	this.loadingState = true;
		// 	try {
		// 		// Find the index of the contact to update
		// 		const index = this.contacts.data.findIndex(
		// 			(person) => person.id === updatedContact.id
		// 		);

		// 		// If contact is found, replace it with the updated contact
		// 		if (index !== -1) {
		// 			// Create a new array to ensure reactivity
		// 			this.contacts.data = [
		// 				...this.contacts.data.slice(0, index),
		// 				{ ...updatedContact },
		// 				...this.contacts.data.slice(index + 1),
		// 			];
		// 		}
		// 		this.loadingState = false;
		// 		return true;
		// 	} catch (error) {
		// 		console.error("Error updating contact in store:", error);
		// 		this.loadingState = false;
		// 		throw error;
		// 	}
		// },

		async updatePerson(updatedContact) {
			this.loadingState = true;
			try {
				// Check if contacts and data exist before trying to find the index
				if (!this.contacts || !this.contacts.data) {
					console.warn(
						"Contacts data not initialized. Initializing with the updated contact."
					);
					this.contacts = { data: [updatedContact] };
					this.loadingState = false;
					return true;
				}

				// Find the index of the contact to update
				const index = this.contacts.data.findIndex(
					(person) => person.id === updatedContact.id
				);

				// If contact is found, replace it with the updated contact
				if (index !== -1) {
					// Create a new array to ensure reactivity
					this.contacts.data = [
						...this.contacts.data.slice(0, index),
						{ ...updatedContact },
						...this.contacts.data.slice(index + 1),
					];
				} else {
					// If contact not found in the array, add it
					this.contacts.data.push({ ...updatedContact });
				}

				this.loadingState = false;
				return true;
			} catch (error) {
				console.error("Error updating contact in store:", error);
				this.loadingState = false;
				throw error;
			}
		},

		addToContactsStore(addedPeople) {
			const toast = useToast();
			this.loadingState = true;
			if (addedPeople && addedPeople.length > 0) {
				// Ensure contacts.data exists and is an array
				if (!this.contacts.data) {
					this.contacts.data = [];
				}

				// Add new people to the beginning of the data array
				this.contacts.data.unshift(...addedPeople);
				toast.success("Kontakt bol pridaný");
			}
			this.loadingState = false;
		},

		// Clear contacts from the store
		clearContacts() {
			this.contacts = [];
		},
	},
	getters: {
		// Getter to return all contacts
		getContacts: (state) => state.contacts,
		getLoadingState: (state) => state.loadingState,
	},
});
