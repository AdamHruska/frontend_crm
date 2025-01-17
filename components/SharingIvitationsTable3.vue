<script setup>
import { useRequestStore } from "#imports";
const requestStore = useRequestStore();

const receivedInvites = ref([]);
const loadingButtonId = ref(null);

onMounted(async () => {
	await requestStore.fetchLetThemViewMine();
	receivedInvites.value = requestStore.letThemViewMine;
	console.log("Sent invites:", receivedInvites.value);
	// requestStore.fetchLetThemViewMine();
	// sentInvites.value = requestStore.letThemViewMine;
});

const approveInvite = async (id) => {
	await requestStore.approveRequest(id);
};

const declineInvite = async (id) => {
	try {
		// Set the loading button ID
		loadingButtonId.value = id;

		// Perform the delete operation
		await requestStore.deleteRequest(id);

		// Remove the invite from the list after deletion
		receivedInvites.value = receivedInvites.value.filter(
			(invite) => invite.id !== id
		);
	} catch (error) {
		console.error("Error deleting invite:", error);
	} finally {
		// Reset the loading button ID
		loadingButtonId.value = null;
	}
};
</script>

<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">
			Pozvánky na zdieľanie môjho kalendára
		</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Od</th>
					<th class="border px-4 py-2">Akcie</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="invite in receivedInvites" :key="invite.id">
					<td class="border px-4 py-2">{{ invite.requester_name }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<button
							@click="approveInvite(invite.requester_id)"
							class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4 shadow"
							:disabled="loadingButtonId === invite.id"
						>
							potvrdiť
						</button>
						<button
							@click="declineInvite(invite.id)"
							class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow flex items-center"
							:disabled="loadingButtonId === invite.id"
						>
							<span
								v-if="loadingButtonId === invite.id"
								class="loader mr-2"
							></span>
							Zamietnuť
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style>
.loader {
	border: 2px solid #f3f3f3;
	border-top: 2px solid #555;
	border-radius: 50%;
	width: 12px;
	height: 12px;
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
