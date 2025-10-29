import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

import { useCalendarstore } from "@/stores/calendarStore";

import { useToast } from "vue-toastification";

export const useUserStore = defineStore("user", {
	// Note the change from "auth" to "user"
	state: () => ({
		user: null,
		selected_calendar_names: [],
		allUsers: [],
		allUsersAdmin: [],
		allUsersAdminALL: [],
		sharedUsers: [],
		shareIdArray: [],
		loadingState: false,
		error: null,
		vizitka_name: "",
		vizitka_position: "",
		vizitka_email: "",
		vizitka_phone_num: "",
	}),

	actions: {
		// Explicitly define as an action

		addSharedUser(user) {
			// Check if user already exists in sharedUsers
			const exists = this.sharedUsers.some((u) => u.id === user.id);
			if (!exists) {
				this.sharedUsers.push(user);
			}
		},

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
					console.log("Fetched user:", this.user);
					try {
						// Convert to string if it isn't already
						const rawValue = this.user.confirmed_share_user_id;
						const jsonString =
							typeof rawValue === "string"
								? rawValue
								: JSON.stringify(rawValue);

						// Parse the JSON string or fallback to an empty array
						this.user.confirmed_share_user_id = jsonString
							? JSON.parse(jsonString)
							: [];
						console.log(
							"confirmed_share_user_id:",
							this.user.confirmed_share_user_id
						);
					} catch (parseError) {
						console.error("Error parsing confirmed_share_user_id:", parseError);
						this.user.confirmed_share_user_id = []; // Fallback to an empty array
					}
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

		// getSharedUsers() {
		// 	if (!Array.isArray(this.allUsers)) {
		// 		console.error("allUsers is not an array");
		// 		return;
		// 	}

		// 	if (!this.user || !this.user.share_user_id) {
		// 		console.error("User or share_user_id is not available");
		// 		return;
		// 	}

		// 	// Use `this.shareIdArray` correctly
		// 	this.shareIdArray = JSON.parse(this.user.share_user_id).map(Number);

		// 	//console.log("Parsed share_user_id array:", this.shareIdArray);

		// 	this.sharedUsers = this.allUsers.filter((user) =>
		// 		this.shareIdArray.includes(user.id)
		// 	);

		// 	//console.log("Filtered shared users:", this.sharedUsers);
		// },

		getSharedUsers() {
			if (!Array.isArray(this.allUsers)) {
				console.error("allUsers is not an array");
				return;
			}

			if (!this.user || !this.user.share_user_id) {
				console.error("User or share_user_id is not available");
				return;
			}

			try {
				const rawShareUserId = this.user.share_user_id;
				const parsedShareUserId =
					typeof rawShareUserId === "string" &&
					rawShareUserId.trim().startsWith("[")
						? JSON.parse(rawShareUserId)
						: rawShareUserId;

				this.shareIdArray = Array.isArray(parsedShareUserId)
					? parsedShareUserId.map(Number)
					: [];

				this.sharedUsers = this.allUsers.filter((user) =>
					this.shareIdArray.includes(user.id)
				);
			} catch (error) {
				console.error("Error parsing share_user_id:", error);
				this.shareIdArray = [];
				this.sharedUsers = [];
			}
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

		// 		// await axios.post(
		// 		// 	`${config.public.apiUrl}null-share-id/${id}`,
		// 		// 	{},
		// 		// 	{
		// 		// 		headers: {
		// 		// 			Authorization: `Bearer ${authStore.token}`,
		// 		// 		},
		// 		// 	}
		// 		// );
		// 		console.log("test:");
		// 		await axios.post(
		// 			`${config.public.apiUrl}null-share-id/${id}`,
		// 			{},
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${authStore.token}`, // Ensure token is valid
		// 					"Content-Type": "application/json",
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

				// Call the API to remove shared user
				await axios.post(
					`${config.public.apiUrl}null-share-id/${id}`,
					{},
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					}
				);

				// Update local state
				this.shareIdArray = this.shareIdArray.filter((userId) => userId !== id);
				this.sharedUsers = this.sharedUsers.filter((user) => user.id !== id);

				// Update the user's share_user_id
				this.user.share_user_id = JSON.stringify(this.shareIdArray);

				// Get calendar store and remove activities
				const calendarStore = useCalendarstore();
				await calendarStore.removeSharedActivitiesByUser(id);
			} catch (error) {
				console.error("Error deleting shared user:", error);
				throw error;
			} finally {
				this.loadingState = false;
			}
		},

		// async deleteSharedUser(id) {
		// 	this.loadingState = true;
		// 	try {
		// 		const config = useRuntimeConfig();
		// 		const authStore = useAuthStore();
		// 		const token = authStore.token;

		// 		// Backend API call to remove shared user
		// 		await axios.post(
		// 			`${config.public.apiUrl}null-share-id/${id}`,
		// 			{},
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${authStore.token}`,
		// 				},
		// 			}
		// 		);

		// 		// Update local state
		// 		this.sharedUsers = this.sharedUsers.filter((user) => user.id !== id);
		// 		const calendarStore = useCalendarstore();
		// 		calendarStore.removeSharedActivitiesByUser(id);

		// 		// Update calendar UI
		// 		//calendarStore.updateCalendarEvents();
		// 	} catch (error) {
		// 		console.error("Error deleting shared user:", error);
		// 	} finally {
		// 		this.loadingState = false;
		// 	}
		// },

		async fetchAllUsersAdmin() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}all-users-admin`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				//console.log("API response:", response.data);

				// Ensure `users` is an array
				if (Array.isArray(response.data.users)) {
					this.allUsersAdmin = response.data.users;
					this.allUsersAdminALL = response.data.users;
				} else {
					console.error("Invalid users data format in response");
					this.allUsersAdmin = [];
				}
			} catch (error) {
				console.error("Error fetching users:", error);
				this.error = error.message;
				this.allUsersAdmin = [];
				this.allUsersAdminALL = [];
				throw error; // Re-throw to allow component to handle
			}
		},

		async deleteUserAdmin(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			try {
				const response = await axios.delete(
					`${config.public.apiUrl}delete-user/${id}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				this.allUsersAdmin = this.allUsersAdmin.filter(
					(user) => user.id !== id
				);
				this.allUsersAdminALL = this.allUsersAdminALL.filter(
					(user) => user.id !== id
				);
			} catch (error) {
				console.error("Error deleting user:", error);
				this.error = error.message;
				throw error;
			}
		},

		async userAddCalendarName(name, month, year) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;
			const calendarStore = useCalendarstore();
			const router = useRouter();

			if (!Array.isArray(this.selected_calendar_names)) {
				try {
					this.selected_calendar_names = JSON.parse(
						this.selected_calendar_names
					);
				} catch {
					this.selected_calendar_names = [];
				}
			}

			const index = this.selected_calendar_names.indexOf(name);

			if (index === -1) {
				this.selected_calendar_names.push(name);
				console.log("✅ Added calendar name:", this.selected_calendar_names);
			} else {
				this.selected_calendar_names.splice(index, 1);
				console.log("🗑️ Removed calendar name:", this.selected_calendar_names);
			}

			try {
				await axios.post(
					`${config.public.apiUrl}calendar-settings/save`,
					{
						calendar_names: this.selected_calendar_names,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				calendarStore.microsoftEventCache = {};
				await calendarStore.fetchMicrosoftEvents(month, year);
				//router.go(0);
			} catch (error) {
				console.error("❌ Error saving calendar names:", error);
				this.error = error.message;

				throw error;
			}
		},

		async userGetCalendarNames() {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			try {
				const response = await axios.get(
					`${config.public.apiUrl}calendar-settings/get`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				let data = response.data.selected_calendar_names;

				// ✅ Parse if it's a string
				if (typeof data === "string") {
					try {
						data = JSON.parse(data);
					} catch (e) {
						console.warn("Failed to parse calendar names, resetting to []");
						data = [];
					}
				}

				// ✅ Ensure it's an array
				this.selected_calendar_names = Array.isArray(data) ? data : [];
				console.log("✅ Fetched calendar names:", this.selected_calendar_names);
			} catch (error) {
				console.error("❌ Error fetching calendar names:", error);
				this.error = error.message;
				throw error;
			}
		},

		async delegateUserContactsAdmin(oldUserId, newUserId) {
			const toast = useToast();
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}delegate-contacts-admin/${oldUserId}-${newUserId}`,
					{}, // ← empty body, since you’re sending data in the URL
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				console.log(response);
				toast.success("Kontakty úspešne delegované", {
					position: "top-right",
					timeout: 5000,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					draggablePercent: 60,
					showCloseButtonOnHover: false,
					hideProgressBar: false,
				});
			} catch (error) {
				console.error("Error delegating user contacts:", error);
				toast.error("Kontakty sa nepodarilo delegovať", {
					position: "top-right",
					timeout: 5000,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					draggablePercent: 60,
					showCloseButtonOnHover: false,
					hideProgressBar: false,
				});
			}
		},

		async restoreUserAdmin(id) {
			const toast = useToast();
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const token = authStore.token;

			try {
				const response = await axios.post(
					`${config.public.apiUrl}restore-user/${id}`,
					{},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				console.log(response);
				toast.success("Kontakt bol úspešne obnovený");
			} catch (error) {
				console.error("Error restoring user:", error);
				toast.error("Kontakty sa nepodarilo obnoviť");
			}
		},
	},

	getters: {
		getUser: (state) => state.user,
		getAllUsers: (state) => state.allUsers,
		// getSharedUsers: (state) => state.sharedUsers,
	},
});
