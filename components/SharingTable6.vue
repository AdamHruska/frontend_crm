<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">Kto vidí môj kalendár</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Používateľ</th>
					<th class="border px-4 py-2">Akcie</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in seesMyCalendar" :key="row.id">
					<td class="border px-4 py-2">{{ row.target_user_name }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<div v-if="row.isLoading" class="spinner"></div>
						<button
							v-else
							@click="deleteSeesMine(row.id)"
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
import { useRequestStore } from "#imports";
const requestStore = useRequestStore();

// Use computed property for reactivity
const seesMyCalendar = computed(() => requestStore.seesMyCalendar);

onMounted(async () => {
	await requestStore.WhoSeesMyCal();
});

const deleteSeesMine = async (id) => {
	await requestStore.deleteRequestSeesMyCal(id);
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
