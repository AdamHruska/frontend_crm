<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">Kto chce aby som videl jeho kalendár</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Používateľ</th>
					<th class="border px-4 py-2">Akcie</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="request in requests" :key="request.id">
					<td class="border px-4 py-2">{{ request.requester_name }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<button
							@click="addUserToCalendar(request.requester_id, request.id)"
							class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow mr-4"
							:disabled="isProcessing"
						>
							{{ isProcessing ? "Spracovanie..." : "Povoliť" }}
						</button>
						<button
							@click="deleteSharedUser(request.id)"
							class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow"
							:disabled="isProcessing"
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
import { useRequestStore, useUserStore } from "#imports";

const requestStore = useRequestStore();
const userStore = useUserStore();
const isProcessing = ref(false);

const requests = computed(() => requestStore.letThemViewMineTabulka);

onMounted(async () => {
	await requestStore.fetchLetThemViewMineTabulka5();
});

const addUserToCalendar = async (id, requestId) => {
	isProcessing.value = true;
	try {
		await requestStore.approveRequestTable5(id, requestId);
	} catch (error) {
		console.error("Error adding user to calendar:", error);
	} finally {
		isProcessing.value = false;
		location.reload();
	}
};

const deleteSharedUser = async (id) => {
	isProcessing.value = true;
	try {
		await requestStore.deleteRequestTable5(id);
	} catch (error) {
		console.error("Error deleting shared user:", error);
	} finally {
		isProcessing.value = false;
	}
};
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
