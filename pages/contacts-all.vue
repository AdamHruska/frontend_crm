<template>
	<loadigcomponent v-if="contactsStore.loadingState" />
	<!-- tu dat podmienku pre zobrazenie stranky -->
	<div v-if="isAdmin" class="mt-8">
		<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
			<SearchBarContactsAll @updateResults="handleSearchResults" />
		</div>

		<button
			@click="toggleDeletedContacts"
			class="px-4 py-2 bg-blue-500 rounded-md absolute right-6 hover:bg-blue-400 text-white cursor-pointer hover:scale-105 transition-transform"
		>
			{{ showDeletedOnly ? "Všetky kontakty" : "Vymazané kontakty" }}
		</button>

		<div class="float-right relative">
			<Icon
				icon="material-symbols:chat-info-outline"
				class="absolute top-[-40px] right-12 scale-[2] hover:scale-[2.5] cursor-pointer transition-transform"
				@mouseenter="showDisclaimer = true"
				@mouseleave="showDisclaimer = false"
			/>
			<div
				class="bg-white rounded-md shadow-md w-[300px] h-[250px] absolute right-8 top-[-10px] z-[50] py-3 px-4"
				id="disclaimer"
				v-if="showDisclaimer"
			>
				<!-- Colour -->
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-gray-300"></div>
					<div>- Kontakt bol odstránený</div>
				</div>
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-red-400"></div>
					<div>- Random Text</div>
				</div>
			</div>
		</div>
		<UTable
			:rows="people"
			:columns="columns"
			class="mx-6 table-container shadow-md rounded-md mt-8"
			:row-class="(row) => row.class"
		>
			<template #actions-data="{ row }">
				<div class="flex justify-between">
					<div class="flex space-x-4">
						<UButton
							@click.left="detailView(row.id)"
							@auxclick.prevent="onAuxClick($event, row.id)"
							@mousedown="handleMouseDown"
							class="bg-blue-500 text-white shadow-xl hover:scale-110 transition-transform"
							label="Show Details"
						/>
						<UTooltip
							text="Editovať kontakt"
							:ui="{ background: '!bg-white', color: '' }"
							class=""
						>
							<UButton
								@click="findPerson(row.id)"
								icon="i-heroicons-pencil-square-20-solid"
								variant="ghost"
								class="shadow-xl hover:bg-gray-100 hover:scale-110 transition-transform"
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
								class="shadow-xl text-red-500 hover:bg-gray-100 hover:scale-110 transition-transform"
							/>
						</UTooltip>

						<UTooltip
							text="Obnoviť používateľa"
							:ui="{
								base: '!bg-white !text-gray-900',
								background: '!bg-white',

								shadow: 'shadow-lg',
							}"
							v-if="row.hidden === 1"
						>
							<UButton
								@click="restoreContact(row.id)"
								icon="typcn:media-play-reverse-outline"
								color="ffffff"
								class="shadow-xl hover:bg-gray-100 hover:scale-110 transition-transform"
							/>
						</UTooltip>
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

const showDisclaimer = ref(false);

const people = computed(() => {
	const contacts = contactsStore.allContactsAdmin ?? [];
	return contacts
		.filter((contact) => !showDeletedOnly.value || contact.hidden === 1)
		.map((contact) => ({
			...contact,
			class: contact.hidden === 1 ? "bg-gray-300" : "",
		}));
});

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

const showDeletedOnly = ref(false);
const toggleDeletedContacts = () => {
	showDeletedOnly.value = !showDeletedOnly.value;
};

const restoreContact = async (id) => {
	await contactsStore.restoreContactAdmin(id);
};
</script>
