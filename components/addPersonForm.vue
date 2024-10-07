<script setup>
const config = useRuntimeConfig();
import { ref, watch } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
authStore.loadToken();

const users = ref([
	{
		meno: "",
		priezvisko: "",
		cislo: "",
		email: "",
		odporucitel: "",
		adresa: "",
		vek: "",
		zamestanie: "",
		poznamka: "",
	},
]);

const odporucitelInput = ref(""); // New variable for top input

// Emit events to parent component
const emit = defineEmits(["cancelAdd", "addPeople"]);

// Function to add a new person (max 10 people)
function addRow() {
	if (users.value.length < 10) {
		users.value.push({
			meno: "",
			priezvisko: "",
			cislo: "",
			email: "",
			odporucitel: "",
			adresa: "",
			vek: "",
			zamestanie: "",
			poznamka: "",
		});
	}
}

// Function to reset the form
function resetForm() {
	users.value = [
		{
			meno: "",
			priezvisko: "",
			cislo: "",
			email: "",
			odporucitel: "",
			adresa: "",
			vek: "",
			zamestanie: "",
			poznamka: "",
		},
	];
}

// Function to handle cancel
function cancelAdd() {
	resetForm();
	emit("cancelAdd");
}

// Save all users data to cookies as they type
function saveToCookies() {
	Cookies.set("users", JSON.stringify(users.value));
}

// Watch users array and save changes to cookies
watch(users, saveToCookies, { deep: true });

// Watch for changes in the odporucitelInput and update users
watch(odporucitelInput, (newVal) => {
	users.value.forEach((user) => {
		user.odporucitel = newVal;
	});
});

// Function to submit all users
const addPeople = async () => {
	const people = users.value;
	try {
		for (let person of people) {
			await axios.post(`${config.public.apiUrl}post-create-contact`, person, {
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			});
		}
		Cookies.remove("users");
		emit("addPeople", people);
		resetForm();
	} catch (error) {
		console.error("Error adding people:", error);
	}
};
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50"
	>
		<div class="bg-slate-800 p-4 min-w-[1024px] rounded-lg shadow-lg h-[650px]">
			<div class="flex items-center justify-between mb-4">
				<div class="flex justify-center items-center gap-4">
					<h3>Odporučiteľ:</h3>
					<input class="border bg-gray-700" v-model="odporucitelInput" />
					<!-- Bind to the new variable -->
				</div>

				<h2
					class="text-2xl font-semibold absolute left-1/2 transform -translate-x-1/2"
				>
					Pridať kontakty
				</h2>
				<Icon
					icon="fa6-solid:xmark"
					@click="cancelAdd()"
					class="cursor-pointer text-2xl"
				/>
			</div>
			<button
				@click="addRow"
				:disabled="users.length >= 10"
				class="bg-green-500 text-white px-4 py-2 mb-6 mt-4 rounded hover:bg-green-400"
			>
				Pridať riadok
			</button>
			<!-- Table for entering user data -->
			<table class="min-w-full table-auto text-sm mb-4">
				<thead>
					<tr class="text-gray-400">
						<th>Meno</th>
						<th>Priezvisko</th>
						<th>Číslo</th>
						<th>Email</th>
						<th>Odporúčiteľ</th>
						<th>Adresa</th>
						<th>Vek</th>
						<th>Zamestnanie</th>
						<th>Poznámka</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(user, index) in users" :key="index" class="text-white">
						<td>
							<input v-model="user.meno" class="border bg-gray-700 w-full" />
						</td>
						<td>
							<input
								v-model="user.priezvisko"
								class="border bg-gray-700 w-full"
							/>
						</td>
						<td>
							<input v-model="user.cislo" class="border bg-gray-700 w-full" />
						</td>
						<td>
							<input v-model="user.email" class="border bg-gray-700 w-full" />
						</td>
						<td>
							<input
								v-model="user.odporucitel"
								class="border bg-gray-700 w-full"
							/>
						</td>
						<td>
							<input v-model="user.adresa" class="border bg-gray-700 w-full" />
						</td>
						<td>
							<input v-model="user.vek" class="border bg-gray-700 w-full" />
						</td>
						<td>
							<input
								v-model="user.zamestanie"
								class="border bg-gray-700 w-full"
							/>
						</td>
						<td>
							<input
								v-model="user.poznamka"
								class="border bg-gray-700 min-w-[350px]"
							/>
						</td>
					</tr>
				</tbody>
			</table>

			<!-- Fixed Container for Buttons -->
			<div class="flex justify-between mt-4">
				<button
					@click="addPeople"
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
				>
					Pridať používateľov
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
input {
	padding: 0.5rem;
	border-radius: 4px;
	border: 1px solid #4b5563;
}
</style>
