<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">Koho Kalendár vidím</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Používateľ</th>
					<th class="border px-4 py-2">Akcie</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="user in sharedUsers" :key="user.id">
					<td class="border px-4 py-2">{{ user.username }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<div v-if="user.isLoading" class="spinner"></div>
						<button
							v-else
							@click="deleteSharedUser(user.id)"
							class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow"
						>
							Zrušiť
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "#imports";
const userStore = useUserStore();

// Use computed property for reactivity
const sharedUsers = computed(() => userStore.sharedUsers);

// event BUS
import eventBus from "@/eventBus";

const deleteSharedUser = async (id) => {
	const user = userStore.sharedUsers.find((u) => u.id === id);

	if (user) {
		user.isLoading = true;

		try {
			// Emit deleteSharedEvents with the user ID
			eventBus.emit("deleteSharedEvents", { userId: id });

			// Delete the user from shared users
			await userStore.deleteSharedUser(id);

			// Remove user's activities from calendar store
			const calendarStore = useCalendarstore();
			await calendarStore.removeSharedActivitiesByUser(id);

			// Update shared users list
			userStore.sharedUsers = userStore.sharedUsers.filter((u) => u.id !== id);
		} catch (error) {
			console.error("Error deleting user:", error);
		} finally {
			user.isLoading = false;
		}
	}
};

onMounted(async () => {
	try {
		await userStore.fetchUser();
		//await userStore.fetchUsers();
		userStore.getSharedUsers();
	} catch (error) {
		console.error("Error initializing shared users:", error);
	}
});
</script>

<style scoped>
.spinner {
	border: 4px solid rgba(200, 200, 200, 0.1); /* Light gray border */
	border-top: 4px solid #3498db; /* Blue color for the spinning part */
	border-radius: 50%;
	width: 24px;
	height: 24px;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
