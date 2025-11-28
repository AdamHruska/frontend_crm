<template>
	<div class="p-8">
		<div class="flex">
			<h1 class="font-semibold text-xl mb-8">
				{{ officeToEdit ? "Upravte kanceláriu" : "Vyplnte údaje kancelárie" }}
			</h1>
			<div
				class="cursor-pointer ml-20 mt-1 hover:scale-105 transition-transform"
				@click="emit('cancel')"
			>
				<Icon icon="fa6-solid:xmark" class="" />
			</div>
		</div>

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

import { Icon } from "@iconify/vue";

const props = defineProps({
	officeToEdit: {
		type: Object,
		default: null,
	},
});

const emit = defineEmits(["officeSaved", "officeEdited", "cancel"]);

const name = ref("");
const location = ref("");
const phone_number = ref("");

// Watch for changes in officeToEdit prop and update form fields
watch(
	() => props.officeToEdit,
	(newOffice) => {
		if (newOffice) {
			name.value = newOffice.name || "";
			location.value = newOffice.location || "";
			phone_number.value = newOffice.phone_number || "";
		} else {
			// Reset form when creating new office
			name.value = "";
			location.value = "";
			phone_number.value = "";
		}
	},
	{ immediate: true }
);

const saveOffice = async () => {
	const officeData = {
		name: name.value,
		location: location.value,
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
