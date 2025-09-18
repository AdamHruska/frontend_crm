// stores/auth.js
import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";

import axios from "axios";

export const useOfficeStore = defineStore("office", {
	state: () => ({
		offices: [],
		officesSharedWithMe: [],
		usersSharedWithIDs: [],
		sharedUsers: [],
		loadingState: false,
		officeActivities: [],
		setOfficeID: null,
	}),

	actions: {
		async fetchOffices() {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				const response = await axios.get(`${config.public.apiUrl}get-office`, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				console.log("Fetched offices:", response.data);
				this.offices = response.data.offices;
				this.usersSharedWithIDs = response.data.offices[0].shared_with;
				const sharedIds = Object.values(this.usersSharedWithIDs);
				await userStore.fetchUsers();
				this.sharedUsers = userStore.allUsers.filter((user) =>
					sharedIds.includes(user.id)
				);
				console.log("usersSharedWith:", this.sharedUsers);
			} catch (error) {
				console.error("Error fetching offices:", error);
			} finally {
				this.loadingState = false;
			}
		},

		async revokeAccess(userId) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				await axios.post(
					`${config.public.apiUrl}offices/${userId}/remove-shared-with`,
					{ user_ids: [userId] },
					{ headers: { Authorization: `Bearer ${authStore.token}` } }
				);
				this.usersSharedWithIDs = this.usersSharedWithIDs.filter(
					(id) => id !== userId
				);

				// ✅ remove the user object from sharedUsers
				this.sharedUsers = this.sharedUsers.filter(
					(user) => user.id !== userId
				);
			} catch (error) {
				console.error("Error revoking access:", error);
			}
		},

		async fetchOfficesSharedWithMe() {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const response = await axios.get(
					`${config.public.apiUrl}offices-shared-with-me`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				this.officesSharedWithMe = response.data.offices;

				//console.log("usersSharedWith:", this.usersSharedWith);
			} catch (error) {
				console.error("Error fetching offices:", error);
			} finally {
				this.loadingState = false;
			}
		},

		async addUserToOfficeShare(userId) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				await axios.post(
					`${config.public.apiUrl}offices/${userId}/shared-with`,
					{ user_ids: [userId] },
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				if (!this.usersSharedWithIDs.includes(userId)) {
					this.usersSharedWithIDs.push(userId);
				}

				// ✅ Find user object from userStore and add to sharedUsers if not already present
				const userToAdd = userStore.allUsers.find((u) => u.id === userId);
				if (userToAdd && !this.sharedUsers.some((u) => u.id === userId)) {
					this.sharedUsers.push(userToAdd);
				}
			} catch (error) {
				console.error("Error adding user to office share:", error);
			}
		},

		async addOffice(officeData) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const response = await axios.post(
					`${config.public.apiUrl}create-office`,
					officeData,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				console.log("Added office:", response.data);
				console.log("Current offices before adding:", this.offices);
				this.offices.push(response.data);
			} catch (error) {
				console.error("Error adding office:", error);
			}
		},

		async updateOffice(id, office) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const response = await axios.put(
					`${config.public.apiUrl}update-office/${id}`,
					office,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				console.log("Updated office:", response.data);

				const index = this.offices.findIndex((o) => o.id === id);
				if (index !== -1) {
					// Make sure we're using the response data, not the input data
					this.offices.splice(index, 1, response.data);
				}
			} catch (error) {
				console.error("Error updating office:", error);
			}
		},

		async deleteOffice(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				await axios.delete(`${config.public.apiUrl}delete-office/${id}`, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});

				console.log("Deleted office:", id);
				this.offices = this.offices.filter((office) => office.id !== id);
			} catch (error) {
				console.error("Error deleting office:", error);
			}
		},

		// activity functions
		async storeActivity(activityData) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				await axios.post(
					`${config.public.apiUrl}create-office-activity`,
					activityData,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.officeActivities.push(activityData);
			} catch (error) {
				console.error("Error creating office activity:", error);
			}
		},

		async updateActivity(activityData) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				const payload = { ...activityData, user_id: userStore.user.id };

				console.log("Updating activity with payload:", payload);

				await axios.put(
					`${config.public.apiUrl}update-office-activity/${activityData.id}`,
					payload,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				const index = this.officeActivities.findIndex(
					(a) => Number(a.id) === Number(activityData.id)
				);

				if (index !== -1) {
					// replace the whole object to trigger reactivity
					this.officeActivities[index] = { ...activityData };
				} else {
					console.warn("Activity not found in store to update");
				}
			} catch (error) {
				console.error("Error updating office activity:", error);
			}
		},
		async deleteActivity(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				await axios.delete(
					`${config.public.apiUrl}delete-office-activity/${id}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				// odstrániť aktivitu zo store
				this.officeActivities = this.officeActivities.filter(
					(a) => a.id !== id
				);
			} catch (error) {
				console.error("Error deleting office activity:", error);
			}
		},

		async getOfficeActivities(id) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-office-activities/${id}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.officeActivities = response.data;
				console.log("Fetched office activities:", this.officeActivities);
			} catch (error) {
				console.error("Error fetching office activities:", error);
			}
		},

		// inside actions of useOfficeStore
		async findActivityId({ datum_cas, koniec, owner_id }) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			console.log("Finding activity ID with:", { datum_cas, koniec, owner_id });
			try {
				const response = await axios.post(
					`${config.public.apiUrl}find-activity-id`,
					{ datum_cas, koniec, owner_id },
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				//console.log("Found activity ID:", response.data.activity_id);
				return response.data.activity_id;
			} catch (error) {
				console.error("Error finding activity ID:", error);
				return null;
			}
		},
	},

	getters: {},
});
