import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

export const useRequestStore = defineStore("request", {
	// Note the change from "auth" to "user"
	state: () => ({
		allRequests: [],
		viewTheirCalendar: [],
		letThemViewMine: [],
		loadingState: false,
		deletingIds: [],
		error: null,
	}),

	actions: {
		async fetchViewTheirCalendar() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-their-requests`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.viewTheirCalendar = response.data.requests;
				console.log("viewTheirCalendar", this.viewTheirCalendar);
			} catch (error) {
				console.error("Error fetching user:", error);
				this.error = error.message;
				this.user = null;
				throw error; // Re-throw to allow component to handle
			}
		},

		async fetchLetThemViewMine() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-mine-requests`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.letThemViewMine = response.data.requests;
				console.log("letThemViewMine", this.letThemViewMine);
			} catch (error) {
				console.error("Error fetching user:", error);
				this.error = error.message;
				this.user = null;
				throw error; // Re-throw to allow component to handle
			}
		},

		async deleteRequest(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;
			this.deletingIds.push(id);

			try {
				const response = await axios.delete(
					`${config.public.apiUrl}delete-sharing-requests/${id}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				// Remove the deleted invite from the local store's viewTheirCalendar state
				this.viewTheirCalendar = this.viewTheirCalendar.filter(
					(invite) => invite.id !== id
				);
			} catch (error) {
				console.error("Error deleting request:", error);
				this.error = error.message;
				throw error;
			} finally {
				// Remove ID from loading state whether successful or not
				this.deletingIds = this.deletingIds.filter(
					(loadingId) => loadingId !== id
				);
			}
		},

		async approveRequest(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}add-sharing-id/${id}`,
					{}, // Empty object as body since you don't need to send data
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
			} catch (error) {
				console.error("Error deleting request:", error);
				this.error = error.message;
				throw error;
			}
		},

		async requestToSeeTheirCalendar(userId, first_name, last_name) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			const fullName = first_name + " " + last_name;

			const requestData = {
				target_user_name: fullName,
				target_user_id: userId,
				type: "view_their_calendar",
				status: "pending",
			};

			userId, first_name, last_name;

			this.error = null;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}post-sharing-request`,
					requestData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.viewTheirCalendar = [
					...this.viewTheirCalendar,
					response.data.data,
				];
			} catch (error) {
				console.error("Error deleting request:", error);
				this.error = error.message;
				throw error;
			}
		},

		async requestToShowMyCalendar(userId, first_name, last_name) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			const fullName = first_name + " " + last_name;

			const requestData = {
				target_user_name: fullName,
				target_user_id: userId,
				type: "let_them_view_mine",
				status: "pending",
			};

			userId, first_name, last_name;

			this.error = null;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}post-sharing-request`,
					requestData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.letThemViewMine = [...this.letThemViewMine, response.data.data];
			} catch (error) {
				console.error("Error deleting request:", error);
				this.error = error.message;
				throw error;
			}
		},
	},

	getters: {
		getAllRequests: (state) => state.allRequests,
		getviewTheirCalendarRequests: (state) => state.viewTheirCalendar,
		getletThemViewMineRequests: (state) => state.letThemViewMine,
	},
});
