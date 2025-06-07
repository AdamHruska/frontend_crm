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
];
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
		class="mx-6 table-container shadow-md rounded-md"
		:row-class="(row) => row.class"
	>
		<template #actions-data="{ row }">
			<tr v-if="row.poznamka" class="absolute left-0 w-full">
				<td colspan="7" class="px-4 py-2 text-sm text-gray-600 bg-gray-50">
					<span class="font-semibold">Poznámka:</span>
					{{ row.poznamka }}
				</td>
			</tr>
		</template>
	</UTable>
</template>

<style scoped>
.table-container {
	overflow-x: none;
}
</style>
