import { useAuthStore } from "~/stores/authStore";

export default defineNuxtRouteMiddleware(async (to, from) => {
	const authStore = useAuthStore();

	// Load the login state based on token existence
	await authStore.loadLoginState();

	// Check if the user is authenticated
	const isAuthenticated = authStore.isAuthenticated;

	// If user is authenticated and trying to access the login page, redirect to home
	if (isAuthenticated && to.name === "login") {
		return navigateTo("/");
	}

	// If user is authenticated and trying to access the register page, redirect to home
	if (isAuthenticated && to.name === "register") {
		return navigateTo("/");
	}

	// If user is not authenticated and trying to access any protected page (excluding login and register), redirect to login
	if (!isAuthenticated && to.name !== "login" && to.name !== "register") {
		return navigateTo("/login");
	}

	// Allow access to the login and register pages for unauthenticated users
});
