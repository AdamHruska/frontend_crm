<script setup>
import { useUserStore } from "#imports";
const userStore = useUserStore();

onMounted(async () => {
	//console.log("all", userStore.allUsers);
});

const sentInvites = ref([
	{ id: 1, to: "Charlie", status: "true" },
	{ id: 2, to: "Dana", status: "pending" },
	{ id: 3, to: "Eve", status: "declined" },
]);

const cancelInvite = (id) => {
	alert(`Cancel invite with ID: ${id}`); // Implement cancel logic
};

const filteredSentInvites = computed(() =>
	sentInvites.value.filter(
		(invite) => invite.status === "true" || invite.status === "pending"
	)
);
</script>

<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">koho kalendár chcem vidieť</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Komu</th>
					<th class="border px-4 py-2">Status</th>
					<th class="border px-4 py-2">Akcie</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="invite in filteredSentInvites" :key="invite.id">
					<td class="border px-4 py-2">{{ invite.to }}</td>
					<td class="border px-4 py-2">{{ invite.status }}</td>
					<td class="border px-4 py-2">
						<button
							@click="cancelInvite(invite.id)"
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
