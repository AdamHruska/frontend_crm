<script setup>
const config = useRuntimeConfig();

import { Icon } from "@iconify/vue";
import axios from "axios";
import { format } from "date-fns";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();
const token = ref("");

const next_page_url = ref("");
const prev_page_url = ref("");
const page = ref(1);

const router = useRouter();

const single_contact = ref({});

const showAddPersonForm = ref(false);
const showAlterPesonForm = ref(false);
const people = ref([]);

const isChecked = ref(false);
const selected = ref([]);

const toggleCheckbox = (id) => {
	const person = people.value.find((p) => p.id === id);
	if (person) {
		const index = selected.value.findIndex((p) => p.id === id);
		if (index === -1) {
			selected.value.push(person);
		} else {
			selected.value.splice(index, 1);
		}
	}
	console.log(selected.value);
};

function addPerson(addedPeople) {
	// If addedPeople is passed, handle the addition
	if (addedPeople) {
		if (addedPeople.length > 0) {
			// Push the added people to the people array
			people.value.push(...addedPeople);
			alert("Kontakt bol pridaný");
		}
	}

	// Toggle the form visibility
	showAddPersonForm.value = !showAddPersonForm.value;
}

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
	console.log(showAlterPesonForm.value);
}

const findPerson = async (id) => {
	const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
		headers: {
			Authorization: `Bearer ${sessionStorage.getItem("token")}`,
		},
	});
	single_contact.value = response.data.contact;
	alterPerson();
};

const deletePerson = async (id) => {
	const response = await axios.delete(
		`${config.public.apiUrl}delete-delete-contact/${id}`,
		{
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
			},
		}
	);
	console.log(response);
};

token.value = sessionStorage.getItem("token");

onMounted(async () => {
	console.log("token", token);
	const response = await axios.get(`${config.public.apiUrl}contacts`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	page.value = response.data.contacts.current_page;

	people.value = response.data.contacts.data;
	next_page_url.value = response.data.contacts.next_page_url;
	//console.log(people.value);
	//console.log(people.value[0].id);
});

const handleSearchResults = (results) => {
	people.value = results; // Update `people` with search results
};

const detailView = (id) => {
	router.push(`/contact/${id}`);
};

const columns = [
	{
		key: "meno",
		label: "Meno",
	},
	{
		key: "priezvisko",
		label: "Priezvisko",
	},
	// {
	// 	key: "poradca",
	// 	label: "Poradca",
	// },

	{
		key: "cislo",
		label: "tel. číslo",
	},
	{
		key: "email",
		label: "Email",
	},
	{
		key: "odporucitel",
		label: "Odporucitel",
	},
	{
		key: "odporucitel",
		label: "Odporucitel",
	},
	// {
	// 	key: "created_at",
	// 	label: "Dátum pridania",
	// },
	// {
	// 	key: "adresa",
	// 	label: "Adresa",
	// },
	// {
	// 	key: "rok_narodenia",
	// 	label: "Vek",
	// },
	// {
	// 	key: "zamestanie",
	// 	label: "Zamestnanie",
	// },
	// {
	// 	key: "poznamka",
	// 	label: "Poznámka",
	// },
	// {
	// 	key: "Investicny_dotaznik",
	// 	label: "Investicny dotazník vyplenený",
	// },
	{
		key: "actions",
	},
	{
		key: "checkbox",
		label: "",
		type: "checkbox",
	},
];

const items = (row) => [
	[
		{
			label: "Detail",
			icon: "i-heroicons-eye-20-solid",
			click: () => detailView(row.id),
		},
	],
	[
		{
			label: "Show Contact Details",
			icon: "i-heroicons-information-circle-20-solid",
			click: () => {
				// Navigate to the contact details page
				router.push(`/contact/${row.id}`);
			},
		},
	],
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => findPerson(row.id),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () =>
				deletePerson(row.id).then(() => {
					people.value = people.value.filter((person) => person.id !== row.id);
				}),
		},
	],
];
const formatDate = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy");
};

function calculateAge(yearOfBirth) {
	const currentYear = new Date().getFullYear();
	const age = currentYear - yearOfBirth;
	return age;
}

const nextPage = async () => {
	const response = await axios.get(next_page_url.value, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	page.value = response.data.contacts.current_page;
	prev_page_url.value = response.data.contacts.prev_page_url;
	people.value = response.data.contacts.data;
	next_page_url.value = response.data.contacts.next_page_url;
};

const prevPage = async () => {
	const response = await axios.get(prev_page_url.value, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	page.value = response.data.contacts.current_page;
	prev_page_url.value = response.data.contacts.prev_page_url;
	people.value = response.data.contacts.data;
	next_page_url.value = response.data.contacts.next_page_url;
};

function updatePerson(updatedContact) {
	// Find the index of the person in the people array
	const index = people.value.findIndex(
		(person) => person.id === updatedContact.id
	);
	if (index !== -1) {
		// Update the contact information in the array
		people.value[index] = updatedContact;
	}
	showAlterPesonForm.value = false; // Close the form
}
</script>

<template>
	<div class="flex justify-between">
		<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
			<searchBar @updateResults="handleSearchResults" />
		</div>

		<button
			@click="addPerson()"
			class="bg-blue-600 rounded-lg hover:bg-blue-300 hover:text-black h-14 w-14 flex justify-center pt-3 mr-8 mt-8"
		>
			<Icon icon="fa6-solid:plus" style="font-size: 30px" class="" />
		</button>
	</div>

	<!-- <div class="max-w-lg ml-8 mt-8">
		<search2 />
	</div> -->
	<UTable :rows="people" :columns="columns" class="mx-6 table-container">
		<template #name-data="{ row }">
			<div class="test">
				<span
					:class="[
						selected.find((person) => person.id === row.id) &&
							'text-primary-500 dark:text-primary-400',
					]"
					>{{ row.name }}</span
				>
			</div>
		</template>

		<template #actions-data="{ row }">
			<div class="flex justify-between">
				<div class="flex space-x-4">
					<UButton
						@click="detailView(row.id)"
						class="bg-blue-500 text-white"
						label="Show Details"
					/>
					<UButton
						@click="findPerson(row.id)"
						icon="i-heroicons-pencil-square-20-solid"
						color="gray"
						variant="ghost"
					/>
					<UButton
						@click="
							deletePerson(row.id).then(() => {
								people.value = people.value.filter(
									(person) => person.id !== row.id
								);
							})
						"
						icon="i-heroicons-trash-20-solid"
						color="red"
						variant="ghost"
					/>
				</div>
				<input type="checkbox" @change="toggleCheckbox(row.id)" />
			</div>
		</template>
	</UTable>

	<!-- <pagination /> -->
	<div
		class="flex gap-[40px] justify-center mt-[30px] mb-[50px]"
		v-if="people.length > 9 || page > 1"
	>
		<div class="cursor-pointer" @click="prevPage()">
			<Icon
				class="hover:size-[38px]"
				icon="fa6-solid:circle-arrow-left"
				style="font-size: 35px; color: #0074b7"
			/>
		</div>
		<div class="font-semibold text-xl">{{ page }}</div>
		<div class="cursor-pointer" @click="nextPage()">
			<Icon
				class="hover:size-[38px]"
				icon="fa6-solid:circle-arrow-right"
				style="font-size: 35px; color: #0074b7"
			/>
		</div>
	</div>
	<AddPersonForm
		v-if="showAddPersonForm"
		@cancelAdd="addPerson()"
		@addPeople="addPerson"
	/>
	<AlterPersonForm
		v-if="showAlterPesonForm"
		@cancelAlter="alterPerson()"
		@alterPerson="updatePerson"
		:single_contact="single_contact"
	/>
</template>

<style scoped>
.table-container {
	overflow-x: auto;
}
</style>
