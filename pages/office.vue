<template>
	<OfficeForm
		v-if="showOfficeForm"
		:officeToEdit="selectedOffice"
		@officeSaved="handleOfficeSaved"
		@officeEdited="handleOfficeEdited"
	/>

	<OfficeSharingForm
		v-if="showSharingForm"
		@openSharingForm="openSharingForm"
	/>

	<button
		class="mt-4 ml-8 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
		@click="openNewOfficeForm"
		v-if="!showSharingForm"
	>
		Pridať kanceláriu
	</button>

	<button
		class="mt-4 ml-8 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
		@click="openSharingForm"
		v-if="!showSharingForm"
	>
		Zdielať moje kancelárie
	</button>

	<div class="ml-8 mt-8 mb-10">
		<h1 class="text-xl font-semibold mb-4">Moje kancelárie</h1>
		<div v-if="officeStore.offices.length" class="overflow-x-auto">
			<table
				class="min-w-full border border-gray-300 rounded-lg overflow-hidden mb-6"
			>
				<thead class="bg-gray-100">
					<tr>
						<th class="px-4 py-2 border-b text-left">#</th>
						<th class="px-4 py-2 border-b text-left">Názov</th>
						<th class="px-4 py-2 border-b text-left">Poloha</th>
						<th class="px-4 py-2 border-b text-left">Okres</th>
						<th class="px-4 py-2 border-b text-left">Telefón</th>
						<th class="px-4 py-2 border-b text-left">Akcie</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(office, index) in officeStore.offices"
						:key="office.id"
						class="hover:bg-gray-50"
					>
						<td class="px-4 py-2 border-b">{{ index + 1 }}</td>
						<td class="px-4 py-2 border-b">{{ office.name }}</td>
						<td class="px-4 py-2 border-b">{{ office.location }}</td>
						<td class="px-4 py-2 border-b">{{ office.district }}</td>
						<td class="px-4 py-2 border-b">{{ office.phone_number }}</td>
						<td class="px-4 py-2 border-b flex gap-2">
							<button
								class="bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700"
								@click="editOffice(office)"
							>
								Upraviť
							</button>
							<button
								class="bg-red-600 text-white py-1 px-2 rounded-md hover:bg-red-700"
								@click="deleteOffice(office.id)"
							>
								Odstrániť
							</button>
							<button
								@click="showOfficeActivities(office.id)"
								class="bg-green-600 text-white py-1 px-2 rounded-md hover:bg-green-700"
							>
								Zobraziť aktivity
							</button>
							<input
								type="checkbox"
								:checked="selectedOfficeId === office.id"
								@click="handleOfficeCheckbox(office.id)"
							/>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div v-else class="text-gray-500 mt-4">
			Žiadne kancelárie zatiaľ neexistujú.
		</div>
	</div>

	<div class="w-full h-[2px] bg-black"></div>

	<div class="ml-8 mt-10">
		<h1 class="text-xl font-semibold mb-4">Zdielané kancelárie</h1>
		<div class="overflow-x-auto">
			<table
				class="min-w-full border border-gray-300 rounded-lg overflow-hidden mb-6"
			>
				<thead class="bg-gray-100">
					<tr>
						<th class="px-4 py-2 border-b text-left">#</th>
						<th class="px-4 py-2 border-b text-left">Názov</th>
						<th class="px-4 py-2 border-b text-left">Poloha</th>
						<th class="px-4 py-2 border-b text-left">Okres</th>
						<th class="px-4 py-2 border-b text-left">Telefón</th>
						<th class="px-4 py-2 border-b text-left">Akcie</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(office, index) in officeStore.officesSharedWithMe"
						:key="office.id"
						class="hover:bg-gray-50"
					>
						<td class="px-4 py-2 border-b">{{ index + 1 }}</td>
						<td class="px-4 py-2 border-b">{{ office.name }}</td>
						<td class="px-4 py-2 border-b">{{ office.location }}</td>
						<td class="px-4 py-2 border-b">{{ office.district }}</td>
						<td class="px-4 py-2 border-b">{{ office.phone_number }}</td>
						<td class="px-4 py-2 border-b flex gap-2">
							<button
								@click="showOfficeActivities(office.id)"
								class="bg-green-600 text-white py-1 px-2 rounded-md hover:bg-green-700"
							>
								Zobraziť aktivity
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<div class="w-full h-[2px] bg-black"></div>

	<div class="mt-8 mx-8 max-h-fit">
		<OfficeCalendar />
	</div>

	<div class="ml-8 mt-10 mb-10">
		<h2 class="text-lg font-semibold">
			Ľudia, ktorí majú prístup k mojim kanceláriám
		</h2>
		<ul class="px-0 max-h-[400px] overflow-y-auto w-fit">
			<li v-for="user in officeStore.sharedUsers" :key="user.id" class="px-0">
				{{ user.first_name }} {{ user.last_name }} - email: ({{ user.email }})
				<button
					@click="officeStore.revokeAccess(user.id)"
					class="bg-red-600 hover:bg-red-800 text-white font-bold py-1 px-2 rounded ml-4"
				>
					Zrušiť prístup
				</button>
			</li>
		</ul>
	</div>
</template>

<script setup>
import { useOfficeStore } from "~/stores/officeStore";
const officeStore = useOfficeStore();

onMounted(async () => {
	await officeStore.fetchOffices().then(() => {
		const storedId = localStorage.getItem("selectedOfficeId");
		selectedOfficeId.value = storedId ? Number(storedId) : null;
		officeStore.setOfficeID = selectedOfficeId.value;
		console.log("Selected Office ID on mount:", officeStore.setOfficeID);
	});

	const storedOfficeId = localStorage.getItem("selectedOfficeId");
	if (storedOfficeId) {
		await officeStore.getOfficeActivities(Number(storedOfficeId)); // ✅ correct function
	}

	officeStore.fetchOfficesSharedWithMe();
});
const selectedOfficeId = ref(
	Number(localStorage.getItem("selectedOfficeId")) || null
);

watch(selectedOfficeId, (newVal) => {
	if (newVal === null) {
		localStorage.removeItem("selectedOfficeId");
	} else {
		localStorage.setItem("selectedOfficeId", newVal.toString());
	}
});

const handleOfficeCheckbox = (officeId) => {
	if (selectedOfficeId.value === officeId) {
		selectedOfficeId.value = null;
		localStorage.removeItem("selectedOfficeId");
	} else {
		selectedOfficeId.value = officeId;
		localStorage.setItem("selectedOfficeId", officeId.toString());
	}
};

const showOfficeForm = ref(false);
const showSharingForm = ref(false);
const selectedOffice = ref(null);

const openNewOfficeForm = () => {
	selectedOffice.value = null;
	showOfficeForm.value = true;
};

const openSharingForm = () => {
	showSharingForm.value = showSharingForm.value ? false : true;
};

const editOffice = (office) => {
	selectedOffice.value = { ...office };
	showOfficeForm.value = true;
};

const deleteOffice = async (id) => {
	if (confirm("Naozaj chcete odstrániť kanceláriu?")) {
		await officeStore.deleteOffice(id);
	}
};

const handleOfficeSaved = () => {
	showOfficeForm.value = false;
	selectedOffice.value = null;
};

const handleOfficeEdited = () => {
	// Remove the manual store update - let the store handle it
	showOfficeForm.value = false;
	selectedOffice.value = null;
};

const showOfficeActivities = async (officeId) => {
	//setOfficeID.value = officeId;
	officeStore.setOfficeID = officeId;
	//console.log("Selected Office ID:", officeStore.setOfficeID);
	officeStore.getOfficeActivities(officeId);
};
</script>
