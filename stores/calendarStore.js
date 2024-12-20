// stores/contactsStore.js
import { defineStore } from "pinia";

import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "#imports";

export const useCalendarstore = defineStore("calendar", {
	state: () => ({
		activities: [],
		shared_activities: [],
		loadingState: false,
		checkedUsers: [],
	}),
	actions: {
		async fetchActivities() {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			const response = await axios.get(
				`${config.public.apiUrl}get-activities-diary`,
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);

			this.activities = response.data.activities;

			// Getting sharedIDs
			let sharedIDs = userStore.user.share_user_id;

			// Parse the shared IDs if they exist
			sharedIDs = sharedIDs ? JSON.parse(sharedIDs) : [];

			// If sharedIDs is empty, skip the API call or handle it differently
			if (sharedIDs.length === 0) {
				console.log("No shared user IDs, skipping shared activities fetch.");
				this.shared_activities = [];
				this.loadingState = false;
				return;
			}

			try {
				const response_shared_activities = await axios.post(
					`${config.public.apiUrl}get-activities`,
					{
						user_ids: sharedIDs, // Send shared user IDs only if they exist
					},
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					}
				);
				this.shared_activities = response_shared_activities.data.activities;
				console.log("Shared activities:", this.shared_activities);
			} catch (error) {
				console.error("Error fetching shared activities:", error);
			}

			this.loadingState = false;
		},

		async deleteActivity(activityId) {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				// Uncomment and adjust the delete request as needed
				await axios.delete(
					`${config.public.apiUrl}delete-activities/${activityId}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				// Remove the activity from both user and shared activities
				console.log("predtym", this.activities);
				this.activities = this.activities.filter(
					(activity) => activity.id != activityId
				);
				console.log("potom", this.activities);
				// Check and remove from shared activities as well
				Object.keys(this.shared_activities).forEach((key) => {
					this.shared_activities[key] = this.shared_activities[key].filter(
						(activity) => activity.id != activityId
					);
				});

				this.loadingState = false;
				return true;
			} catch (error) {
				console.error("Error deleting activity:", error);
				this.loadingState = false;
				return false; // Indicate deletion failure
			}
		},
		setCheckedUsers(checkedUsers) {
			this.checkedUsers = checkedUsers; // Set checked users dynamically
			console.log("toto je checkedUsers", this.checkedUsers);
		},

		removeSharedActivitiesByUser(userId) {
			this.shared_activities = this.shared_activities.filter(
				(activity) => activity.user_id !== userId // Ensure activity has a user_id field to match
			);
			this.activities = this.activities.filter(
				(activity) => activity.user_id !== userId // For activities directly linked
			);
			console.log(`Removed shared activities for user ID ${userId}`);
		},
	},
	getters: {
		// Getter to return all contacts
		getContacts: (state) => state.activities,
	},
});
