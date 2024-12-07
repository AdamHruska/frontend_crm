<script setup>
const config = useRuntimeConfig();

import axios from "axios";
import { format } from "date-fns";

import { useRoute } from "vue-router";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

const { id } = useRoute().params;
const people = ref([]);
const AddActivityBool = ref(false);

const activities = ref([]);

const author_id = ref(null);
const user_id = ref(null);

const changeAddActivityBool = () => {
	AddActivityBool.value = !AddActivityBool.value;
};

onBeforeMount(async () => {
	await findPerson(id);
	await findActivities(id);
	const user = await getUser();
	user_id.value = user.id;
	console.log("User ID:", user_id.value);
	console.log("Contact uthor ID:", author_id.value);
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		if (response.data && response.data.contact) {
			people.value = [response.data.contact];
			console.log(people.value);
		}
		author_id.value = response.data.contact.author_id;
		console.log("Author ID:", author_id.value);
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

const getUser = async (id) => {
	const response = await axios.get(`${config.public.apiUrl}get-user`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	return response.data.user;
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

// const columns = [
// 	{ key: "meno", label: "Meno", class: "bg-gray-200" },
// 	{ key: "priezvisko", label: "Priezvisko", class: "bg-gray-200" },
// 	{ key: "cislo", label: "tel. číslo", class: "bg-gray-200" },
// 	{ key: "email", label: "Email", class: "bg-gray-200" },
// 	{ key: "odporucitel", label: "Odporucitel", class: "bg-gray-200" },
// 	{
// 		key: "created_at",
// 		label: "Dátum pridania",
// 		class: "bg-gray-200",
// 	},
// 	{ key: "adresa", label: "Adresa", class: "bg-gray-200" },
// 	{ key: "rok_narodenia", label: "Vek", class: "bg-gray-200" },
// 	{ key: "zamestanie", label: "Zamestnanie", class: "bg-gray-200" },
// 	// {
// 	// 	key: "Investicny_dotaznik",
// 	// 	label: "Investicny dotazník vyplenený",
// 	// 	class: "bg-gray-200",
// 	// },
// 	{ key: "actions", class: "bg-gray-200" },
// ];

const columns_first_row = [
	{ key: "meno", label: "Meno", class: "bg-gray-200" },
	{ key: "priezvisko", label: "Priezvisko", class: "bg-gray-200" },
	{ key: "cislo", label: "tel. číslo", class: "bg-gray-200" },
	{ key: "email", label: "Email", class: "bg-gray-200" },
	{ key: "odporucitel", label: "Odporucitel", class: "bg-gray-200" },
];

const columns_second_row = [
	{
		key: "created_at",
		label: "Dátum pridania",
		class: "bg-gray-200",
	},
	{ key: "adresa", label: "Adresa", class: "bg-gray-200" },
	{ key: "rok_narodenia", label: "Vek", class: "bg-gray-200" },
	{ key: "zamestanie", label: "Zamestnanie", class: "bg-gray-200" },
	{ key: "actions", class: "bg-gray-200" },
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
		class: "bg-gray-200",
	},
	{ key: "datumCas", label: "Začiatok", class: "bg-gray-200 w-28" },
	{ key: "koniec", label: "Koniec", class: "bg-gray-200 w-28" },
	{ key: "poznamka", label: "Poznámka k aktivite", class: "bg-gray-200" },
	{ key: "volane", label: "Volané", class: "bg-gray-200 w-20" },
	{
		key: "dovolane",
		label: "Dovolané",
		class: "bg-gray-200 w-20",
	},
	{
		key: "dohodnute",
		label: "Dohodnuté",
		class: "bg-gray-200 w-20",
	},
	{ key: "created_at", label: "Vytvorené", class: "bg-gray-200 w-28" },
	{
		key: "miesto_stretnutia",
		label: "Miesto stretnutia",
		class: "bg-gray-200",
	},
	{ key: "actions", class: "bg-gray-200" },
]);

const columnsActivityFirstRow = ref([
	{ key: "aktivita", label: "Aktivita", class: "bg-gray-200 w-40" },
	{ key: "datumCas", label: "Začiatok", class: "bg-gray-200 w-32" },
	{ key: "koniec", label: "Koniec", class: "bg-gray-200 w-32" },
	{ key: "poznamka", label: "Poznámka", class: "bg-gray-200 w-40" },
	{ key: "volane", label: "Volané", class: "bg-gray-200 w-32" },
]);

const columnsActivitySecondRow = ref([
	{ key: "dovolane", label: "Dovolané", class: "bg-gray-200 w-32" },
	{ key: "dohodnute", label: "Dohodnuté", class: "bg-gray-200 w-32" },
	{ key: "created_at", label: "Vytvorené", class: "bg-gray-200 w-40" },
	{
		key: "miesto_stretnutia",
		label: "Miesto stretnutia",
		class: "bg-gray-200 w-40",
	},
	{ key: "actions", class: "bg-gray-200 w-20" },
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
	<h1 class="text-2xl font-semibold ml-10 mt-4">Detail</h1>
	<UTable
		:rows="people"
		:columns="columns_first_row"
		class="mx-10 table-container mt-10 shadow-md z-0 w-5/6"
	>
		<template #name-data="{ row }" @click="test">
			<span
				:class="[
					selected.find((person) => person.id === row.id) &&
						'text-primary-500 dark:text-primary-400 bg-white',
				]"
				class="truncate"
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
			<UDropdown
				:items="items(row)"
				theme="light"
				class="bg-white border border-gray-300 rounded-md shadow-lg udropdown"
			>
				<UButton
					color="white"
					variant="ghost"
					icon="i-heroicons-ellipsis-horizontal-20-solid"
				/>
			</UDropdown>
		</template>
	</UTable>

	<UTable
		:rows="people"
		:columns="columns_second_row"
		class="mx-10 table-container mt-10 shadow-md z-0 w-5/6"
	>
		<template #name-data="{ row }" @click="test">
			<span
				:class="[
					selected.find((person) => person.id === row.id) &&
						'text-primary-500 dark:text-primary-400 bg-white',
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
			<UDropdown
				:items="items(row)"
				theme="light"
				class="bg-white border border-gray-300 rounded-md shadow-lg udropdown"
			>
				<UButton
					color="white"
					variant="ghost"
					icon="i-heroicons-ellipsis-horizontal-20-solid"
				/>
			</UDropdown>
		</template>
	</UTable>

	<div class="ml-10 mt-4 max-w-[450px] shadow-md">
		<div class="bg-gray-200 text-black text-xl font-semibold p-2">Poznamka</div>
		<div class="border border-x-0 border-b-0 break-words p-2">
			{{ people[0]?.poznamka || "No data available" }}
		</div>
	</div>

	<div class="relative">
		<div class="mt-[60px] mx-8 shadow-md !text-black">
			<h1 class="text-black text-2xl text-center mb-6">Aktivity</h1>
			<UTable :rows="activities" :columns="columns_activity">
				<template #default="{ row }">
					<tr
						@click="handleActivityRowClick(row)"
						class="cursor-pointer hover:bg-gray-200 w-5/6 mb-2 !text-black"
					>
						<td v-for="col in columns_activity" :key="col.key">
							{{ row[col.key] }}
						</td>
					</tr>
				</template>

				<template #created_at-data="{ row }">
					<span>{{ formatDateTime(row.created_at) }}</span>
				</template>

				<template #actions-data="{ row }" v-if="author_id == user_id">
					<UDropdown :items="activity_items(row)" theme="light">
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-ellipsis-horizontal-20-solid"
						/>
					</UDropdown>
				</template>
			</UTable>

			<!-- <UTable :rows="activities" :columns="columnsActivitySecondRow">
				<template #default="{ row }">
					<tr
						@click="handleActivityRowClick(row)"
						class="cursor-pointer hover:bg-gray-200"
					>
						<td v-for="col in columns_activity" :key="col.key">
							{{ row[col.key] }}
						</td>
					</tr>
				</template>

				<template #created_at-data="{ row }">
					<span>{{ formatDateTime(row.created_at) }}</span>
				</template>

				<template #actions-data="{ row }" v-if="author_id == user_id">
					<UDropdown :items="activity_items(row)" theme="light">
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-ellipsis-horizontal-20-solid"
						/>
					</UDropdown>
				</template>
			</UTable> -->
		</div>
		<button
			v-if="author_id == user_id"
			@click="changeAddActivityBool"
			class="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg absolute right-10 top-2 font-semibold shadow-md"
		>
			Pridať udalosť
		</button>
	</div>

	<AddActivityForm
		:contact_id="id"
		v-if="AddActivityBool"
		@cancelAddActivity="changeAddActivityBool"
		@activityAdded="addActivityToList"
	/>

	<AlterActivityForm
		v-if="actityFormBool"
		@cancelAlterActivity="alterActivity"
	/>
</template>

<style scoped>
:root {
	--background-color: #f0f0f0;
	--text-color: #000000;
}

body {
	background-color: var(--background-color);
	color: var(--text-color);
}

.udropdown {
	background-color: white !important;
	border: 1px solid #d1d5db; /* gray-300 */
	border-radius: 0.375rem; /* md rounding */
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* lg shadow */
}

.udropdown {
	background-color: white !important;
	border: 1px solid #d1d5db !important; /* gray-300 */
	border-radius: 0.375rem !important; /* rounded-md */
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important; /* lg shadow */
	color: black !important; /* Ensure text is visible */
}
</style>
