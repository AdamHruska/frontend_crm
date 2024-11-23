import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const config = useRuntimeConfig();

export const useUserStore = defineStore("user", {
	// Note the change from "auth" to "user"
	state: () => ({
		user: null,
		error: null,
	}),

	actions: {
		// Explicitly define as an action
		async fetchUser() {
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
	},

	getters: {
		getUser: (state) => state.user,
	},
});
