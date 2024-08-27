// stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		token: null, // Store the session token here
		isLoggedIn: false,
	}),

	actions: {
		// Action to set the token
		setToken(token) {
			this.token = token;
			sessionStorage.setItem("token", token); // Store the token in sessionStorage
		},

		// Action to clear the token (logout)
		clearToken() {
			this.token = null;
			sessionStorage.removeItem("token"); // Clear the token from sessionStorage
		},

		// Action to load the token from sessionStorage when the app initializes
		loadToken() {
			const token = sessionStorage.getItem("token");
			if (token) {
				this.token = token;
			}
		},

		// Action to login
		loadLoginState() {
			this.token = sessionStorage.getItem("token");
		},
	},

	getters: {
		// Getter to check if the user is authenticated
		isAuthenticated: (state) => !!state.token,
	},
});
