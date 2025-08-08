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
		microsoftEventCache: {}, // Format: {"2025-4": [...events]}
	}),
	actions: {
		// async fetchActivities() {
		// 	this.loadingState = true;
		// 	const config = useRuntimeConfig();
		// 	const authStore = useAuthStore();
		// 	const userStore = useUserStore();

		// 	const response = await axios.get(
		// 		`${config.public.apiUrl}get-activities-diary`,
		// 		{
		// 			headers: {
		// 				Authorization: `Bearer ${authStore.token}`,
		// 			},
		// 		}
		// 	);
		// 	this.activities = response.data.activities;

		// 	// Getting sharedIDs
		// 	let sharedIDs = userStore.user.share_user_id;

		// 	// Parse the shared IDs if they exist
		// 	sharedIDs = sharedIDs ? JSON.parse(sharedIDs) : [];

		// 	// If sharedIDs is empty, skip the API call or handle it differently
		// 	if (sharedIDs.length === 0) {
		// 		this.shared_activities = [];
		// 		this.loadingState = false;
		// 		return;
		// 	}

		// 	try {
		// 		const response_shared_activities = await axios.post(
		// 			`${config.public.apiUrl}get-activities`,
		// 			{
		// 				user_ids: sharedIDs, // Send shared user IDs only if they exist
		// 			},
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${authStore.token}`,
		// 					"Content-Type": "application/json",
		// 				},
		// 			}
		// 		);
		// 		this.shared_activities = response_shared_activities.data.activities;
		// 	} catch (error) {
		// 		console.error("Error fetching shared activities:", error);
		// 	}

		// 	this.loadingState = false;
		// },

		async fetchActivities() {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				// Fetch activities
				const response = await axios.get(
					`${config.public.apiUrl}get-activities-diary`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);
				this.activities = response.data.activities;
				console.log("Fetched activities:", this.activities);
				// Log and parse sharedIDs
				let sharedIDs = userStore.user.share_user_id;
				console.log("Raw share_user_id:", sharedIDs);

				try {
					sharedIDs = sharedIDs ? JSON.parse(sharedIDs) : [];
				} catch (error) {
					console.error("Error parsing share_user_id:", error, sharedIDs);
					sharedIDs = []; // Fallback to an empty array
				}

				// Skip shared activities fetch if no shared IDs
				if (sharedIDs.length === 0) {
					console.warn(
						"No shared IDs found. Skipping shared activities fetch."
					);
					this.shared_activities = [];
					this.loadingState = false;
					return;
				}

				// Fetch shared activities
				const response_shared_activities = await axios.post(
					`${config.public.apiUrl}get-activities`,
					{
						user_ids: Array.isArray(sharedIDs) ? sharedIDs : [sharedIDs],
					},
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					}
				);

				this.shared_activities = response_shared_activities.data.activities;
			} catch (error) {
				console.error("Error fetching activities or shared activities:", error);
				this.shared_activities = [];
			} finally {
				this.loadingState = false;
			}
		},

		// async fetchMicrosoftEvents(month, year) {
		// 	// Create a cache key using month and year
		// 	const cacheKey = `${year}-${month}`;
		// 	//console.log("Cache:", this.microsoftEventCache);
		// 	// Check if data already exists in cache
		// 	if (this.microsoftEventCache[cacheKey]) {
		// 		//console.log("skuska");
		// 		//console.log(`Using cached Microsoft events for ${cacheKey}`);
		// 		//console.log(this.microsoftEventCache[cacheKey]);
		// 		return this.microsoftEventCache[cacheKey];
		// 	}

		// 	// If not in cache, fetch from API
		// 	this.loadingState = true;
		// 	try {
		// 		const config = useRuntimeConfig();
		// 		const response = await axios.get(`${config.public.apiUrl}get-events`, {
		// 			params: { month, year },
		// 		});

		// 		// Transform Microsoft events to match calendar format
		// 		const microsoftEvents = response.data.value.map((event) => ({
		// 			id: event.id,
		// 			title: event.subject,
		// 			start: event.start.dateTime,
		// 			end: event.end.dateTime,
		// 			link: event.onlineMeeting?.joinUrl || "",
		// 			backgroundColor: "rgb(168 85 247)",
		// 			borderColor: "rgb(168 85 247)",
		// 			source: "microsoft",
		// 			extendedProps: {
		// 				source: "microsoft",
		// 				organizer: {
		// 					name: event.organizer?.emailAddress?.name || "Unknown",
		// 					email: event.organizer?.emailAddress?.address || "No email",
		// 				},
		// 				attendees:
		// 					event.attendees?.map((attendee) => ({
		// 						name: attendee.emailAddress?.name,
		// 						email: attendee.emailAddress?.address,
		// 						response: attendee.status?.response,
		// 						type: attendee.type,
		// 					})) || [],
		// 				location: event.location?.displayName || "No location",
		// 				link: event.onlineMeeting?.joinUrl || "",
		// 			},
		// 		}));
		// 		console.log("Fetched Microsoft events:", microsoftEvents);
		// 		// Store in cache
		// 		this.microsoftEventCache[cacheKey] = microsoftEvents;

		// 		this.loadingState = false;
		// 		return microsoftEvents;
		// 	} catch (error) {
		// 		console.error("Error fetching Microsoft events:", error);
		// 		this.loadingState = false;
		// 		return [];
		// 	}
		// },

		async fetchMicrosoftEvents(month, year) {
			const userStore = useUserStore();
			// Create a cache key using month and year
			const cacheKey = `${year}-${month}`;
			//console.log("Cache:", this.microsoftEventCache);
			// Check if data already exists in cache
			if (this.microsoftEventCache[cacheKey]) {
				//console.log("skuska");
				//console.log(`Using cached Microsoft events for ${cacheKey}`);
				//console.log(this.microsoftEventCache[cacheKey]);
				return this.microsoftEventCache[cacheKey];
			}

			// If not in cache, fetch from API
			this.loadingState = true;
			try {
				const config = useRuntimeConfig();
				const response = await axios.get(`${config.public.apiUrl}get-events`, {
					params: { month, year, user_id: userStore.user.id },
				});

				// Transform Microsoft events to match calendar format
				const microsoftEvents = response.data.value.map((event) => {
					// Check if the event starts at midnight (potential all-day event)
					const startDate = new Date(event.start.dateTime);
					const startsMidnight =
						startDate.getHours() === 0 &&
						startDate.getMinutes() === 0 &&
						startDate.getSeconds() === 0;

					// If it starts at midnight, we'll consider it an all-day event
					// This catches events like "2025-05-03T00:00:00.0000000" to "2025-05-03T15:00:00.0000000"
					const isAllDay = startsMidnight;

					return {
						id: event.id,
						title: event.subject,
						start: event.start.dateTime,
						end: event.end.dateTime,
						allDay: isAllDay, // Add the all-day flag based on our detection
						link: event.onlineMeeting?.joinUrl || "",
						backgroundColor: "rgb(168 85 247)",
						borderColor: "rgb(168 85 247)",
						source: "microsoft",
						extendedProps: {
							source: "microsoft",
							organizer: {
								name: event.organizer?.emailAddress?.name || "Unknown",
								email: event.organizer?.emailAddress?.address || "No email",
							},
							attendees:
								event.attendees?.map((attendee) => ({
									name: attendee.emailAddress?.name,
									email: attendee.emailAddress?.address,
									response: attendee.status?.response,
									type: attendee.type,
								})) || [],
							location: event.location?.displayName || "No location",
							link: event.onlineMeeting?.joinUrl || "",
						},
					};
				});

				console.log("Fetched Microsoft events:", microsoftEvents);
				// Store in cache
				this.microsoftEventCache[cacheKey] = microsoftEvents;

				this.loadingState = false;
				return microsoftEvents;
			} catch (error) {
				console.error("Error fetching Microsoft events:", error);
				this.loadingState = false;
				return [];
			}
		},

		// Get all events from all sources for a specific month/year
		getAllEventsForPeriod(month, year) {
			const cacheKey = `${year}-${month}`;
			const microsoftEvents = this.microsoftEventCache[cacheKey] || [];

			// Combine with activities and shared_activities if needed
			// You might need to filter activities based on dates
			console.log("skuska:", microsoftEvents);
			return microsoftEvents;
		},

		// Clear cache for testing or memory management
		clearEventCache() {
			this.microsoftEventCache = {};
		},

		// async deleteActivity(activityId) {
		// 	this.loadingState = true;
		// 	const config = useRuntimeConfig();
		// 	const authStore = useAuthStore();

		// 	try {
		// 		// Uncomment and adjust the delete request as needed
		// 		await axios.delete(
		// 			`${config.public.apiUrl}delete-activities/${activityId}`,
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${authStore.token}`,
		// 				},
		// 			}
		// 		);

		// 		// Remove the activity from both user and shared activities

		// 		this.activities = this.activities.filter(
		// 			(activity) => activity.id != activityId
		// 		);

		// 		// Check and remove from shared activities as well
		// 		Object.keys(this.shared_activities).forEach((key) => {
		// 			this.shared_activities[key] = this.shared_activities[key].filter(
		// 				(activity) => activity.id != activityId
		// 			);
		// 		});

		// 		this.loadingState = false;
		// 		return true;
		// 	} catch (error) {
		// 		console.error("Error deleting activity:", error);
		// 		this.loadingState = false;
		// 		return false; // Indicate deletion failure
		// 	}
		// },

		async deleteMicrosoftEvent(teamsLink) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const base64Id = extractMicrosoftEventId(teamsLink);
				if (!base64Id) {
					throw new Error("Could not extract event ID from Teams link");
				}

				// The Microsoft Graph API expects the ID in this format
				const eventId = Buffer.from(base64Id, "base64").toString("ascii");

				const response = await axios.delete(
					`${config.public.apiUrl}events/${encodeURIComponent(eventId)}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					}
				);

				return response.data;
			} catch (error) {
				console.error("Error deleting Microsoft event:", error);
				throw error;
			}
		},

		async deleteActivity(activityId) {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				// Get the activity details
				const activityResponse = await axios.get(
					`${config.public.apiUrl}activities/${activityId}`,
					{ headers: { Authorization: `Bearer ${authStore.token}` } }
				);

				const activity = activityResponse.data.activity;

				// If it's an online meeting with a Teams link
				if (activity.online_meeting && activity.miesto_stretnutia) {
					try {
						await this.deleteMicrosoftEvent(activity.miesto_stretnutia);
					} catch (error) {
						console.error(
							"Microsoft event deletion failed, continuing with local delete",
							error
						);
					}
				}

				// Proceed with local deletion
				await axios.delete(
					`${config.public.apiUrl}delete-activities/${activityId}`,
					{ headers: { Authorization: `Bearer ${authStore.token}` } }
				);

				// Update local state
				this.activities = this.activities.filter((a) => a.id !== activityId);
				Object.keys(this.shared_activities).forEach((key) => {
					this.shared_activities[key] = this.shared_activities[key].filter(
						(a) => a.id !== activityId
					);
				});

				this.loadingState = false;
				return true;
			} catch (error) {
				console.error("Error deleting activity:", error);
				this.loadingState = false;
				return false;
			}
		},

		setCheckedUsers(checkedUsers) {
			this.checkedUsers = checkedUsers; // Set checked users dynamically
		},

		// removeSharedActivitiesByUser(userId) {
		// 	const shared_activities = JSON.parse(
		// 		JSON.stringify(this.shared_activities)
		// 	);
		// 	this.shared_activities = shared_activities.filter(
		// 		(activity) => activity.user_id !== userId // Ensure activity has a user_id field to match
		// 	);
		// 	console.log(shared_activities);
		// 	// console.log("activities in store:", this.activities);
		// 	// this.activities = this.activities.filter(
		// 	// 	(activity) => activity.user_id !== userId // For activities directly linked
		// 	// );
		// },

		// removeSharedActivitiesByUser(userId) {
		// 	// Convert to number to ensure consistent comparison
		// 	const userIdNum = Number(userId);

		// 	if (Array.isArray(this.shared_activities)) {
		// 		this.shared_activities = this.shared_activities.filter(
		// 			(activity) => Number(activity.created_id) !== userIdNum
		// 		);
		// 	} else {
		// 		// If it's an object with arrays
		// 		Object.keys(this.shared_activities).forEach((key) => {
		// 			this.shared_activities[key] = this.shared_activities[key].filter(
		// 				(activity) => Number(activity.created_id) !== userIdNum
		// 			);
		// 		});
		// 	}
		// },
		removeSharedActivitiesByUser(userId) {
			const userIdNum = Number(userId);

			// Remove from shared_activities array
			if (Array.isArray(this.shared_activities)) {
				this.shared_activities = this.shared_activities.filter(
					(activity) => Number(activity.created_id) !== userIdNum
				);
			} else {
				// If shared_activities is an object with arrays
				Object.keys(this.shared_activities).forEach((key) => {
					this.shared_activities[key] = this.shared_activities[key].filter(
						(activity) => Number(activity.created_id) !== userIdNum
					);
				});
			}

			// Force a reactivity update
			this.shared_activities = [...this.shared_activities];
		},

		async updateActivity(updatedEvent) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				await axios.put(
					`${config.public.apiUrl}update-activity/${updatedEvent.id}`,
					updatedEvent,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					}
				);

				// Update activity in the local store
				const index = this.activities.findIndex(
					(a) => a.id === updatedEvent.id
				);
				if (index !== -1) {
					this.activities[index] = {
						...this.activities[index],
						...updatedEvent,
					};
				}
			} catch (error) {
				console.error("Failed to update activity:", error);
			}
		},
	},
	getters: {
		// Getter to return all contacts
		getContacts: (state) => state.activities,
	},
});
