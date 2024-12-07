import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

import { useCalendarstore } from "#imports";

export const useUserStore = defineStore("user", {
	// Note the change from "auth" to "user"
	state: () => ({
		user: null,
		allUsers: [],
		sharedUsers: [],
		shareIdArray: [],
		loadingState: false,
		error: null,
	}),

	actions: {
		// Explicitly define as an action
		async fetchUser() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			this.error = null;

			try {
				const response = await axios.get(`${config.public.apiUrl}get-user`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				// Ensure data exists before setting
				if (response.data && response.data.user) {
					this.user = response.data.user;
				} else {
					console.error("No user data in response");
					this.user = null;
				}
			} catch (error) {
				console.error("Error fetching user:", error);
				this.error = error.message;
				this.user = null;
				throw error; // Re-throw to allow component to handle
			}
		},

		async fetchUsers() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			try {
				const response = await axios.get(`${config.public.apiUrl}get-users`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				//console.log("API response:", response.data);

				// Ensure `users` is an array
				if (Array.isArray(response.data.users)) {
					this.allUsers = response.data.users;
				} else {
					console.error("Invalid users data format in response");
					this.allUsers = [];
				}
			} catch (error) {
				console.error("Error fetching users:", error);
				this.error = error.message;
				this.allUsers = [];
				throw error; // Re-throw to allow component to handle
			}
		},

		getSharedUsers() {
			if (!Array.isArray(this.allUsers)) {
				console.error("allUsers is not an array");
				return;
			}

			if (!this.user || !this.user.share_user_id) {
				console.error("User or share_user_id is not available");
				return;
			}

			// Use `this.shareIdArray` correctly
			this.shareIdArray = JSON.parse(this.user.share_user_id).map(Number);

			//console.log("Parsed share_user_id array:", this.shareIdArray);

			this.sharedUsers = this.allUsers.filter((user) =>
				this.shareIdArray.includes(user.id)
			);

			//console.log("Filtered shared users:", this.sharedUsers);
		},

		// async deleteSharedUser(id) {
		// 	try {
		// 		// Remove the user ID from the shareIdArray
		// 		this.shareIdArray = this.shareIdArray.filter((userId) => userId !== id);

		// 		// Update sharedUsers
		// 		this.sharedUsers = this.allUsers.filter((user) =>
		// 			this.shareIdArray.includes(user.id)
		// 		);

		// 		// Update the user in the database
		// 		const config = useRuntimeConfig();
		// 		const authStore = useAuthStore();
		// 		const token = authStore.token;

		// 		await axios.post(
		// 			`${config.public.apiUrl}null-share-id/${id}`,
		// 			{},
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${authStore.token}`,
		// 				},
		// 			}
		// 		);

		// 		// await axios.put(
		// 		// 	`${config.public.apiUrl}update-user`,
		// 		// 	{
		// 		// 		share_user_id: JSON.stringify(this.shareIdArray), // Send the updated array as JSON
		// 		// 	},
		// 		// 	{
		// 		// 		headers: {
		// 		// 			Authorization: `Bearer ${token}`,
		// 		// 		},
		// 		// 	}
		// 		// );

		// 		// Update the local user object
		// 		this.user.share_user_id = JSON.stringify(this.shareIdArray);

		// 		console.log(`User with ID ${id} removed from shared list.`);
		// 	} catch (error) {
		// 		console.error("Error deleting shared user:", error);
		// 		throw error;
		// 	}
		// },

		async deleteSharedUser(id) {
			this.loadingState = true;
			try {
				const config = useRuntimeConfig();
				const authStore = useAuthStore();
				const token = authStore.token;

				// Backend API call to remove shared user
				await axios.post(
					`${config.public.apiUrl}null-share-id/${id}`,
					{},
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				// Update local state
				this.sharedUsers = this.sharedUsers.filter((user) => user.id !== id);
				const calendarStore = useCalendarstore();
				calendarStore.removeSharedActivitiesByUser(id);

				// Update calendar UI
				calendarStore.updateCalendarEvents();
			} catch (error) {
				console.error("Error deleting shared user:", error);
			} finally {
				this.loadingState = false;
			}
		},
	},

	getters: {
		getUser: (state) => state.user,
		getAllUsers: (state) => state.allUsers,
		// getSharedUsers: (state) => state.sharedUsers,
	},
});
