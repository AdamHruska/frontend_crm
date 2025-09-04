// stores/auth.js
import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

export const useOfficeStore = defineStore("office", {
	state: () => ({
		offices: [],
		loadingState: false,
	}),

	actions: {
		async fetchOffices() {
			this.loadingState = true;
			const config = useRuntimeConfig();
			const authStore = useAuthStore();

			try {
				const response = await axios.get(`${config.public.apiUrl}get-office`, {
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				});
				console.log("Fetched offices:", response.data);
				this.offices = response.data.offices;
			} catch (error) {
				console.error("Error fetching offices:", error);
			} finally {
				this.loadingState = false;
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
	},

	getters: {},
});
