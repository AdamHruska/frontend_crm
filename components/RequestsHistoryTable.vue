<template>
	<div class="w-5/8 p-4 max-h-70 overflow-auto">
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Autor</th>
					<th class="border px-4 py-2">Adresát</th>
					<th class="border px-4 py-2">Typ žiadosti</th>
					<th class="border px-4 py-2">Stav</th>
					<th class="border px-4 py-2">Dátum</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="request in historyRequests" :key="request.id">
					<td class="border px-4 py-2">{{ request.requester_name }}</td>
					<td class="border px-4 py-2">{{ request.target_user_name }}</td>
					<!-- Typ žiadosti -->
					<td
						v-if="request.type == 'view_their_calendar'"
						class="border px-4 py-2"
					>
						Vidieť ich kalendár
					</td>
					<td v-else class="border px-4 py-2">Zobraziť môj kalendár</td>
					<!-- Stav -->
					<td v-if="request.status == 'pending'" class="border px-4 py-2">
						Prebieha
					</td>
					<td v-else class="border px-4 py-2">Prijaté</td>
					<td class="border px-4 py-2">{{ formatDate(request.created_at) }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup>
import { useRequestStore } from "#imports";
const requestStore = useRequestStore();

const historyRequests = computed(() => requestStore.history);

onMounted(async () => {
	await requestStore.getHistory();
});

const formatDate = (dateString) => {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	return `${day}.${month}.${year} - ${hours}:${minutes}`;
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
