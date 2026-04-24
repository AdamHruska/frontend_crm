<script setup>
const config = useRuntimeConfig();

import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();

import { useUserStore } from "#imports";
const userStore = useUserStore();

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

// Contact type refs
const isNew = ref(false);
const isContact = ref(true);
const isCoWorker = ref(false);

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

	console.log("single contact", props.single_contact);
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
				newVal.rok_narodenia || new Date().getFullYear(),
			);
			zamestanie.value = newVal.zamestanie || "";
			poznamka.value = newVal.poznamka || "";
			Investicny_dotaznik.value = newVal.Investicny_dotaznik || "";
			selectedAuthorId.value = newVal.author_id || "";
			console.log("selectedAuthorId", selectedAuthorId.value);
			aktualnyPoradca.value = newVal.current_advisor || "";
			isNew.value = newVal.isNew == 1;
			isContact.value = newVal.isContact ?? true;
			isCoWorker.value = newVal.isCoWorker ?? false;
		} else {
			resetForm();
		}
	},
	{ immediate: true },
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
	isNew.value = false;
	isContact.value = true;
	isCoWorker.value = false;
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
		isNew: isNew.value,
		isContact: isContact.value,
		isCoWorker: isCoWorker.value,
	};

	const response = await axios.put(
		`${config.public.apiUrl}post-update-contact/${id}`,
		person,
		{
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
			},
		},
	);

	if (response.status === 200) {
		toast.success("Úspešne upravené!");
	} else {
		toast.error("Niečo sa pokazilo!");
	}
	emit("alterPerson", response.data.contact);
};

const currentUser = computed(() => {
	return userStore.user.username;
});
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
							<!-- <div class="flex-1">
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
							</div> -->
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

						<div class="flex gap-16 mb-9 mt-10">
							<div
								v-if="props.single_contact.author_id == userStore.user.id"
								class="flex-1"
							>
								<label
									for="author_id"
									class="block text-gray-800 mb-2 font-medium"
									>Zmeniť poradcu: {{ currentUser }}</label
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

							<!-- <div class="flex-1">
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
							</div> -->

							<!-- Contact type row -->
							<div class="flex items-center gap-8 mb-8">
								<div class="flex items-center gap-3">
									<label class="custom-check">
										<input type="checkbox" v-model="isNew" />
										<span class="check-box">
											<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
												<path
													d="M1 4L3.5 6.5L9 1"
													stroke="white"
													stroke-width="1.8"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</span>
									</label>
									<span class="text-sm text-gray-600 font-medium"
										>Nový kontakt</span
									>
								</div>

								<div class="flex items-center gap-3">
									<span class="text-sm text-gray-600 font-medium">Typ:</span>
									<div class="type-toggle">
										<button
											type="button"
											:class="['toggle-btn', isContact ? 'active-contact' : '']"
											@click="
												isContact = true;
												isCoWorker = false;
											"
										>
											Klient
										</button>
										<button
											type="button"
											:class="[
												'toggle-btn',
												isCoWorker ? 'active-coworker' : '',
											]"
											@click="
												isCoWorker = true;
												isContact = false;
											"
										>
											Spolupracovník
										</button>
									</div>
								</div>
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

/* Custom checkbox */
.custom-check {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
}

.custom-check input {
	display: none;
}

.check-box {
	width: 18px;
	height: 18px;
	border-radius: 5px;
	border: 1.5px solid #d1d5db;
	background: #f9fafb;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.15s ease;
}

.check-box svg {
	display: none;
}

.custom-check input:checked + .check-box {
	background: #3b82f6;
	border-color: #3b82f6;
}

.custom-check input:checked + .check-box svg {
	display: block;
}

.custom-check:hover .check-box {
	border-color: #93c5fd;
}

/* Type toggle */
.type-toggle {
	display: inline-flex;
	gap: 4px;
	background: #f3f4f6;
	border-radius: 8px;
	padding: 3px;
	border: 1px solid #e5e7eb;
}

.toggle-btn {
	font-size: 12px;
	font-weight: 500;
	padding: 4px 12px;
	border-radius: 5px;
	cursor: pointer;
	color: #6b7280;
	border: none;
	background: transparent;
	transition: all 0.15s ease;
}

.toggle-btn.active-contact {
	background: #3b82f6;
	color: #fff;
}

.toggle-btn.active-coworker {
	background: #8b5cf6;
	color: #fff;
}
</style>
