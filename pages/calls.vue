<script setup>
const config = useRuntimeConfig();
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useCallListStore } from "~/stores/callListStore";
const callListStore = useCallListStore();

const authStore = useAuthStore();
authStore.loadToken();

const token = ref("");
token.value = sessionStorage.getItem("token");
const next_page_url = ref("");
const prev_page_url = ref("");
const page = ref(1);

const router = useRouter();

const single_contact = ref({});

const showAlterPesonForm = ref(false);
const people = ref([]);

const call_lists = ref([]);
const filteredCallLists = ref([]);

const updateResults = (results) => {
	call_lists.value = results;
};

const isChecked = ref(false);
const selected = ref([]);

const selectedCallList = ref({});

const detailView = (id) => {
	router.push(`/contact/${id}`);
};

const findPerson = async (id) => {
	const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
		headers: {
			Authorization: `Bearer ${sessionStorage.getItem("token")}`,
		},
	});
	single_contact.value = response.data.contact;
	alterPerson();
};

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
	console.log(showAlterPesonForm.value);
}

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
};

// const findPerson = async (id) => {
// 	const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
// 		headers: {
// 			Authorization: `Bearer ${sessionStorage.getItem("token")}`,
// 		},
// 	});
// 	single_contact.value = response.data.contact;
// 	showAlterPersonForm.value = true;
// };

const deletePerson = async (id, callListId) => {
	try {
		await callListStore.deletePersonStore(id, callListId);
		people.value = callListStore.singleCallList.contacts;
	} catch (error) {
		console.error("Failed to delete person:", error);
	}
	people.value = callListStore.selectedCallListPeople;
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

onMounted(async () => {
	if (callListStore.callLists.length === 0) {
		await callListStore.fetchCallLists();
		call_lists.value = callListStore.callLists;
	} else {
		call_lists.value = callListStore.callLists;
	}
	console.log("Call lists", call_lists.value);
});

if (callListStore.selectedCallListPeople.length > 0) {
	people.value = callListStore.selectedCallListPeople;
}

const ids_from_call_list = ref([]);

const getCallList = async (id) => {
	// try {
	// 	const response = await axios.get(
	// 		`${config.public.apiUrl}call-lists/${id}`,
	// 		{
	// 			headers: {
	// 				Authorization: `Bearer ${authStore.token}`,
	// 			},
	// 		}
	// 	);
	// 	// ids_from_call_list.value = response.data.contact_ids;
	// 	// selectedCallList.value = response.data;
	// 	// console.log("Selected", selectedCallList.value);
	// 	// console.log(ids_from_call_list.value);
	// 	// people.value = response.data.contacts;
	// 	console.log("Selected skuska skuska", response.data);
	// } catch (error) {
	// 	console.error("Error fetching contacts:", error);
	// 	// Handle the error, e.g., display an error message to the user
	// }

	callListStore.getCallListById(id);
	callListStore.setSelectedCallList(id);
	console.log("singleCallList", callListStore.singleCallList);

	try {
		// Log the data to verify its format
		// console.log("Sending IDs:", ids_from_call_list.value);

		let contactIds;

		try {
			contactIds = JSON.parse(callListStore.singleCallList.contact_ids);
			console.log("Parsed contact IDs:", contactIds);
		} catch (error) {
			console.error("Failed to parse contact IDs:", error.message);
		}
		const callListResponse = await axios.post(
			`${config.public.apiUrl}call-list`,
			{ ids: contactIds }, // Make sure it's sent as {ids: [...]}
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (callListResponse.data.contacts) {
			people.value = [...callListResponse.data.contacts];
			callListStore.selectedCallListPeople = callListResponse.data.contacts;
			console.log("Received contacts:", callListStore.selectedCallListPeople);
		}
	} catch (error) {
		if (error.response) {
			console.error("Server response error:", error.response.data);
		} else {
			console.error("Error fetching contacts:", error);
		}
	}
};

const deleteCallList = async (id) => {
	await callListStore.deleteCallList(id);
	call_lists.value = callListStore.callLists;
};
</script>

<template>
	<div class="flex">
		<loadigcomponent v-if="callListStore.loadingState" />
		<div
			class="min-w-[280px] max-w-[280px] h-[calc(100vh-1.5rem)] bg-gr px-3 pt-5 mx-3 rounded-2xl my-3 ml-6 shadow-lg overflow-y-auto overflow-x-hidden"
		>
			<CallsSearchBar @updateResults="updateResults" :call_lists="call_lists" />

			<div class="py-3">
				<div
					v-for="call_list in call_lists"
					:key="call_list.id"
					:class="[
						'flex justify-between px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer',
						call_list.id === callListStore.selectedCallList
							? 'bg-gray-300 shadow-sm'
							: '',
					]"
				>
					<span
						class="w-[150px] text-ellipsis"
						@click="getCallList(call_list.id)"
						><p class="truncate text-ellipsis">{{ call_list.name }}</p></span
					>
					<button
						class="pb-2 w-[15px] h-[15px] text-red font-bold text-white rounded-sm hover:text-white"
						@click="deleteCallList(call_list.id)"
					>
						X
					</button>
				</div>
				<div v-if="filteredCallLists.length">
					<h2>Search Results</h2>
					<ul>
						<li v-for="(call, index) in filteredCallLists" :key="index">
							{{ call.name }} - {{ call.contactInfo }}
						</li>
					</ul>
				</div>
			</div>
		</div>
		<div
			class="bg-gr h-[calc(100vh-1.5rem)] w-full ml-3 mr-6 rounded-2xl my-3 shadow-lg p-4"
		>
			<UTable
				:rows="people"
				:columns="columns"
				class="mx-6 table-container h-[calc(100vh-3rem)] owerflow-y-auto"
			>
				<template #name-data="{ row }">
					<div class="test">
						<span
							:class="[
								selected.find((person) => person.id === row.id) &&
									'text-primary-500 dark:text-primary-400',
							]"
							class="text-red"
						>
							{{ row.name }}
						</span>
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
								@click="deletePerson(row.id, callListStore.selectedCallList)"
								icon="i-heroicons-trash-20-solid"
								color="red"
								variant="ghost"
								class="text-red"
							/>
						</div>
						<input
							type="checkbox"
							@change="toggleCheckbox(row.id)"
							class="bg-white"
						/>
					</div>
				</template>
			</UTable>
		</div>
		<AlterPersonForm
			v-if="showAlterPesonForm"
			@cancelAlter="alterPerson()"
			@alterPerson="updatePerson"
			:single_contact="single_contact"
		/>
	</div>
</template>

<style>
:root {
	--background-color: #f0f0f0;
	--text-color: #000000;
}

body {
	background-color: var(--background-color);
	color: var(--text-color);
}

.bg-gr {
	background-color: #ffffff;
}

* {
	color: #000000 !important;
}

.text-red {
	color: #ff0000 !important;
}

.color-black {
	color: #000000 !important;
}
</style>
