<script setup>
const config = useRuntimeConfig();

import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();

import { useToast } from "vue-toastification";
const toast = useToast();

import { ref, watch } from "vue";
import axios from "axios";
import { Icon } from "@iconify/vue";

const users = ref([]);

function calculateAge(yearOfBirth) {
	const currentYear = new Date().getFullYear();
	const age = currentYear - yearOfBirth;
	return age;
}

// Define refs for form fields
const meno = ref("");
const priezvisko = ref("");
const poradca = ref("");
const cislo = ref("");
const email = ref("");
const odporucitel = ref("");
const adresa = ref("");
const rok_narodenia = ref("");
const zamestanie = ref("");
const poznamka = ref("");
const Investicny_dotaznik = ref("");
const selectedAuthorId = ref("");
const author_id = ref("");
const aktualnyPoradca = ref("");

// Define emits and props
const emit = defineEmits(["cancelAlter", "alterPerson"]);
const props = defineProps({
	single_contact: Object,
});

onMounted(async () => {
	const response = await axios
		.get(`${config.public.apiUrl}get-users`, {
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
			},
		})
		.then((response) => {
			users.value = response.data.users;
		});
});

// Watch for changes in props.single_contact
watch(
	() => props.single_contact,
	(newVal) => {
		if (newVal) {
			meno.value = newVal.meno || "";
			priezvisko.value = newVal.priezvisko || "";
			poradca.value = newVal.poradca || "";
			cislo.value = newVal.cislo || "";
			email.value = newVal.email || "";
			odporucitel.value = newVal.odporucitel || "";
			adresa.value = newVal.adresa || "";
			rok_narodenia.value = calculateAge(
				newVal.rok_narodenia || new Date().getFullYear()
			);
			zamestanie.value = newVal.zamestanie || "";
			poznamka.value = newVal.poznamka || "";
			Investicny_dotaznik.value = newVal.Investicny_dotaznik || "";
			selectedAuthorId.value = newVal.author_id || "";
			aktualnyPoradca.value = newVal.current_advisor || "";
		} else {
			resetForm();
		}
	},
	{ immediate: true }
);

function resetForm() {
	meno.value = "";
	priezvisko.value = "";
	poradca.value = "";
	cislo.value = "";
	email.value = "";
	odporucitel.value = "";
	adresa.value = "";
	rok_narodenia.value = "";
	zamestanie.value = "";
	poznamka.value = "";
	Investicny_dotaznik.value = null;
	selectedAuthorId.value = null;
	aktualnyPoradca.value = "";
}

function cancelAlter() {
	resetForm();
	emit("cancelAlter");
}

const alterPerson = async (id) => {
	const person = {
		id: props.single_contact.id,
		meno: meno.value,
		priezvisko: priezvisko.value,
		poradca: poradca.value ? String(poradca.value) : "",
		cislo: cislo.value,
		email: email.value,
		odporucitel: odporucitel.value,
		adresa: adresa.value,
		vek: rok_narodenia.value,
		zamestanie: zamestanie.value,
		poznamka: poznamka.value,
		Investicny_dotaznik: Investicny_dotaznik.value,
		author_id: selectedAuthorId.value,
		is_deleted: true,
		current_advisor: aktualnyPoradca.value,
	};
	// console.log(person);
	const response = await axios.put(
		`${config.public.apiUrl}post-update-contact/${id}`,
		person,
		{
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
			},
		}
	);

	if (response.status === 200) {
		toast.success("Úspešne upravené!");
	} else {
		toast.error("Niečo sa pokazilo!");
	}
	emit("alterPerson", response.data.contact);
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
	>
		<div class="bg-white p-6 min-w-[1024px] min-h-[70vh] rounded-lg shadow-xl">
			<div>
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-2xl font-semibold text-gray-800 text-center flex-1">
						Upraviť kontakt
					</h2>
					<Icon
						icon="fa6-solid:xmark"
						@click="cancelAlter()"
						class="cursor-pointer text-2xl text-gray-600 hover:text-gray-800"
					/>
				</div>

				<form @submit.prevent="handleSubmit">
					<div class="w-full px-10">
						<div class="flex gap-16 mb-9 relative">
							<div class="flex-1">
								<label
									v-if="meno"
									for="meno"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Meno</label
								>
								<input
									v-model="meno"
									id="meno"
									type="text"
									class="w-full"
									placeholder="Meno"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="priezvisko"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Priezvisko</label
								>
								<input
									v-model="priezvisko"
									id="priezvisko"
									type="text"
									class="w-full"
									placeholder="Priezvisko"
								/>
							</div>
						</div>

						<div class="flex gap-16 mb-9 relative">
							<div class="flex-1">
								<label
									v-if="poradca"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Poradca</label
								>
								<input
									v-model="poradca"
									id="poradca"
									type="text"
									class="w-full"
									placeholder="Poradca"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="cislo"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Telefónne číslo</label
								>
								<input
									v-model="cislo"
									id="cislo"
									type="text"
									class="w-full"
									placeholder="Telefónne číslo"
								/>
							</div>
						</div>

						<div class="flex gap-16 mb-9 relative">
							<div class="flex-1">
								<label
									v-if="email"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>email</label
								>
								<input
									v-model="email"
									id="emial"
									type="email"
									class="w-full"
									placeholder="email"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="odporucitel"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Odporučiteľ</label
								>
								<input
									v-model="odporucitel"
									id="odporucitel"
									type="text"
									class="w-full"
									placeholder="Odporučiteľ"
								/>
							</div>
						</div>

						<div class="flex gap-16 mb-9 relative">
							<div class="flex-1">
								<label for="Investicny_dotaznik" class="absolute text-gray-600"
									>Investicný dotazník vyplnený</label
								>
								<input
									id="Investicny_dotaznik"
									type="date"
									class="w-full pl-[280px] text-gray-600"
									v-model="Investicny_dotaznik"
									:class="{ 'text-gray-800': Investicny_dotaznik }"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="adresa"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Adresa</label
								>
								<input
									v-model="adresa"
									id="adresa"
									type="text"
									class="w-full"
									placeholder="Adresa"
								/>
							</div>
						</div>

						<div class="flex gap-16 mb-4 relative">
							<div class="flex-1">
								<label
									v-if="rok_narodenia"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Vek</label
								>
								<input
									v-model="rok_narodenia"
									id="rok_narodenia"
									type="text"
									class="w-full"
									placeholder="Vek"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="zamestanie"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Zamestnanie</label
								>
								<input
									v-model="zamestanie"
									id="zamestanie"
									type="text"
									class="w-full"
									placeholder="Zamestanie"
								/>
							</div>
						</div>

						<div class="mb-6 mt-8 relative">
							<label
								v-if="poznamka"
								class="text-gray-600 absolute top-[-22px] font-medium"
								>Poznamka</label
							>
							<textarea
								v-model="poznamka"
								id="poznamka"
								type="text"
								class="w-full"
								placeholder="Poznámka"
							/>
						</div>
						<div class="flex gap-16 mb-9">
							<div class="flex-1">
								<label
									for="author_id"
									class="block text-gray-800 mb-2 font-medium"
									>Zmeniť poradcu</label
								>
								<select
									v-model="selectedAuthorId"
									id="author_id"
									class="w-1/3 bg-gray-50 text-gray-800 rounded-lg border border-gray-300"
								>
									<option v-for="user in users" :key="user.id" :value="user.id">
										{{ user.first_name }} {{ user.last_name }}
									</option>
								</select>
							</div>

							<div class="flex-1">
								<label
									v-if="zamestanie"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Aktuálny poradca</label
								>
								<input
									v-model="aktualnyPoradca"
									id="aktualnyPoradca"
									type="text"
									class="w-full"
									placeholder="Aktuálny poradca"
								/>
							</div>
						</div>
					</div>
				</form>
			</div>

			<div class="flex justify-center">
				<button
					@click="alterPerson(props.single_contact.id)"
					class="bg-blue-500 text-white w-[75px] py-2 rounded mr-2 hover:bg-blue-600 font-semibold transition-colors"
				>
					Upraviť
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
input {
	border-bottom: 1px solid #d1d5db;
	background-color: #ffffff;
	height: 30px;
	color: #374151;
}

input::placeholder {
	color: #9ca3af;
}

textarea {
	border-bottom: 1px solid #d1d5db;
	background-color: #ffffff;
	height: 50px;
	padding-left: 5px;
	padding-top: 5px;
	color: #374151;
}

textarea::placeholder {
	color: #9ca3af;
}

input:focus,
textarea:focus {
	outline: none;
	border-bottom: 2px solid #3b82f6;
}

select {
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #d1d5db;
}

select:focus {
	outline: none;
	border-color: #3b82f6;
	ring: 2px solid #3b82f6;
}
</style>
