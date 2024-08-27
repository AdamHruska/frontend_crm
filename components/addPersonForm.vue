<script setup>
import { ref, watch } from "vue";
import axios from "axios";
import { Icon } from "@iconify/vue";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();

authStore.loadToken();

// const users = ref([]);
// Define refs for form fields
const meno = ref("");
const priezvisko = ref("");
const poradca = ref("");
const cislo = ref("");
const email = ref("");
const odporucitel = ref("");
const adresa = ref("");
const vek = ref("");
const zamestanie = ref("");
const poznamka = ref("");
const Investicny_dotaznik = ref("");
const author_id = ref("");
// const selectedAuthorId = ref("");

// Define emits and props
const emit = defineEmits(["cancelAdd", "addPerson"]);

// Watch for changes in props.single_contact

// Function to clear form fields
function resetForm() {
	meno.value = "";
	priezvisko.value = "";
	poradca.value = "";
	cislo.value = "";
	email.value = "";
	odporucitel.value = "";
	adresa.value = "";
	vek.value = "";
	zamestanie.value = "";
	poznamka.value = "";
	Investicny_dotaznik.value = null;
	console.log(meno.value);
}

function cancelAdd() {
	resetForm();
	emit("cancelAdd");
}

const addPerson = async () => {
	const person = {
		meno: meno.value,
		priezvisko: priezvisko.value,
		cislo: cislo.value,
		email: email.value,
		odporucitel: odporucitel.value,
		adresa: adresa.value,
		vek: vek.value,
		zamestanie: zamestanie.value,
		poznamka: poznamka.value,
		Investicny_dotaznik: Investicny_dotaznik.value,
		author_id: author_id.value,
	};

	const response = await axios.post(
		"http://localhost:8000/api/post-create-contact",
		person,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	if (response.data.status == "201") {
		console.log("Contact added successfully:", response.data.contact);
		emit("addPerson", response.data.contact);
	}
	//console.log("Contact added successfully:", response.data.contact);
	// emit("addPerson");
};

// function addPerson() {
// 	const person = {
// 		meno: meno.value,
// 		priezvisko: priezvisko.value,
// 		cislo: cislo.value,
// 		email: email.value,
// 		odporucitel: odporucitel.value,
// 		adresa: adresa.value,
// 		vek: vek.value,
// 		zamestanie: zamestanie.value,
// 		poznamka: poznamka.value,
// 		Investicny_dotaznik: Investicny_dotaznik.value,
// 		author_id: author_id.value,
// 	};

// 	axios
// 		.post("http://localhost:8000/api/post-create-contact", person, {
// 			headers: {
// 				Authorization: `Bearer ${authStore.token}`,
// 			},
// 		})
// 		.then((response) => {
// 			console.log("Contact added successfully:", response.data);
// 			// Clear the form fields
// 			resetForm();
// 		})
// 		.catch((error) => {
// 			console.error(
// 				"Error adding contact:",
// 				error.response ? error.response.data : error.message
// 			);
// 		});
// 	emit("addPerson");
// }

// onMounted(async () => {
// 	const response = await axios.get("http://localhost:8000/api/get-users", {
// 		headers: {
// 			Authorization: `Bearer ${authStore.token}`,
// 		},
// 	});
// 	users.value = response.data.users;
// 	console.log(users.value);
// });
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50"
	>
		<div
			class="bg-slate-800 p-4 min-w-[1024px] min-h-[70vh] rounded-lg shadow-lg"
		>
			<div class="">
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-2xl font-semibold text-center flex-1">
						Pridať kontakt
					</h2>
					<Icon
						icon="fa6-solid:xmark"
						@click="cancelAdd()"
						class="cursor-pointer text-2xl"
					/>
				</div>

				<form @submit.prevent="handleSubmit">
					<div class="w-full px-10">
						<!-- Flex container for each row of inputs -->
						<div class="flex gap-16 mb-9 relative">
							<label v-if="meno" class="text-gray-400 absolute top-[-22px]"
								>Meno</label
							>
							<div class="flex-1">
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
									class="text-gray-400 absolute top-[-22px]"
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

						<div class="mb-9 w-[46%] ml-0 relative">
							<!-- PORADCA na vyber -->
							<!-- <div class="flex-1">
								<label for="poradca" class="text-gray-400">Poradca</label>
								<select
									v-model="selectedAuthorId"
									id="author_id"
									class="w-full bg-gray-700 text-white rounded-lg"
								>
									<option v-for="user in users" :key="user.id" :value="user.id">
										{{ user.first_name }} {{ user.last_name }}
									</option>
								</select>
							</div> -->
							<div class="flex-1 w-full">
								<label v-if="cislo" class="text-gray-400 absolute top-[-22px]"
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
								<label v-if="email" class="text-gray-400 absolute top-[-22px]"
									>Email</label
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
									class="text-gray-400 absolute top-[-22px]"
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
								<label for="Investicny_dotaznik" class="absolute text-gray-400"
									>Investicný dotazník vyplnený</label
								>
								<input
									id="Investicny_dotaznik"
									type="date"
									class="w-full pl-[280px] text-gray-400"
									v-model="Investicny_dotaznik"
									:class="{ 'text-white': Investicny_dotaznik }"
								/>
							</div>
							<div class="flex-1">
								<label v-if="adresa" class="text-gray-400 absolute top-[-22px]"
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
								<label v-if="vek" class="text-gray-400 absolute top-[-22px]"
									>Vek</label
								>
								<input
									v-model="vek"
									id="rok_narodenia"
									type="text"
									class="w-full"
									placeholder="Vek"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="zamestanie"
									class="text-gray-400 absolute top-[-22px]"
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

						<div class="mb-6 mt-6 relative">
							<label v-if="poznamka" class="text-gray-400 absolute top-[-22px]"
								>poznámka</label
							>
							<textarea
								v-model="poznamka"
								id="poznamka"
								type="text"
								class="w-full"
								placeholder="Poznámka"
							/>
						</div>

						<div class="text-center mb-8"></div>
					</div>
				</form>
			</div>
			<!--<UTable :columns="columns" :rows="people" class="mx-2 mb-6">
			
				<template #id-data="{ row }">
					<input
						v-model="row.id"
						type="text"
						class="border border-gray-300 rounded-md p-2 w-full"
						placeholder="ID"
					/>
				</template>

				<template #name-data="{ row }">
					<input
						v-model="row.name"
						type="text"
						class="border border-gray-300 rounded-md p-2 w-full"
						placeholder="Name"
					/>
				</template>

				<template #title-data="{ row }">
					<input
						v-model="row.title"
						type="text"
						class="border border-gray-300 rounded-md p-2 w-full"
						placeholder="Title"
					/>
				</template>

				<template #email-data="{ row }">
					<input
						v-model="row.email"
						type="text"
						class="border border-gray-300 rounded-md p-2 w-full"
						placeholder="Email"
					/>
				</template>

				<template #role-data="{ row }">
					<input
						v-model="row.role"
						type="text"
						class="border border-gray-300 rounded-md p-2 w-full"
						placeholder="Role"
					/>
				</template>
			</UTable>
			<button
				@click="addRow"
				class="float-right mr-7 absolute right-[170px] bg-green-500 px-3 py-1 rounded-md"
			>
				Add row
			</button>-->
			<div class="flex justify-center">
				<button
					@click="addPerson()"
					class="bg-blue-500 text-white w-[75px] py-2 rounded mr-2 hover:bg-blue-400 font-semibold"
				>
					Pridať
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/*input {
	background-color: #1e293b;
	border: none;
	border-radius: 0;
	box-shadow: 0 0 0 0.1px rgb(229, 231, 235);
}*/

input {
	border-bottom: 1px solid #979797;
	background-color: #1e293b;
	height: 30px;
	/*padding-left: 5px;*/
}

textarea {
	border-bottom: 1px solid #979797;
	background-color: #1e293b;
	height: 50px;
	padding-left: 5px;
	padding-top: 5px;
}
</style>
