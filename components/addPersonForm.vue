<script setup>
const config = useRuntimeConfig();
import { ref, watch } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";

import { useContactsStore } from "@/stores/contactsStore";
import { useToast } from "vue-toastification";
const toast = useToast();
const contactsStore = useContactsStore();

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

const peopleFromResposne = ref([]);

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

function formatDate(dateString) {
	if (!dateString) return "";

	const date = new Date(dateString);
	if (isNaN(date.getTime())) return dateString; // return original if invalid date

	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();

	return `${day}.${month}.${year}`;
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

const duplicates = ref([]);

const addPeople = async () => {
	contactsStore.loadingState = true;

	// Filter out users who have all required fields filled
	const people = users.value.filter(
		(person) => person.meno && person.priezvisko && person.odporucitel
	);

	// Validate fields
	for (let user of users.value) {
		// Check if required fields are missing
		if (!user.meno || !user.priezvisko || !user.odporucitel) {
			alert(
				"Meno, priezvisko a odporúčiteľ sú povinné pre každý riadok. Prosím, vyplňte ich."
			);
			contactsStore.loadingState = false;
			return;
		}

		// Check if vek is a valid number
		if (user.vek && isNaN(Number(user.vek))) {
			alert(
				`Vek musí byť číslo. Skontrolujte riadok s menom ${
					user.meno || "bez mena"
				}.`
			);
			contactsStore.loadingState = false;
			return;
		}

		// Check if cislo is a valid number
		if (user.cislo && isNaN(Number(user.cislo))) {
			alert(
				`Číslo musí byť platné číslo. Skontrolujte riadok s menom ${
					user.meno || "bez mena"
				}.`
			);
			contactsStore.loadingState = false;
			return;
		}

		// Check if email has a valid format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (user.email && !emailRegex.test(user.email)) {
			alert(`Email "${user.email}" nemá platný formát. Skontrolujte prosím.`);
			contactsStore.loadingState = false;
			return;
		}
	}

	// If there are no valid users, alert the user
	if (people.length === 0) {
		alert("Vyplňte povinné polia pre aspoň jeden riadok.");
		contactsStore.loadingState = false;
		return;
	}

	try {
		for (let person of people) {
			try {
				const response = await axios.post(
					`${config.public.apiUrl}post-create-contact`,
					person,
					{
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					}
				);

				if (response.data.message.includes("ako duplikát")) {
					toast.warning(
						`${person.meno} ${person.priezvisko} bol pridaný ako duplikát (existuje v inej databáze)`,
						{
							position: "top-center",
							timeout: 8000,
							closeOnClick: true,
							pauseOnHover: true,
							draggable: true,
							icon: "⚠️",
						}
					);
				}

				peopleFromResposne.value.push(response.data.contact);
				console.log("Person added:", response);
			} catch (error) {
				if (error.response && error.response.status === 409) {
					// Handle duplicate contact case
					console.warn("Duplicate contact found:", error.response.data.message);
					console.log(
						"Existing contact:",
						error.response.data.existing_contact
					);

					// You can display this to the user or add to a separate array
					// For example, you might want to show a notification:
					// alert(
					// 	`${person.meno} ${person.priezvisko} wasn't added - ${error.response.data.message}`
					// );

					toast.error(
						`${person.meno} ${person.priezvisko} wasn't added - ${error.response.data.message}` +
							(error.response.data.existing_contact.last_activity
								? ` (last activity: ${formatDate(
										error.response.data.existing_contact.last_activity
								  )})`
								: ""),
						{
							position: "top-center",
							timeout: 10000,
							closeOnClick: true,
							pauseOnHover: true,
							draggable: true,
							draggablePercent: 60,
							showCloseButtonOnHover: false,
							hideProgressBar: false,
						}
					);
					// Or store duplicates to show later
					duplicates.value.push({
						attempted: person,
						existing: error.response.data.existing_contact,
						message: error.response.data.message,
					});
					console.log("duplicates", duplicates.value[0].existing.last_activity);

					continue; // Skip to next person
				} else {
					// Re-throw other errors
					throw error;
				}
			}
		}

		Cookies.remove("users");

		if (duplicates.value.length > 0) {
			// Show toast or alert summary of skipped contacts
			// toast.warning(
			// 	`Bolo pridaných ${peopleFromResposne.value.length} kontaktov, ale ${duplicates.value.length} bolo preskočených kvôli duplicitám.`,
			// 	{
			// 		position: "top-center",
			// 		timeout: 5000,
			// 	}
			// );
			// Do NOT emit or reset the form — user can edit remaining fields
		} else {
			emit("addPeople", peopleFromResposne.value);
			resetForm();
		}
	} catch (error) {
		console.error("Error adding people:", error);
		// Handle other errors (network issues, server errors, etc.)
		alert("An error occurred while adding contacts. Please try again.");
	}
	contactsStore.loadingState = false;
};

function removeRow(index) {
	if (users.value.length > 1) {
		users.value.splice(index, 1);
	}
}
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-40"
	>
		<div
			class="bg-gray-100 p-4 min-w-[1024px] rounded-lg shadow-lg h-[650px] mx-8 ml-[100px]"
		>
			<div class="flex items-center justify-between mb-4">
				<div class="flex justify-center items-center gap-4">
					<h3>Odporučiteľ:</h3>
					<input class="bg-gray-200" v-model="odporucitelInput" />
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
					<tr class="">
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
							<input v-model="user.meno" class="bg-gray-200 w-full shadow-sm" />
						</td>
						<td>
							<input
								v-model="user.priezvisko"
								class="bg-gray-200 shadow-sm w-full"
							/>
						</td>
						<td>
							<input
								v-model="user.cislo"
								class="bg-gray-200 shadow-sm w-full"
							/>
						</td>
						<td>
							<input
								v-model="user.email"
								class="bg-gray-200 shadow-sm w-full"
							/>
						</td>
						<td>
							<input
								v-model="user.odporucitel"
								class="bg-gray-200 shadow-sm w-full"
							/>
						</td>
						<td>
							<input
								v-model="user.adresa"
								class="bg-gray-200 shadow-sm w-full"
							/>
						</td>
						<td>
							<input v-model="user.vek" class="bg-gray-200 w-full shadow-sm" />
						</td>
						<td>
							<input
								v-model="user.zamestanie"
								class="bg-gray-200 shadow-sm w-full"
							/>
						</td>
						<td>
							<input
								v-model="user.poznamka"
								class="bg-gray-200 min-w-[350px] shadow-sm"
							/>
						</td>
						<td class="text-center">
							<Icon
								icon="fa6-solid:xmark"
								@click="removeRow(index)"
								class="cursor-pointer text-2xl"
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
	/* border: 1px solid #4b5563; */
}
</style>
