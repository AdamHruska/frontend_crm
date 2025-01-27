<script setup>
import { useRequestStore } from "#imports";
const requestStore = useRequestStore();

const requests = computed(() => requestStore.letThemViewMineSkuska);

const loadingButtonId = ref(null);

onMounted(async () => {
	await requestStore.fetchLetThemViewMineSkuska();
	console.log("Sent invitesskuska:", requestStore.letThemViewMineSkuska);
});
const declineInvite = async (id) => {
	try {
		// Set the loading button ID
		loadingButtonId.value = id;

		// Perform the delete operation
		await requestStore.deleteRequestSkuska(id);

		// Optionally, you can update the requests array to remove the declined invite
		// requests.value = requests.value.filter(request => request.id !== id);
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
			Komu som poslal invite na môj kalendár
		</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Adresát</th>
					<th class="border px-4 py-2">Zrušiť</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="request in requests" :key="request.id">
					<td class="border px-4 py-2">{{ request.target_user_name }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<button
							@click="declineInvite(request.id)"
							class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow flex items-center"
							:disabled="loadingButtonId === request.id"
						>
							<span
								v-if="loadingButtonId === request.id"
								class="loader mr-2"
							></span>
							Zrušiť
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
