<script setup>
import { useRequestStore } from "#imports";
const requestStore = useRequestStore();

const receivedInvites = computed(() =>
	requestStore.viewTheirCalendarForApproval.filter(
		(invite) => invite.status === "pending",
	),
);
const loadingButtonId = ref(null);

onMounted(async () => {
	await requestStore.fetchLetThemViewMineForApproval();
	// receivedInvites.value = requestStore.viewTheirCalendarForApproval.filter(
	// 	(invite) => invite.status === "pending"
	// );
	//console.log("Sent invites:", receivedInvites.value);
	// requestStore.fetchLetThemViewMine();
	// sentInvites.value = requestStore.letThemViewMine;
});

const approveInvite = async (id, requestId) => {
	try {
		loadingButtonId.value = id;

		const response = await requestStore.approveRequest(id, requestId);

		console.log(response);

		receivedInvites.value = receivedInvites.value.filter(
			(invite) => invite.id !== requestId,
		);

		await requestStore.fetchLetThemViewMineForApproval();
	} catch (error) {
		// Check if it is the 406 response
		if (error.response && error.response.status === 406) {
			alert("Už zdielate kalendár s týmto používateľom.");
			return;
		}

		console.error("Error approving invite:", error);
	} finally {
		loadingButtonId.value = null;
	}
};

const declineInvite = async (id) => {
	try {
		loadingButtonId.value = id;

		const response = await requestStore.deleteRequest(id);

		console.log(response);

		receivedInvites.value = receivedInvites.value.filter(
			(invite) => invite.id !== id,
		);
	} catch (error) {
		if (error.response && error.response.status === 406) {
			alert("This request cannot be declined.");
			return;
		}

		console.error("Error deleting invite:", error);
	} finally {
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
				<tr
					v-for="invite in receivedInvites"
					:key="invite.id"
					class="bg-red-300"
				>
					<td class="border px-4 py-2">{{ invite.requester_name }}</td>
					<td class="border px-4 py-2 flex justify-center">
						<button
							@click="approveInvite(invite.requester_id, invite.id)"
							class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4 shadow flex items-center"
							:disabled="loadingButtonId === invite.id"
						>
							<span
								v-if="loadingButtonId === invite.id"
								class="loader mr-2"
							></span>
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
