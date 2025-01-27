import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "#imports";

export const useRequestStore = defineStore("request", {
	// Note the change from "auth" to "user"
	state: () => ({
		allRequests: [],
		viewTheirCalendar: [],
		viewTheirCalendarForApproval: [],
		letThemViewMine: [],
		history: [],
		loadingState: false,
		deletingIds: [],
		error: null,
		letThemViewMineSkuska: [],
		letThemViewMineTabulka: [],
		seesMyCalendar: [],
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

		async fetchViewTheirCalendarForApproval() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-their-requests-approval`,
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

		async fetchLetThemViewMineTabulka5() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-mine-requests-tabulka`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.letThemViewMineTabulka = response.data.requests;
				console.log("letThemViewMineTabulka", this.letThemViewMineTabulka);
			} catch (error) {
				console.error("Error fetching user:", error);
				this.error = error.message;
				this.user = null;
				throw error; // Re-throw to allow component to handle
			}
		},

		async fetchLetThemViewMineSkuska() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-mine-requests-skuska`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.letThemViewMineSkuska = response.data.requests;
				console.log("letThemViewMineSkuska", this.letThemViewMineSkuska);
			} catch (error) {
				console.error("Error fetching user:", error);
				this.error = error.message;
				this.user = null;
				throw error; // Re-throw to allow component to handle
			}
		},

		async fetchLetThemViewMineForApproval() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-mine-requests-approval`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.viewTheirCalendarForApproval = response.data.requests;
				console.log(
					"letThemViewMineapproval",
					this.viewTheirCalendarForApproval
				);
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

		async deleteRequestSkuska(id) {
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
				this.letThemViewMineSkuska = this.letThemViewMineSkuska.filter(
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

		async deleteRequestTable5(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;
			this.deletingIds.push(id);

			try {
				const response = await axios.delete(
					`${config.public.apiUrl}delete-sharing-requests-table /${id}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				// Remove the deleted invite from the local store's viewTheirCalendar state
				this.letThemViewMineSkuska = this.letThemViewMineSkuska.filter(
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

		async approveRequest(id, requestId) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}add-sharing-id/${id}/${requestId}`,
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

		// async approveRequestTable5(id, requestId) {
		// 	const config = useRuntimeConfig();
		// 	const authStore = useAuthStore();
		// 	const userStore = useUserStore();
		// 	const token = authStore.token;

		// 	this.error = null;

		// 	try {
		// 		const response = await axios.post(
		// 			`${config.public.apiUrl}add-sharing-id-table/${id}/${requestId}`,
		// 			{}, // Empty object as body since you don't need to send data
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${token}`,
		// 				},
		// 			}
		// 		);
		// 		this.letThemViewMineTabulka = this.letThemViewMineTabulka.filter(
		// 			(invite) => invite.id !== requestId
		// 		);
		// 		const approvedUser = this.allUsers.find((user) => user.id === id);
		// 		if (approvedUser) {
		// 			userStore.sharedUsers.push(approvedUser);
		// 		}
		// 	} catch (error) {
		// 		console.error("Error deleting request:", error);
		// 		this.error = error.message;
		// 		throw error;
		// 	}
		// },

		async approveRequestTable5(id, requestId) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}add-sharing-id-table/${id}/${requestId}`,
					{},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				// Remove from pending requests
				this.letThemViewMineTabulka = this.letThemViewMineTabulka.filter(
					(invite) => invite.id !== requestId
				);

				// Find the approved user from the request data
				const approvedRequest = this.letThemViewMineTabulka.find(
					(request) => request.id === requestId
				);

				if (approvedRequest) {
					// Create a user object from the request data
					const newSharedUser = {
						id: approvedRequest.requester_id,
						username: approvedRequest.requester_name,
					};

					// Add to sharedUsers in userStore
					userStore.addSharedUser(newSharedUser);
				}
			} catch (error) {
				console.error("Error approving request:", error);
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

				if (response.status == 201) {
					alert("Požiadavka bola úspešne odoslaná");
				}
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
				this.letThemViewMineSkuska = [
					...this.letThemViewMineSkuska,
					response.data.data,
				];
				if (response.status == 201) {
					alert("Požiadavka bola úspešne odoslaná");
				}
			} catch (error) {
				console.error("Error deleting request:", error);
				this.error = error.message;
				throw error;
			}
		},

		async getHistory() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-requests-history`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				console.log("historia", response.data.requests);
				this.history = response.data.requests;
			} catch (error) {
				console.error("Error fetching history:", error);
				this.error = error.message;
				throw error;
			}
		},
		//

		async WhoSeesMyCal() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}who-see-my-cal`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				console.log("who-see-my-cal", response.data.requests);
				this.seesMyCalendar = response.data.requests;
			} catch (error) {
				console.error("Error fetching history:", error);
				this.error = error.message;
				throw error;
			}
		},

		async deleteRequestSeesMyCal(id) {
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

				this.seesMyCalendar = this.seesMyCalendar.filter(
					(invite) => invite.id !== id
				);
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
