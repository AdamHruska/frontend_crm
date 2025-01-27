<script setup>
import { useRequestStore } from "#imports";
import { storeToRefs } from "pinia";

const requestStore = useRequestStore();
const { viewTheirCalendar } = storeToRefs(requestStore);

// Local loading state
const deletingId = ref(null);

// const filteredSentInvites = computed(() =>
// 	viewTheirCalendar.value.filter(
// 		(invite) => invite.status === "true" || invite.status === "pending"
// 	)
// );

const filteredSentInvites = computed(() => {
	return requestStore.viewTheirCalendar.filter(
		(invite) => invite.status === "pending"
	);
});

onMounted(async () => {
	await requestStore.fetchViewTheirCalendar();
	console.log("Sent invites:", viewTheirCalendar.value);
});

const cancelInvite = async (id) => {
	deletingId.value = id;
	try {
		await requestStore.deleteRequest(id);
	} finally {
		deletingId.value = null;
	}
};

const isDeleting = (id) => deletingId.value === id;
</script>

<template>
	<div class="w-1/3 p-4">
		<h2 class="font-bold text-lg mb-2">koho kalendár chcem vidieť</h2>
		<table class="w-full border shadow">
			<thead>
				<tr class="bg-gray-300">
					<th class="border px-4 py-2">Komu</th>
					<th class="border px-4 py-2">Od koho</th>
					<th class="border px-4 py-2">Status</th>
					<th class="border px-4 py-2">Akcie</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="invite in filteredSentInvites" :key="invite.id">
					<td class="border px-4 py-2">{{ invite.target_user_name }}</td>
					<td class="border px-4 py-2">{{ invite.requester_name }}</td>
					<td class="border px-4 py-2">Pebieha</td>

					<td class="border px-4 py-2">
						<button
							@click="cancelInvite(invite.id)"
							class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow inline-flex items-center justify-center min-w-[80px]"
							:disabled="isDeleting(invite.id)"
						>
							<template v-if="isDeleting(invite.id)">
								<svg
									class="animate-spin h-4 w-4 mr-2"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Maže sa...
							</template>
							<template v-else> Zrušiť </template>
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
