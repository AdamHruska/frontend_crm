<template>
	<loadigcomponent v-if="contactsStore.loadingState" />
	<!-- tu dat podmienku pre zobrazenie stranky -->
	<div v-if="isAdmin" class="mt-8">
		<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
			<SearchBarContactsAll @updateResults="handleSearchResults" />
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
							@click="deletePerson(row.id)"
							icon="i-heroicons-trash-20-solid"
							color="ffffff"
							class="shadow-xl text-red-500 hover:bg-gray-300"
						/>
					</div>
					<!-- <input
						type="checkbox"
						@change="toggleCheckbox(row.id)"
						:checked="isSelected(row.id)"
					/> -->
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

		<AlterPersonForm
			v-if="showAlterPesonForm"
			@cancelAlter="alterPerson()"
			@alterPerson="updatePerson"
			:single_contact="single_contact"
		/>
	</div>
	<div
		v-else
		class="text-2xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2"
	>
		Prístup má len administrátor
	</div>
</template>

<script setup>
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();
import { useRouter } from "vue-router";
const router = useRouter();

const people = computed(() => contactsStore.allContactsAdmin ?? []);

const showAlterPesonForm = ref(false);

const detailView = (id) => {
	router.push(`/contact/${id}`);
};

const detailViewNewTab = (id) => {
	window.open(`/contact/${id}`, "_blank");
};

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
	console.log(showAlterPesonForm.value);
}

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

onBeforeMount(() => {});

onMounted(async () => {
	await contactsStore.fetchAllContactsAdmin();
	console.log("All Contacts Admin:", contactsStore.allContactsAdmin);
});

const isAdmin = computed(() => {
	if (
		userStore.user &&
		userStore.user.first_name === "admin" &&
		userStore.user.last_name === "admin" &&
		userStore.user.email === "admin@admin.com"
	) {
		return true;
	} else {
		return false;
	}
});

const handleSearchResults = (results) => {
	// If results is an array (search results), update people
	if (Array.isArray(results)) {
		contactsStore.allContactsAdmin = results;

		// 	people.value = results.map((person) => {
		// 		let cssClass = "";
		// 		if (person.first_event === 0) {
		// 			cssClass += "bg-green-200 ";
		// 		}
		// 		if (person.only_called_never_answered === 1) {
		// 			cssClass += "bg-orange-200 ";
		// 		}
		// 		return {
		// 			...person,
		// 			class: cssClass.trim(),
		// 		};
		// 	});
		// }
		// // If results is paginated data (from store), use the data property
		// else if (results && results.data) {
		// 	people.value = results.data.map((person) => {
		// 		let cssClass = "";
		// 		if (person.first_event === 0) {
		// 			cssClass += "bg-green-200 ";
		// 		}
		// 		if (person.only_called_never_answered === 1) {
		// 			cssClass += "bg-orange-200 ";
		// 		}
		// 		return {
		// 			...person,
		// 			class: cssClass.trim(),
		// 		};
		// 	});
	}
};

const single_contact = ref(null);

const findPerson = async (id) => {
	try {
		// First, try to find the contact in the local store
		const contactFromStore = contactsStore.allContactsAdmin.find(
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
	await contactsStore.deleteContactAdmin(id);
};
</script>
