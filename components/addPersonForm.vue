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
		isNew: true,
		isContact: true,
		isCoWorker: false,
	},
]);

const peopleFromResposne = ref([]);

const odporucitelInput = ref("");

const emit = defineEmits(["cancelAdd", "addPeople"]);

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
			isNew: true,
			isContact: true,
			isCoWorker: false,
		});
	}
}

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
			isNew: true,
			isContact: true,
			isCoWorker: false,
		},
	];
}

function formatDate(dateString) {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return dateString;
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	return `${day}.${month}.${year}`;
}

function cancelAdd() {
	resetForm();
	emit("cancelAdd");
}

function saveToCookies() {
	Cookies.set("users", JSON.stringify(users.value));
}

watch(users, saveToCookies, { deep: true });

watch(odporucitelInput, (newVal) => {
	users.value.forEach((user) => {
		user.odporucitel = newVal;
	});
});

const duplicates = ref([]);

const addPeople = async () => {
	contactsStore.loadingState = true;

	const people = users.value.filter(
		(person) => person.meno && person.priezvisko && person.odporucitel,
	);

	for (let user of users.value) {
		if (!user.meno || !user.priezvisko || !user.odporucitel) {
			alert(
				"Meno, priezvisko a odporúčiteľ sú povinné pre každý riadok. Prosím, vyplňte ich.",
			);
			contactsStore.loadingState = false;
			return;
		}
		if (user.vek && isNaN(Number(user.vek))) {
			alert(
				`Vek musí byť číslo. Skontrolujte riadok s menom ${user.meno || "bez mena"}.`,
			);
			contactsStore.loadingState = false;
			return;
		}
		if (user.cislo && isNaN(Number(user.cislo))) {
			alert(
				`Číslo musí byť platné číslo. Skontrolujte riadok s menom ${user.meno || "bez mena"}.`,
			);
			contactsStore.loadingState = false;
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (user.email && !emailRegex.test(user.email)) {
			alert(`Email "${user.email}" nemá platný formát. Skontrolujte prosím.`);
			contactsStore.loadingState = false;
			return;
		}
	}

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
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
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
						},
					);
				}

				peopleFromResposne.value.push(response.data.contact);
			} catch (error) {
				if (error.response && error.response.status === 409) {
					toast.error(
						`${person.meno} ${person.priezvisko} wasn't added - ${error.response.data.message}` +
							(error.response.data.existing_contact.last_activity
								? ` (last activity: ${formatDate(error.response.data.existing_contact.last_activity)})`
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
						},
					);
					duplicates.value.push({
						attempted: person,
						existing: error.response.data.existing_contact,
						message: error.response.data.message,
					});
					continue;
				} else {
					throw error;
				}
			}
		}

		Cookies.remove("users");

		if (duplicates.value.length === 0) {
			emit("addPeople", peopleFromResposne.value);
			resetForm();
		}
	} catch (error) {
		console.error("Error adding people:", error);
		alert("An error occurred while adding contacts. Please try again.");
	}
	contactsStore.loadingState = false;
};

function removeRow(index) {
	if (users.value.length > 1) {
		users.value.splice(index, 1);
	}
}

function toggleType(user, type) {
	if (type === "contact") {
		user.isContact = true;
		user.isCoWorker = false;
	} else if (type === "coworker") {
		user.isContact = false;
		user.isCoWorker = true;
	}
}
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-40"
	>
		<div
			class="bg-gray-100 p-4 min-w-[1024px] rounded-lg shadow-lg h-[650px] mx-8 ml-[100px] flex flex-col"
		>
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex justify-center items-center gap-4">
					<h3>Odporučiteľ:</h3>
					<input class="bg-gray-200" v-model="odporucitelInput" />
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
				class="bg-green-500 text-white px-4 py-2 mb-4 rounded hover:bg-green-400 self-start"
			>
				Pridať riadok
			</button>

			<!-- Scrollable table area -->
			<div class="overflow-auto flex-1">
				<table class="min-w-full table-auto text-sm">
					<thead class="sticky top-0 bg-gray-100 z-10">
						<tr>
							<th class="px-2 py-1">Nový</th>
							<th class="px-2 py-1" colspan="2">Typ</th>
							<th class="px-2 py-1">Meno</th>
							<th class="px-2 py-1">Priezvisko</th>
							<th class="px-2 py-1">Číslo</th>
							<th class="px-2 py-1">Email</th>
							<th class="px-2 py-1">Odporúčiteľ</th>
							<th class="px-2 py-1">Adresa</th>
							<th class="px-2 py-1">Vek</th>
							<th class="px-2 py-1"></th>
						</tr>
					</thead>
					<tbody>
						<template v-for="(user, index) in users" :key="index">
							<!-- Main row -->
							<tr class="text-white border-t border-gray-300">
								<!-- Nový kontakt checkbox -->
								<td class="px-2 py-2 text-center align-middle">
									<label class="custom-check">
										<input type="checkbox" v-model="user.isNew" />
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
								</td>

								<!-- Klient / Spolupracovník toggle -->
								<td colspan="2" class="px-2 py-2 align-middle">
									<div class="type-toggle">
										<button
											:class="[
												'toggle-btn',
												user.isContact ? 'active-contact' : '',
											]"
											@click="toggleType(user, 'contact')"
										>
											Klient
										</button>
										<button
											:class="[
												'toggle-btn',
												user.isCoWorker ? 'active-coworker' : '',
											]"
											@click="toggleType(user, 'coworker')"
										>
											Spol.
										</button>
									</div>
								</td>

								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.meno"
										class="bg-gray-200 w-full shadow-sm"
									/>
								</td>
								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.priezvisko"
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.cislo"
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.email"
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.odporucitel"
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.adresa"
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td class="px-2 py-2 align-middle">
									<input
										v-model="user.vek"
										class="bg-gray-200 w-full shadow-sm"
									/>
								</td>

								<!-- Remove button -->
								<td class="px-2 py-2 text-center align-middle">
									<Icon
										icon="fa6-solid:xmark"
										@click="removeRow(index)"
										class="cursor-pointer text-xl text-gray-600 hover:text-red-500 transition-colors"
									/>
								</td>
							</tr>

							<!-- Second row: Zamestnanie + Poznámka -->
							<tr class="bg-gray-50">
								<!-- empty cells to align under main row columns -->
								<td colspan="3" class="px-2 pb-2"></td>
								<td colspan="3" class="px-2 pb-2">
									<label class="block text-xs text-gray-500 mb-0.5"
										>Zamestnanie</label
									>
									<input
										v-model="user.zamestanie"
										placeholder="Zamestnanie"
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td colspan="4" class="px-2 pb-2">
									<label class="block text-xs text-gray-500 mb-0.5"
										>Poznámka</label
									>
									<input
										v-model="user.poznamka"
										placeholder="Poznámka..."
										class="bg-gray-200 shadow-sm w-full"
									/>
								</td>
								<td class="px-2 pb-2"></td>
							</tr>
						</template>
					</tbody>
				</table>
			</div>

			<!-- Footer buttons -->
			<div class="flex justify-between mt-4 pt-2 border-t border-gray-200">
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
}

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
	border: 1.5px solid #4b5563;
	background: #374151;
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
	border-color: #60a5fa;
}

.type-toggle {
	display: inline-flex;
	gap: 4px;
	background: #374151;
	border-radius: 8px;
	padding: 3px;
}
.toggle-btn {
	font-size: 11px;
	font-weight: 500;
	padding: 3px 9px;
	border-radius: 5px;
	cursor: pointer;
	color: #9ca3af;
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
