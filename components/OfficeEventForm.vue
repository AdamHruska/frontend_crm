<script setup>
import { Icon } from "@iconify/vue";
import { useOfficeStore } from "#imports";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();
const officeStore = useOfficeStore();

const emit = defineEmits(["closeForm"]);

const closeForm = () => {
	emit("closeForm");
};

const props = defineProps({
	startDate: {
		type: String,
		required: false,
		default: null,
	},
	eventData: {
		type: Object,
		required: false,
		default: null,
	},
});

// state
const aktivita = ref("Telefonát klient");
const datum_cas = ref(null);
const koniec = ref(null);
const poznamka = ref("");
const ina_aktivita = ref("");
const ineBool = computed(() => aktivita.value === "ine");

// detect edit mode
const isEdit = computed(() => !!props.eventData);

onMounted(() => {
	console.log("Props received in OfficeEventForm:");
	if (props.startDate && !props.eventData) {
		// creating new activity
		const formattedStart = formatForDateTimeLocal(props.startDate);
		datum_cas.value = formattedStart;
		koniec.value = formatForDateTimeLocal(addHours(props.startDate, 1));
	}

	if (props.eventData) {
		// editing existing activity
		aktivita.value = props.eventData.title || "Telefonát klient";
		datum_cas.value = formatForDateTimeLocal(props.eventData.start);
		koniec.value = formatForDateTimeLocal(props.eventData.end);
		poznamka.value = props.eventData.poznamka || "";
	}
});

// CREATE
const addActivity = async () => {
	try {
		const newActivity = {
			aktivita: aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
			datum_cas: new Date(datum_cas.value).toISOString(),
			koniec: new Date(koniec.value).toISOString(),
			poznamka: poznamka.value,
			office_id: officeStore.setOfficeID,
			owner_number: userStore.user.vizitka_phone_num,
		};
		await officeStore.storeActivity(newActivity);
		closeForm();
	} catch (error) {
		console.error("Error adding activity:", error);
	}
};

// UPDATE
const updateActivity = async () => {
	try {
		const updatedActivity = {
			id: props.eventData.id,
			aktivita: aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
			datum_cas: new Date(datum_cas.value).toISOString(),
			koniec: new Date(koniec.value).toISOString(),
			poznamka: poznamka.value,
		};
		await officeStore.updateActivity(updatedActivity);
		closeForm();
	} catch (error) {
		console.error("Error updating activity:", error);
	}
};

function formatForDateTimeLocal(isoString) {
	const date = new Date(isoString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addHours(isoString, hoursToAdd) {
	const date = new Date(isoString);
	date.setHours(date.getHours() + hoursToAdd);
	return date.toISOString();
}

const delteActivity = async () => {
	if (confirm("Naozaj chcete odstrániť túto aktivitu?")) {
		try {
			await officeStore.deleteActivity(props.eventData.id);
			closeForm();
		} catch (error) {
			console.error("Error deleting activity:", error);
		}
	}
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<div
			class="relative bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<div class="cursor-pointer" @click="closeForm()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<div v-if="props.eventData?.owner" class="flex mb-4 gap-6">
				<label class="text-sm text-gray-500">Vlastník aktivity:</label>
				<div>{{ props.eventData.owner }}</div>
			</div>

			<div v-if="props.eventData?.owner_number" class="flex mb-4 gap-6">
				<label class="text-sm text-gray-500">Telefónne číslo:</label>
				<div>{{ props.eventData.owner_number }}</div>
			</div>
			<!-- Aktivita -->
			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 mt-3"
					>Aktivita</label
				>
				<select
					v-model="aktivita"
					id="floating_aktivita"
					class="w-full bg-gray-200 rounded-lg p-1 py-2 mt-1 !text-black"
				>
					<option value="Telefonát klient">Telefonát klient</option>
					<option value="Telefonát nábor">Telefonát nábor</option>
					<option value="Pohovor">Pohovor</option>
					<option value="Prvé stretnutie">Prvé stretnutie</option>
					<option value="Analýza osobných financí">
						Analýza osobných financí
					</option>
					<option value="Servisná analýza">Servisná analýza</option>
					<option value="poradenstvo">Poradenstvo</option>
					<option value="realizácia">realizácia</option>
					<option value="konfirmačný servis">konfirmačný servis</option>
					<option value="servis">servis</option>
					<option value="bringer bonus">bringer bonus</option>
					<option value="káva">káva</option>
					<option value="stretnutie na zistenie stavu">
						stretnutie na zistenie stavu
					</option>
					<option value="súkromné">súkromné</option>
					<option value="lekár">lekár</option>
					<option value="ine">Iné vypíšem sám</option>
				</select>
				<input
					v-model="ina_aktivita"
					type="text"
					v-if="ineBool"
					class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-black pl-2 focus:outline-blue-500"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<!-- Začiatok -->
			<div class="relative z-0 w-full mb-5 group">
				<input
					v-model="datum_cas"
					type="datetime-local"
					step="900"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
				/>
				<label class="text-sm text-gray-500">Dátum a čas začatia</label>
			</div>

			<!-- Koniec -->
			<div class="relative z-0 w-full mb-5 group">
				<input
					v-model="koniec"
					type="datetime-local"
					step="900"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
				/>
				<label class="text-sm text-gray-500">Dátum a čas ukončenia</label>
			</div>

			<!-- Poznámka -->
			<div class="relative z-0 w-full mb-5 group">
				<textarea
					v-model="poznamka"
					rows="3"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				></textarea>
				<label class="text-sm text-gray-500">Poznámka k aktivite</label>
			</div>

			<!-- Buttons -->
			<div class="flex justify-center items-center mt-3 gap-6">
				<button
					v-if="!isEdit"
					@click="addActivity()"
					class="text-white bg-blue-700 hover:bg-blue-800 rounded-lg text-sm px-8 py-2.5"
				>
					Vytvoriť
				</button>
				<button
					v-else
					@click="updateActivity()"
					class="text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm px-8 py-2.5"
				>
					Upraviť
				</button>
				<button
					v-if="!isEdit"
					@click="closeForm()"
					class="text-white bg-red-500 hover:bg-red-700 rounded-lg text-sm px-8 py-2.5"
				>
					Zatvoriť
				</button>
				<button
					v-else
					@click="delteActivity()"
					class="text-white bg-red-500 hover:bg-red-700 rounded-lg text-sm px-8 py-2.5"
				>
					Vymazať
				</button>
			</div>
		</div>
	</div>
</template>
