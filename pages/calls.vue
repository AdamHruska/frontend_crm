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
const loadingState = ref(false);
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

const showDisclaimer = ref(false);

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
	selected.value = [];
	const checkboxes = document.querySelectorAll('input[type="checkbox"]');
	checkboxes.forEach((checkbox) => {
		checkbox.checked = false;
	});
};

function decoratePeople(contacts) {
	return contacts.map((person) => {
		let cssClass = "";
		if (person.first_event === 0) {
			cssClass += "bg-green-200 ";
		}

		if (person.last_activity && callListStore.singleCallList.created_at) {
			const lastActivityDate = new Date(person.last_activity);
			const callListCreatedDate = new Date(
				callListStore.singleCallList.created_at
			);

			if (lastActivityDate < callListCreatedDate) {
				cssClass += "bg-yellow-200 ";
			} else if (lastActivityDate > callListCreatedDate) {
				cssClass += "bg-red-200 ";
			}
		}

		return { ...person, class: cssClass.trim() };
	});
}

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
	//people.value = callListStore.selectedCallListPeople;
	people.value = decoratePeople(callListStore.selectedCallListPeople);
}

const ids_from_call_list = ref([]);

const getCallList = async (id) => {
	loadingState.value = true;
	callListStore.getCallListById(id);
	callListStore.setSelectedCallList(id);
	console.log("singleCallList", callListStore.singleCallList);

	try {
		let contactIds;

		try {
			contactIds = JSON.parse(callListStore.singleCallList.contact_ids);
			console.log("Parsed contact IDs:", contactIds);
		} catch (error) {
			console.error("Failed to parse contact IDs:", error.message);
		}
		const callListResponse = await axios.post(
			`${config.public.apiUrl}call-list`,
			{ ids: contactIds },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (callListResponse.data.contacts) {
			people.value = [...callListResponse.data.contacts];

			people.value = people.value.map((person) => {
				console.log("person.first_event", person.last_activity);
				let cssClass = "";
				console.log("person.first_event", person.last_activity);
				if (person.first_event === 0) {
					cssClass += "bg-green-200 ";
				}

				if (person.last_activity && callListStore.singleCallList.created_at) {
					const lastActivityDate = new Date(person.last_activity);
					const callListCreatedDate = new Date(
						callListStore.singleCallList.created_at
					);

					if (lastActivityDate < callListCreatedDate) {
						// Žltá - staršia aktivita ako vytvorenie call listu
						cssClass += "bg-yellow-200 ";
					} else if (lastActivityDate > callListCreatedDate) {
						// Červená - novšia aktivita ako vytvorenie call listu
						cssClass += "bg-red-200 ";
					}
				}

				return {
					...person,
					class: cssClass.trim(),
				};
			});
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
	loadingState.value = false;
};

const deleteCallList = async (id) => {
	await callListStore.deleteCallList(id);
	call_lists.value = callListStore.callLists;
};
</script>

<template>
	<div class="flex">
		<loadigcomponent v-if="callListStore.loadingState" />
		<loadigcomponent v-if="loadingState" />

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
						class="pb-2 w-[15px] h-[15px] text-red font-bold text-white rounded-sm hover:text-white hover:text-xl"
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
			class="bg-gr h-[calc(100vh-1.5rem)] w-full ml-3 mr-6 rounded-2xl my-3 shadow-lg p-4 table-container"
		>
			<div class="relative float-end mt-2">
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
					<div class="flex items-center space-x-2 mb-3">
						<div class="w-[32px] h-[32px] bg-yellow-200 shrink-0"></div>
						<div>- Poslená aktivita je staršia ako vytvorenie call listu</div>
					</div>
					<div class="flex items-center space-x-2 mb-3">
						<div class="w-[32px] h-[32px] bg-red-200 shrink-0"></div>
						<div>- posledná aktivita je novšia ako vytvorenie call listu</div>
					</div>
					<div class="flex items-center space-x-2 mb-3">
						<div class="w-[32px] h-[32px] bg-green-200 shrink-0"></div>
						<div>- Žiadna aktivita</div>
					</div>
				</div>
			</div>
			<UTable
				:rows="people"
				:columns="columns"
				class="mx-6 table-container h-[calc(100vh-3rem)] owerflow-y-auto table-black-text"
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

				<template #poznamka-data="{ row }">
					<div v-if="row.poznamka" class="group relative max-w-xs">
						<div class="truncate">
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
					<div v-else class="text-gray-400">-</div>
				</template>

				<template #actions-data="{ row }">
					<div class="flex justify-between">
						<div class="flex space-x-4">
							<UButton
								@click="detailView(row.id)"
								class="bg-blue-500 text-white"
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
									color="gray"
									variant="ghost"
								/>
							</UTooltip>
							<div class="">
								<UTooltip
									text="Vymazať kontakt z call listu"
									:ui="{ background: '!bg-white', color: '' }"
									class=""
								>
									<UButton
										@click="
											deletePerson(row.id, callListStore.selectedCallList)
										"
										icon="i-heroicons-trash-20-solid"
										color="red"
										variant="ghost"
										class="text-red"
									/>
								</UTooltip>
							</div>
						</div>
						<input
							type="checkbox"
							@change="toggleCheckbox(row.id)"
							class="bg-white cursor-pointer"
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
	color: #000000;
}

.table-black-text {
	color: #000000 !important;
}

.text-red {
	color: #ff0000 !important;
}

.color-black {
	color: #000000 !important;
}

div.table-container * {
	color: #000000 !important; /* Ensure table text is black */
}
</style>
