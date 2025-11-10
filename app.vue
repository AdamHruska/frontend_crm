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
