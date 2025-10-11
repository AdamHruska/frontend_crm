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
			//Adding checked contacts
			selected.value.push(person);
			contactsStore.selectedContacts.push(person);
			console.log("added contacts in store:", contactsStore.selectedContacts);
		} else {
			//Deleting checked contacts
			selected.value.splice(index, 1);
			contactsStore.selectedContacts.splice(index, 1);
			console.log("Deleted contacts in store:", contactsStore.selectedContacts);
		}
	}
	console.log("Selected", selected.value);
};

const isSelected = (id) => {
	return contactsStore.selectedContacts.some((person) => person.id === id);
};

function addPerson(addedPeople) {
	showAddPersonForm.value = !showAddPersonForm.value;

	if (addedPeople) {
		contactsStore.addToContactsStore(addedPeople);
		// Refresh the local people ref with the updated store data
		//people.value = contactsStore.contacts.data;
		people.value = contactsStore.contacts.data.map((person) => {
			let cssClass = "";

			if (person.first_event === 0) {
				cssClass += "bg-green-200 ";
			}

			if (person.only_called_never_answered === 1) {
				cssClass += "bg-orange-200 ";
			}

			return {
				...person,
				class: cssClass.trim(),
			};
		});
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
		console.log("Fetching contacts...");
		// Fetch the contacts from the API
		if (contactsStore.contacts.length === 0) {
			await contactsStore.fetchContacts();
		}
		// people.value = contactsStore.contacts.data;

		people.value = contactsStore.contacts.data.map((person) => {
			let cssClass = "";
			console.log("person value", person);

			if (person.first_event === 0) {
				cssClass += "bg-green-200 ";
			}

			if (person.only_called_never_answered === 1) {
				cssClass += "bg-blue-200 ";
			}

			if (person.first_event === 0) {
				cssClass += "bg-green-200 ";
			}

			return {
				...person,
				class: cssClass.trim(),
			};
		});

		console.log("poeple value", people.value);
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
	// If results is an array (search results), update people
	if (Array.isArray(results)) {
		contactsStore.contacts = {
			...contactsStore.contacts,
			data: results,
		};

		people.value = results.map((person) => {
			let cssClass = "";
			if (person.first_event === 0) {
				cssClass += "bg-green-200 ";
			}
			if (person.only_called_never_answered === 1) {
				cssClass += "bg-orange-200 ";
			}
			return {
				...person,
				class: cssClass.trim(),
			};
		});
	}
	// If results is paginated data (from store), use the data property
	else if (results && results.data) {
		people.value = results.data.map((person) => {
			let cssClass = "";
			if (person.first_event === 0) {
				cssClass += "bg-green-200 ";
			}
			if (person.only_called_never_answered === 1) {
				cssClass += "bg-orange-200 ";
			}
			return {
				...person,
				class: cssClass.trim(),
			};
		});
	}
};

const detailView = (id) => {
	router.push(`/contact/${id}`);
};

const detailViewNewTab = (id) => {
	window.open(`/contact/${id}`, "_blank");
};

const onAuxClick = (event, id) => {
	if (event.button === 1) {
		// middle mouse button
		event.preventDefault();
		detailViewNewTab(id);
	}
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
	//people.value = contactsStore.contacts.data;
	people.value = contactsStore.contacts.data.map((person) => {
		let cssClass = "";

		if (person.first_event === 0) {
			cssClass += "bg-green-200 ";
		}

		if (person.only_called_never_answered === 1) {
			cssClass += "bg-orange-200 ";
		}

		return {
			...person,
			class: cssClass.trim(),
		};
	});
};

const prevPage = async () => {
	await contactsStore.prevPage();
	page.value = contactsStore.contacts.current_page;
	//people.value = contactsStore.contacts.data;

	people.value = contactsStore.contacts.data.map((person) => {
		let cssClass = "";

		if (person.first_event === 0) {
			cssClass += "bg-green-200 ";
		}

		if (person.only_called_never_answered === 1) {
			cssClass += "bg-orange-200 ";
		}

		return {
			...person,
			class: cssClass.trim(),
		};
	});
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

const uncheckAll = () => {
	// Clear the selected array
	selected.value = [];

	// Find all checkboxes and uncheck them
	const checkboxes = document.querySelectorAll('input[type="checkbox"]');
	checkboxes.forEach((checkbox) => {
		checkbox.checked = false;
	});
	contactsStore.selectedContacts = [];
};

const showCallListForm = ref(false);

const cancleCallListForm = (status) => {
	showCallListForm.value = !showCallListForm.value;
	console.log("cancleCallListForm");
	if (status === 201 || status === 200) {
		// alert("Call list created successfully");
	}
};

const totalPages = computed(() => contactsStore.contacts.last_page || 1);

const goToPage = async (pageNum) => {
	await contactsStore.goToPage(pageNum);
	page.value = contactsStore.contacts.current_page;
	//people.value = contactsStore.contacts.data;

	people.value = contactsStore.contacts.data.map((person) => {
		let cssClass = "";

		if (person.first_event === 0) {
			cssClass += "bg-green-200 ";
		}

		if (person.only_called_never_answered === 1) {
			cssClass += "bg-orange-200 ";
		}

		return {
			...person,
			class: cssClass.trim(),
		};
	});
};

const pageNumbers = computed(() => {
	const total = totalPages.value;
	const current = contactsStore.page;
	const delta = 2; // Number of pages to show before and after current page

	// If we have 7 or fewer pages, show all of them
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	// Calculate range to display
	let range = [];

	// Always include first page
	range.push(1);

	// Calculate start and end of range around current page
	const rangeStart = Math.max(2, current - delta);
	const rangeEnd = Math.min(total - 1, current + delta);

	// Add ellipsis if needed before rangeStart
	if (rangeStart > 2) {
		range.push("...");
	}

	// Add pages around current page
	for (let i = rangeStart; i <= rangeEnd; i++) {
		range.push(i);
	}

	// Add ellipsis if needed after rangeEnd
	if (rangeEnd < total - 1) {
		range.push("...");
	}

	// Always include last page
	range.push(total);

	return range;
});

const showSelectedContactsBool = ref(false);

const showSelectedContacts = () => {
	showSelectedContactsBool.value = !showSelectedContactsBool.value;
};

const handleMouseDown = (event) => {
	if (event.button === 1) {
		event.preventDefault();
	}
};

const fetchCallLists = async () => {
	try {
		const response = await axios.get(`${config.public.apiUrl}call-lists`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		callListNames.value = response.data;
	} catch (error) {
		console.error("Error fetching call lists:", error);
	}
};
</script>

<template>
	<div class="">
		<SelectedContactsComponent
			v-if="showSelectedContactsBool"
			@showSelectedContacts="showSelectedContacts"
		/>

		<loadigcomponent v-if="contactsStore.loadingState" />
		<div class="flex justify-between">
			<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
				<searchBar @updateResults="handleSearchResults" />
			</div>

			<div class="flex items-center mb-2">
				<button
					@click="addPerson()"
					class="bg-blue-700 rounded-lg hover:bg-blue-500 hover:text-black h-11 w-11 flex justify-center pt-[7px] mr-4 mt-8 shadow-xl"
				>
					<Icon icon="fa6-solid:plus" style="font-size: 30px" class="" />
				</button>

				<button
					@click="showSelectedContacts"
					class="bg-green-400 hover:bg-green-500 rounded-lg h-11 mt-8 mr-8 shadow-md px-2 w-auto"
				>
					Zobraziť zaklinuté kontakty
				</button>
			</div>
		</div>

		<div class="flex justify-end mr-8 h-11 mb-5">
			<!-- Added fixed height h-12 -->
			<button
				v-if="contactsStore.selectedContacts.length > 0"
				@click="uncheckAll"
				class="px-3 py-1 bg-red-500 hover:bg-red-700 rounded-lg text-white shadow-xl"
			>
				Unselect all {{ contactsStore.selectedContacts.length }}
			</button>
			<button
				v-if="contactsStore.selectedContacts.length > 0"
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
		class="mx-6 table-container shadow-md rounded-md"
		:row-class="(row) => row.class"
	>
		<template #actions-data="{ row }">
			<div class="flex justify-between">
				<div class="flex space-x-4">
					<UButton
						@click.left="detailView(row.id)"
						@auxclick.prevent="onAuxClick($event, row.id)"
						@mousedown="handleMouseDown"
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
				<input
					type="checkbox"
					@change="toggleCheckbox(row.id)"
					:checked="isSelected(row.id)"
				/>
			</div>
		</template>

		<template #poznamka-data="{ row }">
			<div v-if="row.poznamka" class="group relative">
				<div class="truncate max-w-[200px]">
					{{ row.poznamka }}
				</div>
				<div
					class="absolute hidden group-hover:block z-10 w-[300px] p-2 bg-white border border-gray-200 rounded shadow-lg"
				>
					<div class="text-sm text-gray-700 whitespace-normal">
						{{ row.poznamka }}
					</div>
				</div>
			</div>
		</template>
	</UTable>

	<!-- Pagination -->
	<div
		class="flex justify-center items-center gap-2 mt-[30px] mb-[50px]"
		v-if="!contactsStore.searchQuery"
	>
		<div
			class="cursor-pointer"
			@click="prevPage()"
			:class="{ 'opacity-50': contactsStore.page <= 1 }"
		>
			<Icon
				class="hover:size-[38px]"
				icon="fa6-solid:circle-arrow-left"
				style="font-size: 35px; color: #0074b7"
			/>
		</div>

		<!-- Page numbers -->
		<div class="flex gap-2">
			<template v-for="pageNum in pageNumbers" :key="pageNum">
				<div v-if="pageNum === '...'" class="px-3 py-1 text-gray-500">
					{{ pageNum }}
				</div>
				<div
					v-else
					@click="goToPage(pageNum)"
					class="px-3 py-1 rounded-md cursor-pointer"
					:class="[
						contactsStore.page === pageNum
							? 'bg-blue-600 text-white'
							: 'bg-gray-200 hover:bg-gray-300',
					]"
				>
					{{ pageNum }}
				</div>
			</template>
		</div>

		<div
			class="cursor-pointer"
			@click="nextPage()"
			:class="{ 'opacity-50': contactsStore.page >= totalPages }"
		>
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
		@refreshCallLists="fetchCallLists"
	/>
</template>

<style scoped>
.table-container {
	overflow-x: none;
}
</style>
