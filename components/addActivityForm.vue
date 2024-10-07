<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
const props = defineProps({
	contact_id: {
		type: String,
		required: true,
	},
});

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

const contact = ref([]);

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

const emailBool = ref(false);
const email = ref("");

watch(aktivita, (newValue) => {
	if (newValue === "ine") {
		ineBool.value = true;
	} else {
		ineBool.value = false;
	}
});

onBeforeMount(async () => {
	const response = await findPerson(props.contact_id);
	console.log("test", contact.value);
	if (contact.value[0].email) {
		emailBool.value = true;
	}
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		if (response.data && response.data.contact) {
			contact.value = [response.data.contact]; // Wrap the contact in an array
		}
	} catch (error) {
		console.error("Error fetching contact:", error);
	}
};

const emit = defineEmits(["cancelAddActivity", "activityAdded"]);

const cancelActivity = () => {
	emit("cancelAddActivity");
};

// const submitActivity = () => {
// 	// api call to submit activity
// 	addActivity();
// 	emit("cancelAddActivity");
// };

const addActivity = async () => {
	event.preventDefault();
	if (aktivita.value === "ine") {
		aktivita.value = ina_aktivita.value;
	}
	try {
		const response = await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: props.contact_id,
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
		if (!emailBool.value) {
			const emailResponse = await axios.patch(
				`${config.public.apiUrl}contact/${props.contact_id}/email`,
				{
					email: email.value,
				},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
		}

		// if (emailResponse) {
		// 	console.log(emailResponse.data.contact, "email Add");
		// }
		console.log(response.data.activity);

		// Emit the newly added activity to the parent
		emit("activityAdded", response.data.activity);

		// Close the form
		emit("cancelAddActivity");
	} catch (error) {
		console.error("Error adding activity:", error);
	}
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
	>
		<div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
		<form
			class="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>
			<div v-if="!emailBool">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Pridať email ku kontaktu:
				</label>
				<input
					v-model="email"
					type="email"
					class="w-full mt-3 p-1 bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte email ..."
				/>
			</div>
			<div class="relative z-0 w-full mb-5 mt-2 group">
				<!-- <input
					v-model="aktivita"
					type="text"
					name="aktivita"
					id="floating_aktivita"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
					required
				/> -->
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita</label
				>
				<select
					v-model="aktivita"
					id="floating_aktivita"
					class="w-full bg-gray-700 text-white rounded-lg p-1 mt-1"
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
					class="w-full mt-3 p-1 bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500"
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

			<!-- <div class="relative z-0 w-full mb-5 group">
				<input
					type="text"
					name="aktivita_zadana"
					id="floating_aktivita_zadana"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
					required
				/>
				<label
					for="floating_aktivita_zadana"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita zadaná</label
				>
			</div> -->

			<div class="relative z-0 w-full mb-5 group">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Miesto stretnutia</label
				>
				<input
					v-model="miesto_stretnutia"
					type="text"
					class="w-full mt-3 p-1 bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500"
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

				<!-- Volane
				<div class="flex flex-col items-center">
					<label class="text-gray-500 dark:text-gray-400">Volané</label>
					<div class="flex gap-5 mt-1">
						<label
							:class="{
								'w-[30px] h-[35px] flex justify-center items-center cursor-pointer rounded-md': true,
								'bg-blue-500 border-2 border-blue-700': volane === 0,
								'bg-slate-700 hover:bg-slate-500': volane !== 0,
							}"
						>
							<input type="radio" v-model="volane" :value="0" class="sr-only" />
							0
						</label>
						<label
							:class="{
								'w-[30px] h-[35px] flex justify-center items-center cursor-pointer rounded-md': true,
								'bg-blue-500 border-2 border-blue-700': volane === 1,
								'bg-slate-700 hover:bg-slate-500': volane !== 1,
							}"
						>
							<input type="radio" v-model="volane" :value="1" class="sr-only" />
							1
						</label>
					</div>
				</div>
				
			
				<div class="flex flex-col items-center">
					<label class="text-gray-500 dark:text-gray-400">Dovolané</label>
					<div class="flex gap-5 mt-1">
						<label
							:class="{
								'w-[30px] h-[35px] flex justify-center items-center cursor-pointer rounded-md': true,
								'bg-blue-500 border-2 border-blue-700': dovolane === 0,
								'bg-slate-700 hover:bg-slate-500': dovolane !== 0,
							}"
						>
							<input
								type="radio"
								v-model="dovolane"
								:value="0"
								class="sr-only"
							/>
							0
						</label>
						<label
							:class="{
								'w-[30px] h-[35px] flex justify-center items-center cursor-pointer rounded-md': true,
								'bg-blue-500 border-2 border-blue-700': dovolane === 1,
								'bg-slate-700 hover:bg-slate-500': dovolane !== 1,
							}"
						>
							<input
								type="radio"
								v-model="dovolane"
								:value="1"
								class="sr-only"
							/>
							1
						</label>
					</div>
				</div>

				
				<div class="flex flex-col items-center">
					<label class="text-gray-500 dark:text-gray-400">Dohodnuté</label>
					<div class="flex gap-5 mt-1">
						<label
							:class="{
								'w-[30px] h-[35px] flex justify-center items-center cursor-pointer rounded-md': true,
								'bg-blue-500 border-2 border-blue-700': dohodnute === 0,
								'bg-slate-700 hover:bg-slate-500': dohodnute !== 0,
							}"
						>
							<input
								type="radio"
								v-model="dohodnute"
								:value="0"
								class="sr-only"
							/>
							0
						</label>
						<label
							:class="{
								'w-[30px] h-[35px] flex justify-center items-center cursor-pointer rounded-md': true,
								'bg-blue-500 border-2 border-blue-700': dohodnute === 1,
								'bg-slate-700 hover:bg-slate-500': dohodnute !== 1,
							}"
						>
							<input
								type="radio"
								v-model="dohodnute"
								:value="1"
								class="sr-only"
							/>
							1
						</label>
					</div>
				</div> -->
			</div>
			<div class="flex justify-center items-center mt-3">
				<button
					@click="addActivity()"
					class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Pridať
				</button>
			</div>
		</form>
	</div>
</template>
