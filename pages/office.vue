<template>
	<OfficeForm
		v-if="showOfficeForm"
		:officeToEdit="selectedOffice"
		@officeSaved="handleOfficeSaved"
		@officeEdited="handleOfficeEdited"
	/>

	<button
		class="mt-4 ml-8 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
		@click="openNewOfficeForm"
		v-if="!showOfficeForm"
	>
		Pridať kanceláriu
	</button>

	<div class="ml-8 mt-8">
		<div v-if="officeStore.offices.length" class="overflow-x-auto">
			<div class="mb-4 flex items-center gap-4">
				<label for="districtFilter" class="font-medium"
					>Filtrovať podľa okresu:</label
				>
				<select
					id="districtFilter"
					v-model="selectedDistrict"
					class="border border-gray-300 rounded-md p-2 bg-white"
				>
					<option value="">-- Všetky okresy --</option>
					<option v-for="okres in okresy" :key="okres" :value="okres">
						{{ okres }}
					</option>
				</select>
			</div>

			<table
				class="min-w-full border border-gray-300 rounded-lg overflow-hidden"
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
						v-for="(office, index) in filteredOffices"
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
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div v-else class="text-gray-500 mt-4">
			Žiadne kancelárie zatiaľ neexistujú.
		</div>
	</div>
</template>

<script setup>
import { useOfficeStore } from "~/stores/officeStore";
const officeStore = useOfficeStore();

onMounted(() => {
	officeStore.fetchOffices();
});

const selectedDistrict = ref("");

const okresy = [
	"Bratislava I",
	"Bratislava II",
	"Bratislava III",
	"Bratislava IV",
	"Bratislava V",
	"Malacky",
	"Pezinok",
	"Senec",
	"Dunajská Streda",
	"Galanta",
	"Hlohovec",
	"Piešťany",
	"Senica",
	"Skalica",
	"Trnava",
	"Bánovce nad Bebravou",
	"Ilava",
	"Myjava",
	"Nové Mesto nad Váhom",
	"Partizánske",
	"Považská Bystrica",
	"Prievidza",
	"Trenčín",
	"Komárno",
	"Levice",
	"Nitra",
	"Nové Zámky",
	"Šaľa",
	"Topoľčany",
	"Zlaté Moravce",
	"Bytča",
	"Čadca",
	"Kysucké Nové Mesto",
	"Martin",
	"Námestovo",
	"Ružomberok",
	"Turčianske Teplice",
	"Tvrdošín",
	"Žilina",
	"Banská Bystrica",
	"Brezno",
	"Detva",
	"Krupina",
	"Lučenec",
	"Poltár",
	"Revúca",
	"Rimavská Sobota",
	"Veľký Krtíš",
	"Zvolen",
	"Žarnovica",
	"Žiar nad Hronom",
	"Banská Štiavnica",
	"Bardejov",
	"Humenné",
	"Kežmarok",
	"Levoča",
	"Medzilaborce",
	"Poprad",
	"Prešov",
	"Sabinov",
	"Snina",
	"Stará Ľubovňa",
	"Stropkov",
	"Svidník",
	"Vranov nad Topľou",
	"Gelnica",
	"Košice I",
	"Košice II",
	"Košice III",
	"Košice IV",
	"Košice-okolie",
	"Michalovce",
	"Rožňava",
	"Sobrance",
	"Trebišov",
];

const filteredOffices = computed(() => {
	if (!selectedDistrict.value) return officeStore.offices;
	return officeStore.offices.filter(
		(office) => office.district === selectedDistrict.value
	);
});

const showOfficeForm = ref(false);
const selectedOffice = ref(null);

const openNewOfficeForm = () => {
	selectedOffice.value = null;
	showOfficeForm.value = true;
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
</script>
