import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { set } from "date-fns";
import { useToast } from "vue-toastification";

const config = useRuntimeConfig();

export const useCallListStore = defineStore("callList", {
	// Note the change from "auth" to "user"
	state: () => ({
		callLists: [],
		singleCallList: {},
		error: null,
		loadingState: false,
		selectedCallList: null,
		selectedCallListPeople: [],
	}),

	actions: {
		async fetchCallLists() {
			this.loadingState = true;
			const authStore = useAuthStore(); // Access authStore
			const token = authStore.token;
			try {
				const response = await axios.get(`${config.public.apiUrl}call-lists`, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				this.callLists = response.data;
				// console.log(call_lists.value);
			} catch (error) {
				console.error("Error fetching:", error);
				// Handle the error, e.g., display an error message to the user
			}
			this.loadingState = false;
		},
		async getCallListById(id) {
			this.loadingState = true;

			// Find the call list with the matching id in the callLists state
			const callList = this.callLists.find((list) => list.id === id);
			this.singleCallList = callList;
			this.loadingState = false;
		},
		async deleteCallList(id) {
			const toast = useToast();
			this.loadingState = true;
			const authStore = useAuthStore(); // Access authStore
			const token = authStore.token;
			try {
				// API call to delete the call list
				const response = await axios.delete(
					`${config.public.apiUrl}call-lists/${id}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					},
				);

				// Remove the deleted call list from the state
				this.callLists = this.callLists.filter((list) => list.id !== id);

				// Notify user if the call was successful
				if (response.status === 200) {
					toast.success("Call list deleted successfully");
				}
			} catch (error) {
				// Handle errors
				console.error(
					"Error deleting call list:",
					error.response?.data || error.message,
				);
				toast.error("Failed to delete call list");
			}
			this.loadingState = false;
		},

		// delete contact from call list
		// delete contact from call list
		async deletePersonStore(id, callListId) {
			const authStore = useAuthStore();
			try {
				const response = await axios.delete(
					`${config.public.apiUrl}call-lists/${callListId}/contacts/${id}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					},
				);

				// Update the local callLists cache so contact_ids stays in sync
				const callList = this.callLists.find((list) => list.id === callListId);
				if (callList) {
					callList.contact_ids = response.data.contact_ids;
				}
				if (this.singleCallList?.id === callListId) {
					this.singleCallList.contact_ids = response.data.contact_ids;
				}

				// Update the reactive people list shown in the UI
				this.selectedCallListPeople = this.selectedCallListPeople.filter(
					(person) => person.id !== id,
				);

				return response;
			} catch (error) {
				console.error("Error removing contact from call list:", error);
				if (error.response) {
					console.error("Validation errors:", error.response.data);
				}
				throw error; // Let the caller (e.g. a toast) handle user-facing errors
			}
		},

		addCallList(callList) {
			this.callLists.push(callList);
			console.log("call list added to store");
		},

		setSelectedCallList(callList) {
			this.selectedCallList = callList;
		},

		setSelectedCallListPeople(people) {
			this.selectedCallListPeople = people;
		},
	},

	getters: {
		getCallLists: (state) => state.callLists,
		getSingleCallList: (state) => state.singleCallList,
		getLoadingState: (state) => state.loadingState,
	},
});
