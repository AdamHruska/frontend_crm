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

const sharedPeople = ref([]);

// funcion to toggle call list creation
const callList = ref(false);
const callListName = ref("");
const user_id = ref("");

const callListNames = ref([]);

const showDisclaimer = ref(false);

const toggleCallList = async () => {
	if (selected.value.length > 0) {
		cancleCallListForm(); // Show the form
	}
};

const toggleCheckbox = (id) => {
	// Try to find the contact in `people` or `sharedPeople`
	const person =
		people.value.find((p) => p.id === id) ||
		sharedPeople.value.find((p) => p.id === id);

	if (!person) return; // safety check

	const index = selected.value.findIndex((p) => p.id === id);
	if (index === -1) {
		// Add to selection
		selected.value.push(person);
		contactsStore.selectedContacts.push(person);
	} else {
		// Remove from selection
		selected.value.splice(index, 1);
		contactsStore.selectedContacts.splice(
			contactsStore.selectedContacts.findIndex((p) => p.id === id),
			1
		);
	}

	console.log("Selected:", selected.value);
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
				cssClass += "bg-blue-200 ";
			}

			if (person.wrong_number === 1) {
				cssClass += "bg-orange-300 ";
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
	try {
		// optional confirmation
		if (!confirm("Naozaj chcete zrušiť zdieľanie tohto kontaktu?")) {
			return;
		}

		await axios.put(
			`${config.public.apiUrl}contacts/${id}/unshare`,
			{},
			{
				headers: {
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			}
		);

		// Remove from "shared with me" table
		sharedPeople.value = sharedPeople.value.filter(
			(person) => person.id !== id
		);

		// Also clean selection if selected
		selected.value = selected.value.filter((p) => p.id !== id);
		contactsStore.selectedContacts = contactsStore.selectedContacts.filter(
			(p) => p.id !== id
		);

		console.log("Contact unshared successfully");
	} catch (error) {
		console.error("Error unsharing contact:", error);
		alert(
			error.response?.data?.message || "Nepodarilo sa zrušiť zdieľanie kontaktu"
		);
	}
};

token.value = sessionStorage.getItem("token");

onMounted(async () => {
	try {
		console.log("Fetching shared contacts...");

		const response = await axios.get(`${config.public.apiUrl}contacts/shared`, {
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
			},
		});

		people.value = response.data.map((person) => {
			let cssClass = "";

			if (person.first_event === 0) {
				cssClass += "bg-green-200 ";
			}

			if (person.only_called_never_answered === 1) {
				cssClass += "bg-blue-200 ";
			}

			if (person.wrong_number === 1) {
				cssClass += "bg-orange-300 ";
			}

			return {
				...person,
				class: cssClass.trim(),
			};
		});

		console.log("Shared contacts loaded:", people.value);
	} catch (error) {
		console.error("Error fetching shared contacts:", error);
	}

	// keep this part (user + call lists)
	try {
		await userStore.fetchUser();
		user_id.value = userStore.user.id;
	} catch (error) {
		console.error("Error fetching user:", error);
	}

	callListNames.value = (
		await axios.get(`${config.public.apiUrl}call-lists`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		})
	).data;

	try {
		console.log("Fetching contacts shared to me...");

		const response = await axios.get(
			`${config.public.apiUrl}contacts/shared-to-me`,
			{
				headers: {
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			}
		);

		sharedPeople.value = response.data.map((person) => {
			let cssClass = "";

			if (person.first_event === 0) cssClass += "bg-green-200 ";
			if (person.only_called_never_answered === 1) cssClass += "bg-blue-200 ";
			if (person.wrong_number === 1) cssClass += "bg-orange-300 ";

			return {
				...person,
				class: cssClass.trim(),
			};
		});

		console.log("Shared-to-me contacts loaded:", sharedPeople.value);
	} catch (error) {
		console.error("Error fetching shared-to-me contacts:", error);
	}
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
				cssClass += "bg-blue-200 ";
			}

			if (person.wrong_number === 1) {
				cssClass += "bg-orange-300 ";
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
				cssClass += "bg-blue-200 ";
			}
			if (person.wrong_number === 1) {
				cssClass += "bg-orange-300 ";
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
		class: "w-[140px]",
	},
	{
		key: "priezvisko",
		label: "Priezvisko",
		class: "w-[160px]",
	},
	{
		key: "cislo",
		label: "tel. číslo",
		class: "w-[140px]",
	},
	{
		key: "odporucitel",
		label: "Odporucitel",
		class: "w-[160px]",
	},
	{
		key: "shared_author_name",
		label: "Vlastník",
		class: "w-[160px]",
	},
	{
		key: "poznamka",
		label: "Poznámka",
		class: "w-[400px]", // 👈 wider column
	},
	{
		key: "actions",
		class: "w-[260px]",
	},
	{
		key: "checkbox",
		label: "",
		type: "checkbox",
		class: "w-[60px]",
	},
];

const columnsSecond = [
	{
		key: "meno",
		label: "Meno",
		class: "w-[140px]",
	},
	{
		key: "priezvisko",
		label: "Priezvisko",
		class: "w-[160px]",
	},
	{
		key: "cislo",
		label: "tel. číslo",
		class: "w-[140px]",
	},
	{
		key: "odporucitel",
		label: "Odporucitel",
		class: "w-[160px]",
	},
	{
		key: "poznamka",
		label: "Poznámka",
		class: "w-[400px]", // 👈 wider column
	},
	{
		key: "actions",
		class: "w-[260px]",
	},
	{
		key: "checkbox",
		label: "",
		type: "checkbox",
		class: "w-[60px]",
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
			cssClass += "bg-blue-200 ";
		}
		if (person.wrong_number === 1) {
			cssClass += "bg-orange-300 ";
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
			cssClass += "bg-blue-200 ";
		}
		if (person.wrong_number === 1) {
			cssClass += "bg-orange-300 ";
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
			cssClass += "bg-blue-200 ";
		}

		if (person.wrong_number === 1) {
			cssClass += "bg-orange-300 ";
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

const showDelegateForm = ref(false);

const showShareContacts = ref(false);
</script>

<template>
	<div class="">
		<SelectedContactsComponent
			v-if="showSelectedContactsBool"
			@showSelectedContacts="showSelectedContacts"
		/>

		<loadigcomponent v-if="contactsStore.loadingState" />
		<div class="flex justify-between w-full">
			<!-- <div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
				<searchBar @updateResults="handleSearchResults" />
			</div> -->

			<div class="flex items-center mb-2 ml-auto">
				<UTooltip
					text="Pridať kontakt"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<button
						@click="addPerson()"
						class="bg-blue-700 rounded-lg hover:bg-blue-500 hover:text-black h-11 w-11 flex justify-center pt-[7px] mr-4 mt-8 shadow-xl"
					>
						<Icon icon="fa6-solid:plus" style="font-size: 30px" class="" />
					</button>
				</UTooltip>

				<button
					@click="showSelectedContacts"
					class="bg-green-400 hover:bg-green-500 rounded-lg h-11 mt-8 mr-8 shadow-md px-2 w-auto"
				>
					Zobraziť zaklinuté kontakty
				</button>
			</div>
		</div>

		<div class="relative float-end mr-10 mt-2">
			<Icon
				icon="material-symbols:chat-info-outline"
				class="scale-[2] hover:scale-[2.5] cursor-pointer transition-transform"
				@mouseenter="showDisclaimer = true"
				@mouseleave="showDisclaimer = false"
			/>
			<div
				class="bg-white rounded-md shadow-md w-[300px] absolute right-8 top-[-10px] z-[50] py-3 px-4"
				id="disclaimer"
				v-if="showDisclaimer"
			>
				<!-- Colour -->
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-green-200"></div>
					<div>- Kontakt nemá žiadne aktivity</div>
				</div>
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-blue-200"></div>
					<div>- Len volané a nedovolané</div>
				</div>
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-orange-300"></div>
					<div>- Zlé tel. čislo</div>
				</div>
			</div>
		</div>

		<div class="flex justify-end mr-20 h-11">
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

			<button
				v-if="contactsStore.selectedContacts.length > 0"
				@click="showDelegateForm = !showDelegateForm"
				class="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white ml-4 shadow-xl"
			>
				Posunúť kontakty
			</button>

			<button
				v-if="contactsStore.selectedContacts.length > 0"
				@click="showShareContacts = !showShareContacts"
				class="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white ml-4 shadow-xl"
			>
				Zdielať kontakty
			</button>
		</div>
	</div>

	<h1 class="ml-6 mt-10 mb-3 font-semibold text-lg">
		Kontakty zdieľané so mnou:
	</h1>
	<UTable
		:rows="sharedPeople"
		:columns="columns"
		class="mx-6 table-container shadow-md rounded-md table-fixed mb-12"
		:row-class="(row) => row.class"
		:ui="{
			td: {
				base: 'align-top whitespace-normal overflow-hidden',
			},
		}"
	>
		<template #actions-data="{ row }">
			<div class="flex justify-between">
				<div class="flex space-x-2">
					<UButton
						@click.left="detailView(row.id)"
						@auxclick.prevent="onAuxClick($event, row.id)"
						@mousedown="handleMouseDown"
						class="bg-blue-500 text-white shadow-xl hover:scale-110 transition-transform"
						label="Zobraziť detail"
					/>

					<UTooltip
						text="Vymazať kontakt"
						:ui="{ background: '!bg-white', color: '' }"
						class=""
					>
						<UButton
							@click="deletePerson(row.id)"
							icon="i-heroicons-trash-20-solid"
							color="ffffff"
							class="shadow-xl text-red-500 hover:bg-gray-300 hover:scale-110 transition-transform"
						/>
					</UTooltip>
				</div>

				<!-- optional checkbox support -->
				<input
					type="checkbox"
					@change="toggleCheckbox(row.id)"
					:checked="isSelected(row.id)"
				/>
			</div>
		</template>

		<template #poznamka-data="{ row }">
			<div v-if="row.poznamka" class="group relative">
				<div class="truncate max-w-[380px]">
					{{ row.poznamka }}
				</div>

				<div
					class="absolute hidden group-hover:block z-10 w-[500px] p-3 bg-white border border-gray-200 rounded shadow-lg"
				>
					<div class="text-sm text-gray-700 whitespace-normal">
						{{ row.poznamka }}
					</div>
				</div>
			</div>
		</template>
	</UTable>

	<h1 class="ml-6 mb-3 font-semibold text-lg">Moje kontakty:</h1>
	<UTable
		:rows="people"
		:columns="columnsSecond"
		class="mx-6 table-container shadow-md rounded-md table-fixed"
		:row-class="(row) => row.class"
		:ui="{
			td: {
				base: 'align-top whitespace-normal overflow-hidden',
			},
		}"
	>
		<template #actions-data="{ row }">
			<div class="flex justify-between">
				<div class="flex space-x-4">
					<UButton
						@click.left="detailView(row.id)"
						@auxclick.prevent="onAuxClick($event, row.id)"
						@mousedown="handleMouseDown"
						class="bg-blue-500 text-white shadow-xl hover:scale-110 transition-transform"
						label="Zobraziť detail"
					/>
					<UTooltip
						text="Upraviť kontakt"
						:ui="{ background: '!bg-white', color: '' }"
						class=""
					>
						<UButton
							@click="findPerson(row.id)"
							icon="i-heroicons-pencil-square-20-solid"
							variant="ghost"
							class="shadow-xl hover:bg-gray-300 hover:scale-110 transition-transform"
						/>
					</UTooltip>

					<UTooltip
						text="Vymazať kontakt"
						:ui="{ background: '!bg-white', color: '' }"
						class=""
					>
						<UButton
							@click="deletePerson(row.id)"
							icon="i-heroicons-trash-20-solid"
							color="ffffff"
							class="shadow-xl text-red-500 hover:bg-gray-300 hover:scale-110 transition-transform"
						/>
					</UTooltip>
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
				<div class="truncate max-w-[380px]">
					{{ row.poznamka }}
				</div>

				<div
					class="absolute hidden group-hover:block z-10 w-[500px] p-3 bg-white border border-gray-200 rounded shadow-lg"
				>
					<div class="text-sm text-gray-700 whitespace-normal">
						{{ row.poznamka }}
					</div>
				</div>
			</div>
		</template>
	</UTable>

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
	<DelegateContacts
		v-if="showDelegateForm"
		@cancelDelegateForm="showDelegateForm = false"
		:selected="selected"
	/>

	<ShareContactsForm
		v-if="showShareContacts"
		@cancelShareContacts="showShareContacts = false"
		:selected="selected"
	/>
</template>

<style scoped>
.table-container {
	overflow-x: none;
}
</style>
