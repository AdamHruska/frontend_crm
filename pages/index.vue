<script setup>
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

function addPerson(newContact) {
	showAddPersonForm.value = !showAddPersonForm.value;

	// If newContact is provided, add it to the people array or handle it as needed
	if (newContact) {
		people.value.push(newContact);
		console.log("New contact added:", newContact);
		location.reload();
	}

	console.log("addPerson method triggered in parent");
}

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
	console.log(showAlterPesonForm.value);
}

const findPerson = async (id) => {
	const response = await axios.get(`http://localhost:8000/api/contact/${id}`, {
		headers: {
			Authorization: `Bearer ${sessionStorage.getItem("token")}`,
		},
	});
	single_contact.value = response.data.contact;
	alterPerson();
};

const deletePerson = async (id) => {
	const response = await axios.delete(
		`http://localhost:8000/api/delete-delete-contact/${id}`,
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
	const response = await axios.get("http://localhost:8000/api/contacts", {
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
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			// click: () => findPerson(console.log(row.id, row.id)),
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
