<template>
	<!-- tu dat podmienku pre zobrazenie stranky -->
	<div v-if="isAdmin">
		<OfficeForm
			v-if="showOfficeForm"
			:officeToEdit="selectedOffice"
			@officeSaved="handleOfficeSaved"
			@officeEdited="handleOfficeEdited"
		/>
		<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
			<SearchBarOfiicesAdmin @updateResults="updateSearchResults" />
		</div>
		<div class="ml-8 mt-8 mb-10">
			<h1 class="text-xl font-semibold mb-4">Moje kancelárie</h1>
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
							v-for="(office, index) in officeStore.officesAdmin"
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
	</div>
	<div
		v-else
		class="text-2xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2"
	>
		Prístup má len administrátor
	</div>
</template>

<script setup>
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useOfficeStore } from "~/stores/officeStore";
const officeStore = useOfficeStore();

onBeforeMount(() => {});

onMounted(() => {
	officeStore.fetchOfficesAdmin();
});
const isAdmin = computed(() => {
	if (
		userStore.user &&
		userStore.user.first_name === "admin" &&
		userStore.user.last_name === "admin" &&
		userStore.user.email === "admin@admin.com"
	) {
		return true;
	} else {
		return false;
	}
});

const deleteOffice = async (id) => {
	if (confirm("Naozaj chcete odstrániť kanceláriu?")) {
		await officeStore.deleteOffice(id);
		officeStore.officesAdmin = officeStore.officesAdmin.filter(
			(office) => office.id !== id
		);
	}
};
const showOfficeForm = ref(false);
const selectedOffice = ref(null);

const editOffice = (office) => {
	selectedOffice.value = { ...office };
	showOfficeForm.value = true;
};

const showOfficeActivities = async (officeId) => {
	//setOfficeID.value = officeId;
	officeStore.setOfficeID = officeId;
	//console.log("Selected Office ID:", officeStore.setOfficeID);
	officeStore.getOfficeActivities(officeId);
};
</script>
