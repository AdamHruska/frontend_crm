<script setup>
const config = useRuntimeConfig();

import axios from "axios";
import { format } from "date-fns";

import { useRoute } from "vue-router";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

const { id } = useRoute().params;
const people = ref([]); // Initialize as an array
const AddActivityBool = ref(false);

const activities = ref([]);

const changeAddActivityBool = () => {
	AddActivityBool.value = !AddActivityBool.value;
};

onBeforeMount(async () => {
	await findPerson(id);
	await findActivities(id);
	console.log("Aktiovity:", activities.value);
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		if (response.data && response.data.contact) {
			people.value = [response.data.contact]; // Wrap the contact in an array
			console.log(people.value);
		}
	} catch (error) {
		console.error("Error fetching contact:", error);
	}
};

const findActivities = async (id) => {
	const response = await axios.get(
		`${config.public.apiUrl}contacts/${id}/activities`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	activities.value = response.data.activities;
	console.log("Activities test:", activities.value);
};
const actityFormBool = ref(false);
const alterActivity = (id) => {
	actityFormBool.value = !actityFormBool.value;
	console.log("alterActivity", actityFormBool.value);
};

const addActivityToList = (activity) => {
	console.log("Activity added to list:", activity);
	activities.value.push(activity);
};

const columns = [
	{ key: "meno", label: "Meno", class: "dark:bg-slate-900" },
	{ key: "priezvisko", label: "Priezvisko", class: "dark:bg-slate-900" },
	{ key: "poradca", label: "Poradca", class: "dark:bg-slate-900" },
	{ key: "cislo", label: "tel. číslo", class: "dark:bg-slate-900" },
	{ key: "email", label: "Email", class: "dark:bg-slate-900" },
	{ key: "odporucitel", label: "Odporucitel", class: "dark:bg-slate-900" },
	{
		key: "created_at",
		label: "Dátum pridania",
		class: "dark:bg-slate-900",
	},
	{ key: "adresa", label: "Adresa", class: "dark:bg-slate-900" },
	{ key: "rok_narodenia", label: "Vek", class: "dark:bg-slate-900" },
	{ key: "zamestanie", label: "Zamestnanie", class: "dark:bg-slate-900" },
	// { key: "poznamka", label: "Poznámka" },
	{
		key: "Investicny_dotaznik",
		label: "Investicny dotazník vyplenený",
		class: "dark:bg-slate-900",
	},
	{ key: "actions", class: "dark:bg-slate-900" },
];

const items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => console.log("edit", row.id),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () =>
				axios
					.delete(`${config.public.apiUrl}delete_contacts/${row.id}`)
					.then(navigateTo("/")),
		},
	],
];

const columns_activity = ref([
	{
		key: "aktivita",
		label: "Aktivita",
		class: "dark:bg-slate-900",
	},
	{ key: "datumCas", label: "Začiatok", class: "dark:bg-slate-900" },
	{ key: "koniec", label: "Koniec", class: "dark:bg-slate-900" },
	{ key: "poznamka", label: "Poznámka k aktivite", class: "dark:bg-slate-900" },

	{ key: "volane", label: "Volané", class: "dark:bg-slate-900 w-[50px]" },
	{
		key: "dovolane",
		label: "Dovolané",
		class: "dark:bg-slate-900 w-[50px]",
	},
	{
		key: "dohodnute",
		label: "Dohodnuté",
		class: "dark:bg-slate-900 w-[50px]",
	},
	{ key: "created_at", label: "Vytvorené", class: "dark:bg-slate-900" },
	{
		key: "miesto_stretnutia",
		label: "Miesto stretnutia",
		class: "dark:bg-slate-900",
	},
	{ key: "actions", class: "dark:bg-slate-900" },
]);

const activity_items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => alterActivity(row.id),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () =>
				axios
					.delete(`${config.public.apiUrl}delete-activities/${row.id}`, {
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					})
					.then(() => {
						activities.value = activities.value.filter(
							(activity) => activity.id !== row.id
						);
					}),
		},
	],
];

// Example data for the table
// const items_activity = ref([
// 	{
// 		aktivita: "Telefonát",
// 		datumCas: "2024-08-19 10:30",
// 		poznamka: "Volal klientovi",
// 		aktivitaZadana: "Manager",
// 		volane: 3,
// 		dovolane: 2,
// 		dohodnute: 1,
// 	},
// 	{
// 		aktivita: "Email",
// 		datumCas: "2024-08-19 11:00",
// 		poznamka: "Poslal ponuku",
// 		aktivitaZadana: "Asistent",
// 		volane: 0,
// 		dovolane: 0,
// 		dohodnute: 0,
// 	},
// ]);

const handleActivityRowClick = (row) => {
	console.log("Activity row clicked:", row);
};

const formatDate = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy");
};

const formatDateTime = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy HH:mm");
};

function calculateAge(yearOfBirth) {
	const currentYear = new Date().getFullYear();
	const age = currentYear - yearOfBirth;
	return age;
}
</script>

<template>
	<!-- Contact Detail Section -->
	<UTable :rows="people" :columns="columns" class="mx-10 table-container mt-10">
		<template #name-data="{ row }" @click="test">
			<span
				:class="[
					selected.find((person) => person.id === row.id) &&
						'text-primary-500 dark:text-primary-400',
				]"
				>{{ row.name }}</span
			>
		</template>

		<template #created_at-data="{ row }">
			<span>{{ formatDate(row.created_at) }}</span>
		</template>

		<template #rok_narodenia-data="{ row }">
			<span>{{ calculateAge(row.rok_narodenia) }}</span>
		</template>

		<template #actions-data="{ row }">
			<UDropdown :items="items(row)">
				<UButton
					color="gray"
					variant="ghost"
					icon="i-heroicons-ellipsis-horizontal-20-solid"
				/>
			</UDropdown>
		</template>
	</UTable>

	<!-- Poznamka Section -->
	<div class="ml-10 mt-4 max-w-[450px]">
		<!-- Wrapper for consistent width and background color -->
		<div class="bg-slate-900 text-white text-xl font-semibold p-2">
			Poznamka
		</div>
		<div
			class="border border-x-0 border-b-0 break-words p-2 border-slate-600 mt-"
		>
			{{ people[0]?.poznamka || "No data available" }} Lorem ipsum dolor, sit
			amet consectetur adipisicing elit. Quidem veniam, voluptates aliquam
			dignissimos vitae porro necessitatibus enim, fugit, explicabo dicta
		</div>
	</div>
	<hr class="border-color mx-10" />
	<!-- Activity Section -->

	<div class="relative">
		<div class="mt-[60px] mx-8 w-[1800px]">
			<h1 class="text-white text-2xl text-center mb-6">Aktivity</h1>
			<UTable :rows="activities" :columns="columns_activity">
				<template #default="{ row }">
					<tr
						@click="handleActivityRowClick(row)"
						class="cursor-pointer hover:bg-gray-100"
					>
						<td v-for="col in columns_activity" :key="col.key">
							{{ row[col.key] }}
						</td>
					</tr>
				</template>

				<template #created_at-data="{ row }">
					<span>{{ formatDateTime(row.created_at) }}</span>
				</template>

				<template #actions-data="{ row }">
					<UDropdown :items="activity_items(row)">
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-ellipsis-horizontal-20-solid"
						/>
					</UDropdown>
				</template>
			</UTable>
		</div>
		<button
			@click="changeAddActivityBool"
			class="bg-blue-700 hover:bg-blue-800 p-2 rounded-lg absolute right-10 top-14 font-semibold"
		>
			Pridať udalosť
		</button>
	</div>
	<!-- Add Activity Form -->

	<AddActivityForm
		:contact_id="id"
		v-if="AddActivityBool"
		@cancelAddActivity="changeAddActivityBool"
		@activityAdded="addActivityToList"
	/>

	<!-- Alter Activity Form -->
	<AlterActivityForm
		v-if="actityFormBool"
		@cancelAlterActivity="alterActivity"
	/>
</template>

<style scoped>
.border-color {
	border-color: #475569;
}
</style>
