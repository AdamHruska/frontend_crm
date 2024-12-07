<script setup>
const config = useRuntimeConfig();

import axios from "axios";
import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useUserStore } from "#imports";
const userStore = useUserStore();

onMounted(async () => {
	await userStore.fetchUser();
	console.log("test", userStore.user);
});

const logout = async () => {
	console.log("Logging out...");
	try {
		// Call the logout API endpoint
		await axios.post(
			`${config.public.apiUrl}logout`,
			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		// Clear auth store
		authStore.clearToken();

		// Remove tokens from both storage types
		localStorage.removeItem("auth_token");
		sessionStorage.removeItem("auth_token");

		console.log("Successfully logged out");
	} catch (error) {
		console.error("Logout error:", error);

		// Even if the API call fails, we should still clear local storage
		authStore.clearToken();
		localStorage.removeItem("auth_token");
		sessionStorage.removeItem("auth_token");
	}
};
</script>

<template>
	<div class="pl-2">
		<div class="flex gap-4 mb-12 items-center text-lg ml-4 mt-6 mb-8">
			<p class="font-semibold">Prihlásený ako:</p>

			<p>Adam</p>
			<p>Hruška</p>
			<button
				@click="logout"
				class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 shadow"
			>
				Odhlásiť
			</button>
		</div>
		<!-- Second section -->

		<div class="flex w-full">
			<!-- First Table -->
			<MyCalendarShareTable1 :user="userStore.user" />

			<!-- Second Table -->
			<MyInvitationsTable2 />
		</div>

		<!-- Third Table -->
		<div class="flex">
			<SharingIvitationsTable3 />
			<SharingIvitationsTable3 />
		</div>
	</div>
</template>

<style></style>
