<script setup>
import { Icon } from "@iconify/vue";
import axios from "axios";
const router = useRouter();

const single_contact = ref({});

const showAddPersonForm = ref(false);
const showAlterPesonForm = ref(false);
const people = ref([]);

function addPerson() {
	showAddPersonForm.value = !showAddPersonForm.value;
	console.log("addPerson");
}

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
	console.log(showAlterPesonForm.value);
}

const findPerson = async (id) => {
	const response = await axios.get(`http://127.0.0.1:8000/contact/${id}`);
	single_contact.value = response.data.contact;
	alterPerson();
};

onMounted(async () => {
	const response = await axios.get("http://127.0.0.1:8000/contacts");
	people.value = response.data.contacts;
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
	{
		key: "poradca",
		label: "Poradca",
	},

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
		key: "datum_pridania",
		label: "Dátum pridania",
	},
	{
		key: "adresa",
		label: "Adresa",
	},
	{
		key: "vek",
		label: "Vek(rok narodenia)",
	},
	{
		key: "zamestanie",
		label: "Zamestnanie",
	},
	{
		key: "poznamka",
		label: "Poznámka",
	},
	{
		key: "Investicny_dotaznik",
		label: "Investicny dotazník vyplenený",
	},
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
			click: () => findPerson(console.log("edit", row.id)),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () =>
				axios.delete(`http://127.0.0.1:8000/delete_contacts/${row.id}`),
		},
	],
];
</script>

<template>
	<div class="max-w-sm ml-8 mt-8 mb-2">
		<searchBar @updateResults="handleSearchResults" />
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

	<pagination />
	<button
		@click="addPerson()"
		class="float-right mr-12 mt-3 align-center py-3 px-6 bg-blue-600 rounded-lg hover:bg-blue-300 hover:text-black"
	>
		<Icon icon="fa6-solid:plus" style="font-size: 30px" />
	</button>
	<AddPersonForm
		v-if="showAddPersonForm"
		@cancelAdd="addPerson()"
		@addPerson="addPerson()"
	/>
	<AlterPersonForm
		v-if="showAlterPesonForm"
		@cancelAlter="alterPerson()"
		@alterPerson="alterPerson()"
		:single_contact="single_contact"
	/>
</template>

<style scoped>
.table-container {
	overflow-x: auto;
}
</style>
