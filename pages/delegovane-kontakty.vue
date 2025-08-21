<script setup>
const config = useRuntimeConfig();

import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();
import { useUserStore } from "@/stores/userStore";

import { Icon } from "@iconify/vue";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();
const token = ref("");

const router = useRouter();

const people = ref([]);

// funcion to toggle call list creation

token.value = sessionStorage.getItem("token");

onMounted(async () => {
	try {
		// Fetch the contacts from the API
		if (contactsStore.delegatedContacts.length === 0) {
			await contactsStore.fetchDelegatedContacts();
		}

		people.value = contactsStore.delegatedContacts.map((person) => {
			let cssClass = "";

			return {
				...person,
				class: cssClass.trim(),
			};
		});

		console.log("delegated contacts value", people.value);
	} catch (error) {
		console.error("Error:", error);
	}
});

const handleSearchResults = (results) => {
	people.value = results; // Update `people` with search results
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
		key: "poznamka",
		label: "Poznámka",
	},
	{
		key: "actions",
		label: "Akcie",
	},
];

const detailView = (id) => {
	router.push(`/contact/${id}`);
};
</script>

<template>
	<div class="">
		<loadigcomponent v-if="contactsStore.loadingState" />
		<h1 class="text-center text-2xl" style="margin-block: 25px">
			Delegované kontaky
		</h1>
	</div>

	<UTable
		:rows="people"
		:columns="columns"
		class="mx-6 table-container shadow-md rounded-md pb-[70px]"
		:row-class="(row) => row.class"
	>
		<template #actions-data="{ row }">
			<div class="flex justify-between">
				<div class="flex space-x-4">
					<UButton
						@click="detailView(row.id)"
						class="bg-blue-500 text-white shadow-xl"
						label="Show Details"
					/>
				</div>
			</div>
		</template>

		<template #poznamka-data="{ row }">
			<div v-if="row.poznamka" class="group relative">
				<div class="truncate max-w-[200px]">
					{{ row.poznamka }}
				</div>
				<div
					class="absolute hidden group-hover:block z-10001 w-[300px] p-2 bg-white border border-gray-200 rounded shadow-lg"
				>
					<div class="text-sm text-gray-700 whitespace-normal">
						{{ row.poznamka }}
					</div>
				</div>
			</div>
		</template>
	</UTable>
</template>

<style scoped>
.table-container {
	overflow-x: none;
}
</style>
