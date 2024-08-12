<script setup>
import { Icon } from "@iconify/vue";

const showAddPersonForm = ref(false);

function addPerson() {
	showAddPersonForm.value = !showAddPersonForm.value;
}

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

const people = [
	{
		id: 69,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
	{
		id: 1,
		meno: "Lindsay WaltonLindsay ",
		priezvisko: "Front-end Developer",
		poradca: "lindsay.walton@example.com",
		cislo: "Member",
		email: "ahruska4517646@gmail.com",
		odporucitel: "adam",
		datum_pridania: "2021-10-10",
		adresa: "Bratislava",
		vek: "1999",
		zamestanie: "student",
		poznamka: "poznamka",
		Investicny_dotaznik: "08.10.2021",
	},
];

const items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => console.log("Edit", row.id),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () => console.log("Delete", row.id),
		},
	],
];

const selected = ref([people[0]]);
</script>

<template>
	<div class="max-w-sm ml-8 mt-8 mb-2">
		<searchBar />
	</div>

	<!-- <div class="max-w-lg ml-8 mt-8">
		<search2 />
	</div> -->
	<UTable :rows="people" :columns="columns" class="mx-6 table-container">
		<template #name-data="{ row }">
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
</template>

<style>
.table-container {
	overflow-x: auto;
}
</style>
