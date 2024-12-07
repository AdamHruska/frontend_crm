<script setup>
const receivedInvites = ref([
	{ id: 1, from: "Alice" },
	{ id: 2, from: "Bob" },
]);

const approveInvite = (id) => {
	alert(`Approve invite with ID: ${id}`); // Implement approval logic
	// Move the invite to the top-left table after approval logic
};

const declineInvite = (id) => {
	alert(`Decline invite with ID: ${id}`); // Implement decline logic
};
</script>

<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">
			Pozvánky na zdieľanei môjho kalendára
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
					<td class="border px-4 py-2">{{ invite.from }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<button
							@click="approveInvite(invite.id)"
							class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4 shadow"
						>
							potvrdiť
						</button>
						<button
							@click="declineInvite(invite.id)"
							class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow"
						>
							Zamietnuť
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
