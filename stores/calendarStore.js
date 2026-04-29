// stores/calendarStore.js
import { defineStore } from "pinia";

import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "#imports";

export const useCalendarstore = defineStore("calendar", {
	state: () => ({
		activities: [],
		shared_activities: [],
		my_activities: [],
		showOnlyMine: false,
		originalActivities: [],
		originalEvents: [],
		loadingState: false,
		microsoftLoadingState: false,
		checkedUsers: [],
		microsoftEventCache: {}, // Format: {"2025-4": [...events]}
		googleEventCache: {},
		userColors: {},
	}),
	actions: {
		async fetchActivities() {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				const response = await axios.get(
					`${config.public.apiUrl}get-activities-diary`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					},
				);
				this.activities = response.data.activities;
				console.log("Fetched activities:", this.activities);

				let sharedIDs = userStore.user.share_user_id;
				console.log("Raw share_user_id:", sharedIDs);

				try {
					sharedIDs = sharedIDs ? JSON.parse(sharedIDs) : [];
				} catch (error) {
					console.error("Error parsing share_user_id:", error, sharedIDs);
					sharedIDs = [];
				}

				if (sharedIDs.length === 0) {
					console.warn(
						"No shared IDs found. Skipping shared activities fetch.",
					);
					this.shared_activities = [];
					this.loadingState = false;
					return;
				}
			} catch (error) {
				console.error("Error fetching activities:", error);
				this.shared_activities = [];
			} finally {
				this.loadingState = false;
			}
		},

		// No-op: shared activities are loaded per-user via addSharedEventsId on the calendar page
		async fetchSharedActivities() {
			return;
		},

		htmlToText(html) {
			if (!html) return "";
			const tmp = document.createElement("div");
			tmp.innerHTML = html;
			return tmp.textContent || tmp.innerText || "";
		},

		async fetchMicrosoftEvents(month, year) {
			const userStore = useUserStore();
			await userStore.userGetCalendarNames();
			console.log(
				"Selected calendar names:",
				userStore.selected_calendar_names,
			);

			const cacheKey = `${year}-${month}`;

			if (this.microsoftEventCache[cacheKey]) {
				return this.microsoftEventCache[cacheKey];
			}

			this.microsoftLoadingState = true;
			try {
				const config = useRuntimeConfig();
				const response = await axios.get(`${config.public.apiUrl}get-events`, {
					params: {
						month,
						year,
						user_id: userStore.user.id,
						calendar_names: userStore.selected_calendar_names,
					},
				});
				console.log("Raw Microsoft API response:", response.data);

				const microsoftEvents = response.data.value.map((event) => {
					const startDate = new Date(event.start.dateTime);
					const startsMidnight =
						startDate.getHours() === 0 &&
						startDate.getMinutes() === 0 &&
						startDate.getSeconds() === 0;

					const isAllDay = startsMidnight;

					return {
						id: event.id,
						title: event.subject,
						start: event.start.dateTime,
						end: event.end.dateTime,
						allDay: isAllDay,
						link: event.onlineMeeting?.joinUrl || "",
						backgroundColor: "rgb(168 85 247)",
						borderColor: "rgb(168 85 247)",
						source: "microsoft",
						extendedProps: {
							source: "microsoft",
							organizer: {
								name:
									event.organizer?.emailAddress?.name || "Neznámy organizátor",
								email: event.organizer?.emailAddress?.address || "Bez emailu",
								note: this.htmlToText(event.bodyPreview) || "Žiadna poznámka",
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
							note:
								this.htmlToText(event.body?.content) || event.bodyPreview || "",
							importance: event.importance,
						},
					};
				});

				this.microsoftEventCache[cacheKey] = microsoftEvents;
				this.microsoftLoadingState = false;

				console.log("Transformed Microsoft events:", microsoftEvents);
				return microsoftEvents;
			} catch (error) {
				console.error("Error fetching Microsoft events:", error);
				this.microsoftLoadingState = false;
				return [];
			}
		},

		getAllEventsForPeriod(month, year) {
			const cacheKey = `${year}-${month}`;
			const microsoftEvents = this.microsoftEventCache[cacheKey] || [];
			console.log("skuska:", microsoftEvents);
			return microsoftEvents;
		},

		clearEventCache() {
			this.microsoftEventCache = {};
		},

		async deleteMicrosoftEvent(teamsLink) {
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const base64Id = extractMicrosoftEventId(teamsLink);
				if (!base64Id) {
					throw new Error("Could not extract event ID from Teams link");
				}

				const eventId = Buffer.from(base64Id, "base64").toString("ascii");

				const response = await axios.delete(
					`${config.public.apiUrl}events/${encodeURIComponent(eventId)}`,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					},
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
				const activityResponse = await axios.get(
					`${config.public.apiUrl}activities/${activityId}`,
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);

				const activity = activityResponse.data.activity;

				if (activity.online_meeting && activity.miesto_stretnutia) {
					try {
						await this.deleteMicrosoftEvent(activity.miesto_stretnutia);
					} catch (error) {
						console.error(
							"Microsoft event deletion failed, continuing with local delete",
							error,
						);
					}
				}

				await axios.delete(
					`${config.public.apiUrl}delete-activities/${activityId}`,
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);

				this.activities = this.activities.filter((a) => a.id !== activityId);
				Object.keys(this.shared_activities).forEach((key) => {
					this.shared_activities[key] = this.shared_activities[key].filter(
						(a) => a.id !== activityId,
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
			this.checkedUsers = checkedUsers;
		},

		removeSharedActivitiesByUser(userId) {
			const userIdNum = Number(userId);

			if (Array.isArray(this.shared_activities)) {
				this.shared_activities = this.shared_activities.filter(
					(activity) => Number(activity.created_id) !== userIdNum,
				);
			} else {
				Object.keys(this.shared_activities).forEach((key) => {
					this.shared_activities[key] = this.shared_activities[key].filter(
						(activity) => Number(activity.created_id) !== userIdNum,
					);
				});
			}

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
					},
				);

				const index = this.activities.findIndex(
					(a) => a.id === updatedEvent.id,
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

		async fetchGoogleEvents(month, year) {
			const cacheKey = `${year}-${month}`;

			if (this.googleEventCache[cacheKey]) {
				return this.googleEventCache[cacheKey];
			}

			const config = useRuntimeConfig();
			const authStore = useAuthStore();
			const userStore = useUserStore();

			try {
				const response = await axios.get(
					`${config.public.apiUrl}google/calendar/events`,
					{
						params: {
							userId: userStore.user.id,
							month,
							year,
						},
						headers: {
							Authorization: `Bearer ${authStore.token}`,
							"Content-Type": "application/json",
						},
					},
				);

				const googleEvents = response.data.map((event) => ({
					id: event.id,
					title: event.summary?.trim() || "Bez názvu",
					start: event.start,
					end: event.end,
					backgroundColor: "#34A853",
					borderColor: "#34A853",
					extendedProps: {
						source: "google",
						description: event.description,
						calendar: event.calendar,
					},
				}));

				this.googleEventCache[cacheKey] = googleEvents;
				return googleEvents;
			} catch (error) {
				console.error("Error fetching Google events:", error);
				return [];
			}
		},

		clearGoogleEventCache() {
			this.googleEventCache = {};
		},
	},
	getters: {
		getContacts: (state) => state.activities,
	},
});
