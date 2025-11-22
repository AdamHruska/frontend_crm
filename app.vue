<script setup>
const router = useRouter();
const route = useRoute();
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
const isAuthenticated = ref(false);
const isLoading = ref(true);
import { useUserStore } from "#imports";
const userStore = useUserStore();

// Function to check authentication status
const checkAuth = async () => {
	const token =
		localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

	if (token) {
		authStore.setToken(token);
		isAuthenticated.value = true;

		// Only redirect if we're on login/register pages
		if (route.path === "/login" || route.path === "/register") {
			await router.push("/");
		}
	} else {
		isAuthenticated.value = false;
		authStore.clearToken();

		// Only redirect to login if we're not already on login or register pages
		if (route.path !== "/login" && route.path !== "/register") {
			await router.push("/login");
		}
	}

	isLoading.value = false;
};

// Check authentication on initial load
onMounted(async () => {
	await checkAuth();
	await userStore.fetchUser();

	if (userStore.allUsers.length === 0) {
		await userStore.fetchUsers();
	}

	await userStore.getSharedUsers();

	// Initialize OneSignal after user is authenticated
	initializeOneSignal();
});

// Watch for route changes to recheck auth
watch(
	() => route.path,
	async () => {
		if (!isLoading.value) {
			await checkAuth();
		}
	}
);

// Watch for auth store changes
watch(
	() => authStore.token,
	(newToken) => {
		isAuthenticated.value = !!newToken;
	}
);

// OneSignal initialization function
const initializeOneSignal = () => {
	if (!process.client) return;

	// Load OneSignal script
	const script = document.createElement("script");
	script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
	script.defer = true;
	document.head.appendChild(script);

	script.onload = () => {
		console.log("✅ OneSignal script loaded");

		window.OneSignalDeferred = window.OneSignalDeferred || [];
		window.OneSignalDeferred.push(async function (OneSignal) {
			try {
				console.log("🔄 Initializing OneSignal...");

				await OneSignal.init({
					appId: "2b1b9281-793f-4815-93bf-16f9c13ea655",
					safari_web_id:
						"web.onesignal.auto.596e7d36-250c-4e22-98d4-39c9730f6c95",
					allowLocalhostAsSecureOrigin: true,
					serviceWorkerPath: "OneSignalSDKWorker.js",
				});

				console.log("✅ OneSignal initialized!");

				// Make globally available
				window.OneSignalReady = true;

				// Check current state
				const permission = await OneSignal.Notifications.permission;
				const subId = OneSignal.User.PushSubscription.id;

				console.log("🔔 Permission:", permission);
				console.log("🆔 Subscription ID:", subId || "None");

				// Listen for subscription changes
				OneSignal.User.PushSubscription.addEventListener(
					"change",
					async (event) => {
						console.log("🔄 Subscription changed:", event);
						if (event.current && event.current.id) {
							await savePlayerIdToBackend(event.current.id);
						}
					}
				);

				// Save existing subscription if user is authenticated
				if (subId && isAuthenticated.value) {
					await savePlayerIdToBackend(subId);
				}
			} catch (error) {
				console.error("❌ OneSignal error:", error);
			}
		});
	};

	script.onerror = () => {
		console.error("❌ Failed to load OneSignal script");
	};
};

// Save to backend function
const savePlayerIdToBackend = async (playerId) => {
	if (!process.client) return;

	try {
		const config = useRuntimeConfig();
		const token =
			localStorage.getItem("auth_token") ||
			sessionStorage.getItem("auth_token");

		if (!token) {
			console.log("⚠️ No auth token, skipping OneSignal ID save");
			return;
		}

		console.log("📤 Saving OneSignal player ID to backend:", playerId);

		await $fetch(`${config.public.apiBase}/api/save-onesignal-id`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: { player_id: playerId },
		});

		console.log("✅ OneSignal player ID saved to backend successfully");
	} catch (error) {
		console.error("❌ Failed to save OneSignal player ID to backend:", error);
	}
};
</script>

<template>
	<!-- Loading spinner -->
	<div v-if="isLoading" class="flex items-center justify-center min-h-screen">
		<div
			class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
		></div>
	</div>

	<!-- Main content -->
	<div v-else>
		<!-- Only show layout with navbar for authenticated routes -->
		<template
			v-if="
				isAuthenticated && route.path !== '/login' && route.path !== '/register'
			"
		>
			<NuxtLayout>
				<NuxtPage />
			</NuxtLayout>
		</template>

		<!-- Show bare page without layout for login/register -->
		<template v-else>
			<NuxtPage />
		</template>
	</div>
</template>

<style>
/* :root {
	--background-color: #ffffff;
	--text-color: #000000;
}

body {
	background-color: var(--background-color);
	color: var(--text-color);
} */
</style>
