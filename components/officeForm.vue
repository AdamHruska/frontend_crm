<template>
	<div class="p-8">
		<h1 class="font-semibold text-xl mb-8">
			{{ officeToEdit ? "Upravte kanceláriu" : "Vyplnte údaje kancelárie" }}
		</h1>
		<form>
			<div class="mb-4">
				<label for="name" class="block text-sm font-medium text-gray-700">
					Názov kancelárie
				</label>
				<input
					type="text"
					id="name"
					class="mt-1 block border border-gray-300 rounded-md shadow-sm p-2 bg-white"
					v-model="name"
				/>
			</div>
			<div class="mb-4">
				<label for="location" class="block text-sm font-medium text-gray-700">
					Poloha
				</label>
				<input
					type="text"
					id="location"
					class="mt-1 block border border-gray-300 rounded-md shadow-sm p-2 bg-white"
					v-model="location"
				/>
			</div>
			<div class="mb-4">
				<label for="district" class="block text-sm font-medium text-gray-700">
					Okres
				</label>
				<select
					id="district"
					v-model="district"
					class="mt-1 block border border-gray-300 rounded-md shadow-sm p-2 bg-white"
				>
					<option disabled value="">-- Vyberte okres --</option>
					<option v-for="okres in okresy" :key="okres" :value="okres">
						{{ okres }}
					</option>
				</select>
			</div>
			<div class="mb-4">
				<label for="phone" class="block text-sm font-medium text-gray-700">
					Telefónne číslo
				</label>
				<input
					type="text"
					id="phone"
					class="mt-1 block border border-gray-300 rounded-md shadow-sm p-2 bg-white"
					v-model="phone_number"
				/>
			</div>

			<button
				type="button"
				@click="saveOffice"
				class="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
			>
				{{ officeToEdit ? "Uložiť zmeny" : "Uložiť kanceláriu" }}
			</button>
		</form>
	</div>
</template>

<script setup>
import { useOfficeStore } from "~/stores/officeStore";
const officeStore = useOfficeStore();

const props = defineProps({
	officeToEdit: {
		type: Object,
		default: null,
	},
});

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

const emit = defineEmits(["officeSaved", "officeEdited"]);

const name = ref("");
const location = ref("");
const district = ref("");
const phone_number = ref("");

// Watch for changes in officeToEdit prop and update form fields
watch(
	() => props.officeToEdit,
	(newOffice) => {
		if (newOffice) {
			name.value = newOffice.name || "";
			location.value = newOffice.location || "";
			district.value = newOffice.district || "";
			phone_number.value = newOffice.phone_number || "";
		} else {
			// Reset form when creating new office
			name.value = "";
			location.value = "";
			district.value = "";
			phone_number.value = "";
		}
	},
	{ immediate: true }
);

const saveOffice = async () => {
	const officeData = {
		name: name.value,
		location: location.value,
		district: district.value,
		phone_number: phone_number.value,
	};

	if (props.officeToEdit) {
		await officeStore.updateOffice(props.officeToEdit.id, officeData);
		emit("officeEdited", { ...officeData, id: props.officeToEdit.id });
	} else {
		await officeStore.addOffice(officeData);
		emit("officeSaved");
	}
};
</script>
