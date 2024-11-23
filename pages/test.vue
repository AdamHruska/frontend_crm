<script setup>
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();

const getUser = async () => {
	try {
		// Directly call the action method
		await userStore.fetchUser();
		console.log("User:", userStore.user); // Direct access or use getter
	} catch (err) {
		console.error("Failed to get user:", err);
	}
};
</script>

<template>
	<button @click="getUser">Get User</button>
</template>
