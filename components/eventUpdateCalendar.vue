<script setup>
const config = useRuntimeConfig();
const router = useRouter();
import { Icon } from "@iconify/vue";
import axios from "axios";
const props = defineProps({
	activityID: String,
	user: Object,
});

import { useUserStore } from "#imports";
const userStore = useUserStore();

import { useCalendarstore } from "#imports";
const calendarStore = useCalendarstore();

import { useAuthStore } from "@/stores/authStore";
import AlterPersonForm from "./alterPersonForm.vue";
const authStore = useAuthStore();
authStore.loadToken();

const contact = ref([]);

const kontakt = ref("");
const aktivita = ref("");
const ina_aktivita = ref("");
const datum_cas = ref("");
const koniec = ref("");
const poznamka = ref("");
const volane = ref("");
const dovolane = ref("");
const dohodnute = ref("");
const ineBool = ref(false);
const miesto_stretnutia = ref("");
const onlineMeeting = ref(false);
const activity_creator = ref("");

const emailBool = ref(false);
const email = ref("");

const showAlterButtons = ref(false);

watch(aktivita, (newValue) => {
	if (newValue === "ine") {
		ineBool.value = true;
	} else {
		ineBool.value = false;
	}
});

onMounted(async () => {
	const response = await axios.get(
		`${config.public.apiUrl}activities/${props.activityID}`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	//console.log("Response:", response.data.activity);
	activity_creator.value = response.data.activity.created_id;
	aktivita.value = response.data.activity.aktivita;
	ina_aktivita.value = response.data.activity.aktivita;
	datum_cas.value = response.data.activity.datumCas;
	koniec.value = response.data.activity.koniec;
	poznamka.value = response.data.activity.poznamka;
	volane.value = response.data.activity.volane;
	dovolane.value = response.data.activity.dovolane;
	dohodnute.value = response.data.activity.dohodnute;
	ineBool.value = response.data.activity.ineBool;
	miesto_stretnutia.value = response.data.activity.miesto_stretnutia;
	onlineMeeting.value = response.data.activity.onlineMeeting;

	const responseContact = await axios.get(
		`${config.public.apiUrl}contact/${response.data.activity.contact_id}`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	contact.value = responseContact.data.contact;

	if (contact.value.email === null) {
		emailBool.value = false;
	} else {
		email.value = contact.value.email;
	}
});

const emit = defineEmits(["cancelAddActivity", "activityAdded", "alterEvents"]);

const cancelActivity = () => {
	emit("cancelAddActivity");
};

function getIdFromString(str) {
	const words = str.split(" ");
	return words[words.length - 1];
}

const updateActivity = async () => {
	changeLoading();
	event.preventDefault();
	// if (aktivita.value === "ine") {
	// 	aktivita.value = ina_aktivita.value;
	// }
	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activities/${props.activityID}`,
			{
				contact_id: getIdFromString(kontakt.value),
				//email: email.value,
				aktivita: aktivita.value,
				datumCas: datum_cas.value,
				koniec: koniec.value,
				poznamka: poznamka.value,
				volane: volane.value,
				dovolane: dovolane.value,
				dohodnute: dohodnute.value,
				miesto_stretnutia: miesto_stretnutia.value,
				online_meeting: onlineMeeting.value,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		const responseMail = await axios.patch(
			`${config.public.apiUrl}contact/${contact.value.id}/email`,
			{
				email: email.value,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		const activityIndex = calendarStore.activities.findIndex(
			(activity) => activity.id === response.data.activity.id
		);

		// If the activity is found, replace it with the updated activity
		if (activityIndex !== -1) {
			calendarStore.activities.splice(activityIndex, 1, response.data.activity);
		}

		// const updatedActivity = response.data.activity;
		// const transformedActivity = transformData([updatedActivity])[0];

		// Find and replace the activity in the store
		// const activityIndex = calendarStore.activities.findIndex(
		// 	(activity) => activity.id === updatedActivity.id
		// );

		// if (activityIndex !== -1) {
		// 	// Replace the old activity with the transformed one
		// 	calendarStore.activities.splice(activityIndex, 1, transformedActivity);
		// }

		console.log("calendarStore.activities", calendarStore.activities);

		emit("activityAdded", response.data.activity);
		emit("alterEvents", response.data.activity);

		// Close the form
		emit("cancelAddActivity");
		changeLoading();
		cancelActivity();
	} catch (error) {
		console.error("Error adding activity:", error);
	}
};

// const transformData = (data) => {
// 	return data.map((item) => {
// 		var farba = "";
// 		const formattedStart = item.datumCas.replace(" ", "T");
// 		if (item.created_id == userStore.user.id) {
// 			console.log("porovnanie", item.created_id, " ", userStore.user.id);
// 			farba = "rgb(37 99 235)";
// 		} else {
// 			farba = "red";
// 		}

// 		console.log("item:", item);

// 		return {
// 			id: item.id,
// 			title: item.aktivita,
// 			start: formattedStart,
// 			end: item.koniec,
// 			backgroundColor: farba,
// 			borderColor: farba,
// 			user_id: item.created_id,
// 		};
// 	});
// };
// const deleteActivity = async () => {
// 	event.preventDefault();
// 	try {
// 		// Uncomment and use this when you want to delete from backend
// 		// const response = await axios.delete(
// 		// 	`${config.public.apiUrl}delete-activities/${props.activityID}`,
// 		// 	{
// 		// 		headers: {
// 		// 			Authorization: `Bearer ${authStore.token}`,
// 		// 		},
// 		// 	}
// 		// );

// 		// Remove the activity from the calendarStore
// 		const index = calendarStore.activities.findIndex(
// 			(activity) => activity.id == props.activityID
// 		);

// 		if (index !== -1) {
// 			calendarStore.activities.splice(index, 1);
// 		}

// 		// Also remove from the parent component's events
// 		emit("cancelAddActivity");
// 	} catch (error) {
// 		console.error("Error deleting activity:", error);
// 	}
// };

const deleteActivity = async () => {
	event.preventDefault();

	await calendarStore.deleteActivity(props.activityID);
	emit("cancelAddActivity");
	emit("alterEvents", null);
};

const redirectToContact = () => {
	router.push(`/contact/${contact.value.id}`);
};

const loading = ref(false);

const changeLoading = () => {
	loading.value = !loading.value;
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<loadigcomponent v-if="loading" />
		<form
			class="relative bg-white bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<div>
				<div
					class="flex gap-3 my-4 cursor-pointer hover:bg-gray-200 p-2 border-b-2 border-black"
					v-if="contact.meno || contact.priezvisko"
					@click="redirectToContact"
				>
					<div>Kontakt:</div>
					<div>{{ contact.meno }}</div>
					<div>{{ contact.priezvisko }}</div>
				</div>

				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Upraviť email ku kontaktu:
				</label>
				<input
					v-model="email"
					type="email"
					class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte email ..."
				/>
			</div>
			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita</label
				>
				<select
					v-model="aktivita"
					id="floating_aktivita"
					class="w-full bg-gray-200 text-white rounded-lg p-1 mt-1"
				>
					<option value="Telefonát klient">Telefonát klient</option>
					<option value="Telefonát nábor">Telefonát nábor</option>
					<option value="Pohovor">Pohovor</option>
					<option value="Prvé stretnutie">Prvé stretnutie</option>
					<option value="Analýza osobných financí">
						Analýza osobných financí
					</option>
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
					class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<div class="relative z-0 w-full mb-6 group">
				<input
					v-model="onlineMeeting"
					type="checkbox"
					class="bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500 mr-4"
					value="true"
				/>
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Online Meeting</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<input
					v-model="datum_cas"
					type="datetime-local"
					step="900"
					name="datum_cas"
					id="floating_datum_cas"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
				<label
					for="floating_datum_cas"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Dátum a čas začatia</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<input
					v-model="koniec"
					type="datetime-local"
					step="900"
					name="datum_cas_koniec"
					id="floating_datum_cas_koniec"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
				<label
					for="floating_datum_cas_koniec"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Dátum a čas ukončenia</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<textarea
					v-model="poznamka"
					name="poznamka"
					id="floating_poznamka"
					rows="3"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				></textarea>
				<label
					for="floating_poznamka"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Poznámka k aktivite</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Miesto stretnutia</label
				>
				<input
					v-model="miesto_stretnutia"
					type="text"
					class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte miesto stretnutia ..."
				/>
			</div>

			<div class="flex justify-between px-12 pb-4">
				<!-- VOLANE -->
				<label class="cursor-pointer flex flex-col items-center gap-4">
					<span
						class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
						>Volané</span
					>
					<input
						type="checkbox"
						value="1"
						class="sr-only peer"
						v-model="volane"
					/>
					<div
						class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
					></div>
				</label>

				<div>
					<!-- VOLANE -->
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
							>Dovolané</span
						>
						<input
							type="checkbox"
							value="1"
							class="sr-only peer"
							v-model="dovolane"
						/>
						<div
							class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
						></div>
					</label>
				</div>

				<div>
					<!-- VOLANE -->
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
							>Dohodnuté</span
						>
						<input
							type="checkbox"
							value="1"
							class="sr-only peer"
							v-model="dohodnute"
						/>
						<div
							class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
						></div>
					</label>
				</div>
			</div>
			<div
				v-if="userStore.user.id == activity_creator"
				class="flex justify-center items-center mt-3 gap-6"
			>
				<button
					@click="updateActivity()"
					class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Update
				</button>
				<button
					@click="deleteActivity()"
					class="text-white bg-red-500 hover:bg-red-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-red-500 dark:hover:bg-red-60"
				>
					Delete
				</button>
			</div>
		</form>
	</div>
</template>
