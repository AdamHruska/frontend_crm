<script setup>
const config = useRuntimeConfig();

import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();

import { Icon } from "@iconify/vue";
import axios from "axios";
import { format } from "date-fns";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();
const token = ref("");

const page = ref(1);

const router = useRouter();

const single_contact = ref({});

const showAddPersonForm = ref(false);
const showAlterPesonForm = ref(false);
const people = ref([]);

const isChecked = ref(false);
const selected = ref([]);

// funcion to toggle call list creation
const callList = ref(false);
const callListName = ref("");
const user_id = ref("");

const callListNames = ref([]);

const toggleCallList = async () => {
	if (selected.value.length > 0) {
		cancleCallListForm(); // Show the form
	}
};

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
	console.log("Selected", selected.value);
};

// function addPerson(addedPeople) {
// 	showAddPersonForm.value = !showAddPersonForm.value;
// 	// If addedPeople is passed, handle the addition
// 	// if (addedPeople) {
// 	// 	if (addedPeople.length > 0) {
// 	// 		// Push the added people to the people array
// 	// 		people.value.unshift(...addedPeople);
// 	// 		alert("Kontakt bol pridaný");
// 	// 	}
// 	// }
// 	//showAddPersonForm.value = !showAddPersonForm.value;

// }

function addPerson(addedPeople) {
	showAddPersonForm.value = !showAddPersonForm.value;

	if (addedPeople) {
		contactsStore.addToContactsStore(addedPeople);
		// Refresh the local people ref with the updated store data
		people.value = contactsStore.contacts.data;
	}
}

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
	console.log(showAlterPesonForm.value);
}

// const findPerson = async (id) => {
// 	const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
// 		headers: {
// 			Authorization: `Bearer ${sessionStorage.getItem("token")}`,
// 		},
// 	});
// 	single_contact.value = response.data.contact;
// 	alterPerson();
// };

const findPerson = async (id) => {
	try {
		// First, try to find the contact in the local store
		const contactFromStore = contactsStore.contacts.data.find(
			(contact) => contact.id === id
		);

		if (contactFromStore) {
			// Use contact from store if found
			single_contact.value = { ...contactFromStore };
		} else {
			// Fetch contact from API if not in store
			const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
				headers: {
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			});
			single_contact.value = response.data.contact;
		}

		// Open the alter person form
		alterPerson();
	} catch (error) {
		console.error("Error finding person:", error);
		alert("Could not find contact details");
	}
};

const deletePerson = async (id) => {
	await contactsStore.deleteContact(id);
	people.value = contactsStore.contacts.data;
};

token.value = sessionStorage.getItem("token");

onMounted(async () => {
	try {
		// Fetch the contacts from the API
		if (contactsStore.contacts.length === 0) {
			await contactsStore.fetchContacts();
		}
		people.value = contactsStore.contacts.data;

		console.log(callListNames.value);
	} catch (error) {
		console.error("Error:", error);
	}

	try {
		// Fetch the useer ID from pinia
		await userStore.fetchUser();
		user_id.value = userStore.user.id;
		console.log(user_id.value);
	} catch (error) {
		console.error("Error:", error);
	}

	// Fetch the call list names
	callListNames.value = await axios.get(`${config.public.apiUrl}call-lists`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});

	callListNames.value = callListNames.value.data;
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

// PAGINATION
const nextPage = async () => {
	await contactsStore.nextPage();
	page.value = contactsStore.contacts.current_page;
	people.value = contactsStore.contacts.data;
};

const prevPage = async () => {
	await contactsStore.prevPage();
	page.value = contactsStore.contacts.current_page;
	people.value = contactsStore.contacts.data;
};

// const updatePerson = async (updatedContact) => {
// 	try {
// 		await contactsStore.updatePerson(updatedContact);
// 		showAlterPesonForm.value = false;
// 		people.value = contactsStore.contacts.data;
// 		alert("Kontakt bol upravený");
// 	} catch (error) {
// 		// More detailed error handling
// 		if (error.response) {
// 			// The request was made and the server responded with a status code
// 			// that falls out of the range of 2xx
// 			alert(
// 				`Chyba pri úprave kontaktu: ${
// 					error.response.data.message || "Neznáma chyba"
// 				}`
// 			);
// 		} else if (error.request) {
// 			// The request was made but no response was received
// 			alert("Nepodarilo sa spojiť so serverom");
// 		} else {
// 			// Something happened in setting up the request that triggered an Error
// 			alert("Nastala chyba pri spracovaní požiadavky");
// 		}
// 		console.error("Detailed error:", error);
// 	}
// };
// const updatePerson = async (updatedContact) => {
// 	// try {
// 	// 	// Call the store method to update the contact in the backend
// 	// 	await contactsStore.updatePerson(updatedContact);
// 	// 	// Update the `people` array with the new data
// 	// 	const index = people.value.findIndex(
// 	// 		(person) => person.id === updatedContact.id
// 	// 	);
// 	// 	if (index !== -1) {
// 	// 		people.value[index] = { ...people.value[index], ...updatedContact };
// 	// 	}
// 	// 	// Close the form
// 	// 	showAlterPesonForm.value = false;
// 	// 	alert("Kontakt bol upravený");
// 	// } catch (error) {
// 	// 	// Handle errors with appropriate alerts
// 	// 	alert(`Error updating person: ${error.message || "Unknown error"}`);
// 	// 	console.error(error);
// 	// }

// 	//useContactsStore.updateContactInStore(updatedContact);
// 	people.value = contactsStore.contacts.data;
// 	showAlterPesonForm.value = false;
// };

const updatePerson = async (updatedContact) => {
	try {
		// Call the store method to update the contact
		await contactsStore.updatePerson(updatedContact);

		// Directly update the local people array
		const index = people.value.findIndex(
			(person) => person.id === updatedContact.id
		);

		if (index !== -1) {
			// Replace the old contact with the updated contact
			people.value[index] = { ...updatedContact };
		}

		// Close the alter person form
		showAlterPesonForm.value = false;

		// Optional: Refresh the entire contacts list to ensure consistency
		// await contactsStore.fetchContacts();
		// people.value = contactsStore.contacts.data;

		console.log("Contact updated successfully");
	} catch (error) {
		console.error("Error updating contact:", error);
		alert(`Failed to update contact: ${error.message}`);
	}
};

const hasSelectedItems = computed(() => selected.value.length > 0);

const uncheckAll = () => {
	// Clear the selected array
	selected.value = [];

	// Find all checkboxes and uncheck them
	const checkboxes = document.querySelectorAll('input[type="checkbox"]');
	checkboxes.forEach((checkbox) => {
		checkbox.checked = false;
	});
};

const showCallListForm = ref(false);

const cancleCallListForm = (status) => {
	showCallListForm.value = !showCallListForm.value;
	console.log("cancleCallListForm");
	if (status === 201 || status === 200) {
		// alert("Call list created successfully");
	}
};
</script>

<template>
	<div class="">
		<loadigcomponent v-if="contactsStore.loadingState" />
		<div class="flex justify-between">
			<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
				<searchBar @updateResults="handleSearchResults" />
			</div>

			<button
				@click="addPerson()"
				class="bg-blue-700 rounded-lg hover:bg-blue-500 hover:text-black h-14 w-14 flex justify-center pt-3 mr-8 mt-8 shadow-xl"
			>
				<Icon icon="fa6-solid:plus" style="font-size: 30px" class="" />
			</button>
		</div>
		<div class="flex justify-end mr-8 h-11 mb-5">
			<!-- Added fixed height h-12 -->
			<button
				v-if="hasSelectedItems"
				@click="uncheckAll"
				class="px-3 py-1 bg-red-500 hover:bg-red-700 rounded-lg text-white shadow-xl"
			>
				Unselect all {{ selected.length }}
			</button>
			<button
				v-if="hasSelectedItems"
				@click="toggleCallList"
				class="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white ml-4 shadow-xl"
			>
				Create Call List
			</button>
		</div>
	</div>

	<UTable
		:rows="people"
		:columns="columns"
		class="mx-6 table-container max-h-[1000px] owerlflow-y-auto shadow-md rounded-md"
	>
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
						class="bg-blue-500 text-white shadow-xl"
						label="Show Details"
					/>
					<UButton
						@click="findPerson(row.id)"
						icon="i-heroicons-pencil-square-20-solid"
						variant="ghost"
						class="shadow-xl hover:bg-gray-300"
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
						color="ffffff"
						class="shadow-xl text-red-500 hover:bg-gray-300"
					/>
				</div>
				<input type="checkbox" @change="toggleCheckbox(row.id)" />
			</div>
		</template>
	</UTable>

	<!-- <pagination /> -->
	<div class="flex gap-[40px] justify-center mt-[30px] mb-[50px]">
		<div class="cursor-pointer" @click="prevPage()">
			<Icon
				class="hover:size-[38px]"
				icon="fa6-solid:circle-arrow-left"
				style="font-size: 35px; color: #0074b7"
			/>
		</div>
		<div class="font-semibold text-xl">{{ contactsStore.page }}</div>
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
	<CallListAdd
		v-if="showCallListForm"
		:callListNames="callListNames"
		:selected="selected"
		:user_id="user_id"
		@cancleCallListForm="cancleCallListForm"
		@uncheckAll="uncheckAll"
	/>
</template>

<style scoped>
.table-container {
	overflow-x: auto;
}
</style>
