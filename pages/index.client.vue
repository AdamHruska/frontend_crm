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

const callList = ref(false);
const callListName = ref("");
const user_id = ref("");

const callListNames = ref([]);

const showDisclaimer = ref(false);

const filterWrongNumbers = ref(false);

// --- Load More state ---
const CHUNK = 50;
const allFilteredResults = ref([]);
const displayedCount = ref(CHUNK);
const hasMoreResults = ref(false);
// For wrong_number backend pagination
const wrongNumberPage = ref(1);
const wrongNumberLastPage = ref(1);

const mapWithClass = (person) => {
	let cssClass = "";
	if (person.first_event === 0) cssClass += "bg-green-200 ";
	if (person.only_called_never_answered === 1) cssClass += "bg-blue-200 ";
	if (person.wrong_number === 1) cssClass += "bg-orange-300 ";
	return { ...person, class: cssClass.trim() };
};

const fetchWrongNumberContacts = async (query = "", pageNum = 1) => {
	const response = await axios.get(
		`${config.public.apiUrl}search-bad-phone-contacts`,
		{
			params: { query, page: pageNum },
			headers: { Authorization: `Bearer ${authStore.token}` },
		},
	);

	const data = response.data.contacts;
	contactsStore.contacts = data;

	const newItems = data.data.map((person) => ({
		...person,
		class: "bg-orange-300",
	}));

	if (pageNum === 1) {
		people.value = newItems;
	} else {
		people.value = [...people.value, ...newItems];
	}

	wrongNumberPage.value = data.current_page;
	wrongNumberLastPage.value = data.last_page;
	hasMoreResults.value = data.current_page < data.last_page;
	page.value = data.current_page;
};

const toggleWrongNumberFilter = async () => {
	contactsStore.loadingState = true;
	filterWrongNumbers.value = !filterWrongNumbers.value;

	if (filterWrongNumbers.value) {
		contactsStore.searchQuery = "";
		wrongNumberPage.value = 1;
		await fetchWrongNumberContacts("", 1);
	} else {
		contactsStore.searchQuery = "";
		await contactsStore.fetchContacts();
		people.value = contactsStore.contacts.data.map(mapWithClass);
		page.value = contactsStore.contacts.current_page;
		hasMoreResults.value = false;
	}

	contactsStore.loadingState = false;
};

const applyLocalFilter = (filterFn) => {
	allFilteredResults.value = contactsStore.contacts.data
		.filter(filterFn)
		.map(mapWithClass);
	displayedCount.value = CHUNK;
	people.value = allFilteredResults.value.slice(0, CHUNK);
	hasMoreResults.value = allFilteredResults.value.length > CHUNK;
};

const filterNeverAnswered = ref(false);

const fetchNeverAnsweredContacts = async (filterType = null) => {
	await contactsStore.fetchContacts({
		filter: "never_answered",
	});

	applyLocalFilter((person) => {
		if (person.only_called_never_answered !== 1) return false;
		if (filterType === "clients")
			return person.isContact == 1 && person.isCoWorker == 0;
		if (filterType === "coworkers")
			return person.isCoWorker == 1 && person.isContact == 0;
		return true;
	});
};

const filterContacts = () => {
	applyLocalFilter(
		(person) => person.isContact === 1 && person.isCoWorker === 0,
	);
};

const filterCoworkers = () => {
	applyLocalFilter(
		(person) => person.isCoWorker === 1 && person.isContact === 0,
	);
};

const fetchNeverCalledContacts = async (filterType = null) => {
	await contactsStore.fetchContacts();

	applyLocalFilter((person) => {
		if (person.first_event !== 0 || person.isNew !== 1) return false;
		if (filterType === "clients")
			return person.isContact == 1 && person.isCoWorker == 0;
		if (filterType === "coworkers")
			return person.isCoWorker == 1 && person.isContact == 0;
		return true;
	});
};

// Load more handler — called by the "Load more" button
const loadMore = async () => {
	if (!hasMoreResults.value) return;

	// wrong_number uses backend pagination
	if (activeFilter.value === "wrong_number") {
		contactsStore.loadingState = true;
		await fetchWrongNumberContacts(
			contactsStore.searchQuery || "",
			wrongNumberPage.value + 1,
		);
		contactsStore.loadingState = false;
		return;
	}

	// All other filters are local — just reveal next chunk
	const next = displayedCount.value + CHUNK;
	people.value = allFilteredResults.value.slice(0, next);
	displayedCount.value = next;
	hasMoreResults.value = next < allFilteredResults.value.length;
};

const toggleCallList = async () => {
	if (selected.value.length > 0) {
		cancleCallListForm();
	}
};

const toggleCheckbox = (id) => {
	const person = people.value.find((p) => p.id === id);
	if (person) {
		const index = selected.value.findIndex((p) => p.id === id);
		if (index === -1) {
			selected.value.push(person);
			contactsStore.selectedContacts.push(person);
		} else {
			selected.value.splice(index, 1);
			contactsStore.selectedContacts.splice(index, 1);
		}
	}
};

const isSelected = (id) => {
	return contactsStore.selectedContacts.some((person) => person.id === id);
};

function addPerson(addedPeople) {
	showAddPersonForm.value = !showAddPersonForm.value;

	if (addedPeople) {
		contactsStore.addToContactsStore(addedPeople);
		people.value = contactsStore.contacts.data.map(mapWithClass);
	}
}

function alterPerson() {
	showAlterPesonForm.value = !showAlterPesonForm.value;
}

const findPerson = async (id) => {
	try {
		const contactFromStore = contactsStore.contacts.data.find(
			(contact) => contact.id === id,
		);

		if (contactFromStore) {
			single_contact.value = { ...contactFromStore };
		} else {
			const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
				headers: {
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			});
			single_contact.value = response.data.contact;
		}

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

onUnmounted(() => {
	document.removeEventListener("click", closeMenuOnOutsideClick);
});

onMounted(async () => {
	document.addEventListener("click", closeMenuOnOutsideClick);
	try {
		if (contactsStore.contacts.length === 0) {
			await contactsStore.fetchContacts();
		}

		people.value = contactsStore.contacts.data.map(mapWithClass);
	} catch (error) {
		console.error("Error:", error);
	}

	try {
		await userStore.fetchUser();
		user_id.value = userStore.user.id;
	} catch (error) {
		console.error("Error:", error);
	}

	callListNames.value = await axios.get(`${config.public.apiUrl}call-lists`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});

	callListNames.value = callListNames.value.data;
});

const handleSearchResults = async (results) => {
	if (filterWrongNumbers.value) {
		await fetchWrongNumberContacts(contactsStore.searchQuery);
		return;
	}

	if (Array.isArray(results)) {
		contactsStore.contacts = { ...contactsStore.contacts, data: results };
		people.value = results.map(mapWithClass);
	} else if (results && results.data) {
		people.value = results.data.map(mapWithClass);
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
		event.preventDefault();
		detailViewNewTab(id);
	}
};

const columns = [
	{ key: "meno", label: "Meno", class: "w-[140px]" },
	{ key: "priezvisko", label: "Priezvisko", class: "w-[160px]" },
	{ key: "cislo", label: "tel. číslo", class: "w-[140px]" },
	{ key: "odporucitel", label: "Odporucitel", class: "w-[160px]" },
	{ key: "poznamka", label: "Poznámka", class: "w-[400px]" },
	{ key: "actions", class: "w-[260px]" },
	{ key: "checkbox", label: "", type: "checkbox", class: "w-[60px]" },
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

const nextPage = async () => {
	await contactsStore.nextPage();
	page.value = contactsStore.contacts.current_page;
	people.value = contactsStore.contacts.data.map(mapWithClass);
};

const updatePerson = async (updatedContact) => {
	try {
		await contactsStore.updatePerson(updatedContact);

		const index = people.value.findIndex(
			(person) => person.id === updatedContact.id,
		);

		if (index !== -1) {
			people.value[index] = { ...updatedContact };
		}

		showAlterPesonForm.value = false;
	} catch (error) {
		console.error("Error updating contact:", error);
		alert(`Failed to update contact: ${error.message}`);
	}
};

const uncheckAll = () => {
	selected.value = [];
	const checkboxes = document.querySelectorAll('input[type="checkbox"]');
	checkboxes.forEach((checkbox) => {
		checkbox.checked = false;
	});
	contactsStore.selectedContacts = [];
};

const showCallListForm = ref(false);

const cancleCallListForm = (status) => {
	showCallListForm.value = !showCallListForm.value;
	if (status === 201 || status === 200) {
		// alert("Call list created successfully");
	}
};

const totalPages = computed(() => contactsStore.contacts.last_page || 1);

const goToPage = async (pageNum) => {
	await contactsStore.goToPage(pageNum);
	page.value = contactsStore.contacts.current_page;
	people.value = contactsStore.contacts.data.map(mapWithClass);
};

const pageNumbers = computed(() => {
	const total = totalPages.value;
	const current = contactsStore.page;
	const delta = 2;

	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	let range = [];
	range.push(1);

	const rangeStart = Math.max(2, current - delta);
	const rangeEnd = Math.min(total - 1, current + delta);

	if (rangeStart > 2) range.push("...");
	for (let i = rangeStart; i <= rangeEnd; i++) range.push(i);
	if (rangeEnd < total - 1) range.push("...");
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
			headers: { Authorization: `Bearer ${authStore.token}` },
		});
		callListNames.value = response.data;
	} catch (error) {
		console.error("Error fetching call lists:", error);
	}
};

const showDelegateForm = ref(false);
const showShareContacts = ref(false);
const showFilterModal = ref(false);
const activeFilter = ref(null);

function toggleShowFilterModal() {
	showFilterModal.value = !showFilterModal.value;
}

const currentFilter = ref(null);

const selectFilter = async (filter) => {
	if (activeFilter.value === filter || filter === "none") {
		currentFilter.value = null;
		activeFilter.value = null;
		contactsStore.searchQuery = "";
		hasMoreResults.value = false;
		allFilteredResults.value = [];
		filterWrongNumbers.value = false;
		await contactsStore.fetchContacts();
		people.value = contactsStore.contacts.data.map(mapWithClass);
		page.value = contactsStore.contacts.current_page;
	} else {
		activeFilter.value = filter;

		if (filter === "wrong_number") {
			currentFilter.value = "Zlé telefónne číslo";
			filterWrongNumbers.value = false; // reset so toggleWrongNumberFilter turns it on
			await toggleWrongNumberFilter();
		}
		if (filter === "never_answered_clients") {
			contactsStore.searchQuery = "";
			currentFilter.value = "Nikdy nezdvihli - klienti";
			await fetchNeverAnsweredContacts("clients");
		}
		if (filter === "never_answered_coworkers") {
			contactsStore.searchQuery = "";
			currentFilter.value = "Nikdy nezdvihli - kolegovia";
			await fetchNeverAnsweredContacts("coworkers");
		}
		if (filter === "never_called_clients") {
			contactsStore.searchQuery = "";
			currentFilter.value = "Nikdy nevolané - klienti";
			await fetchNeverCalledContacts("clients");
		}
		if (filter === "never_called_coworkers") {
			contactsStore.searchQuery = "";
			currentFilter.value = "Nikdy nevolané - kolegovia";
			await fetchNeverCalledContacts("coworkers");
		}
		if (filter === "clients") {
			contactsStore.searchQuery = "";
			currentFilter.value = "Zobrazit všetkých klientov";
			await filterContacts();
		}
		if (filter === "Kolegovia") {
			contactsStore.searchQuery = "";
			currentFilter.value = "Zobrazit všetkých kolegov";
			await filterCoworkers();
		}

		toggleShowFilterModal();
	}
};

const filterNeverCalled = ref(false);

const syncingAll = ref(false);
const deletingAll = ref(false);
const syncStats = ref(null);

const syncAllToGoogle = async () => {
	if (
		!confirm("Synchronizovať všetky kontakty do Google? Môže to chvíľu trvať.")
	)
		return;
	syncingAll.value = true;
	syncStats.value = null;
	try {
		const res = await axios.post(
			`${config.public.apiUrl}google/contacts/sync-all`,
			{ userId: user_id.value },
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		syncStats.value = res.data;
		toast.success(
			`✅ Synchronizovaných ${res.data.synced}/${res.data.total} kontaktov`,
			{ position: "top-right", timeout: 5000 },
		);
	} catch (error) {
		toast.error(error.response?.data?.error ?? "Chyba pri synchronizácii", {
			position: "top-right",
			timeout: 5000,
		});
	} finally {
		syncingAll.value = false;
	}
};

const deleteAllFromGoogle = async () => {
	if (
		!confirm(
			"Naozaj chcete vymazať VŠETKY kontakty z Google Contacts? Táto akcia je nevratná.",
		)
	)
		return;
	deletingAll.value = true;
	try {
		const res = await axios.delete(
			`${config.public.apiUrl}google/contacts/delete-all`,
			{
				data: { userId: user_id.value },
				headers: { Authorization: `Bearer ${authStore.token}` },
			},
		);
		toast.success(`🗑️ Vymazaných ${res.data.deleted} kontaktov z Google`, {
			position: "top-right",
			timeout: 5000,
		});
	} catch (error) {
		toast.error(error.response?.data?.error ?? "Chyba pri mazaní", {
			position: "top-right",
			timeout: 5000,
		});
	} finally {
		deletingAll.value = false;
	}
};

const showMenuModal = ref(false);

const closeMenuOnOutsideClick = (e) => {
	if (!e.target.closest(".menu-dropdown-wrapper")) {
		showMenuModal.value = false;
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
			<div class="w-[650px] ml-8 mt-8 mb-2 flex gap-2 items-center">
				<searchBar @updateResults="handleSearchResults" class="w-[70%]" />
				<ContactImportComponent />
			</div>

			<div class="flex items-center mb-2">
				<Icon
					v-if="activeFilter !== null"
					@click="selectFilter('none')"
					icon="material-symbols:close"
					style="font-size: 36px"
					class="text-red mt-7 mr-4 cursor-pointer hover:scale-110"
				/>

				<div class="font-semibold text-md mt-7 mr-4">
					{{ currentFilter }}
				</div>

				<div class="relative menu-dropdown-wrapper">
					<UTooltip
						text="Možnosti"
						class="cursor-pointer flex items-center justify-center w-11 h-11 rounded-lg shadow-xl mr-4 mt-8 bg-gray-300 hover:bg-gray-400"
					>
						<Icon
							@click="showMenuModal = !showMenuModal"
							icon="material-symbols:more-vert"
							style="font-size: 36px"
							class="text-white"
						/>
					</UTooltip>

					<div
						v-if="showMenuModal"
						class="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-zinc-100 shadow-lg p-2 z-50 flex flex-col gap-1"
					>
						<!-- Save to phone -->
						<div
							@click="
								syncAllToGoogle();
								showMenuModal = false;
							"
							class="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg cursor-pointer font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all"
						>
							Uložiť kontakty do telefónu
						</div>

						<hr class="border-zinc-100" />

						<!-- Delete -->
						<div
							@click="
								deleteAllFromGoogle();
								showMenuModal = false;
							"
							class="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg cursor-pointer font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 hover:text-red-600 transition-all"
						>
							🗑️ Vymazať kontakty z telefónu
						</div>

						<hr class="border-zinc-100" />

						<!-- Import -->
						<ContactImportComponent />

						<hr class="border-zinc-100" />

						<!-- Show selected -->
						<div
							@click="
								showSelectedContacts();
								showMenuModal = false;
							"
							class="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg cursor-pointer font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-800 transition-all"
						>
							Zobraziť zakliknuté kontakty
						</div>
					</div>
				</div>

				<div class="relative">
					<UTooltip
						text="Filtrovanie"
						class="cursor-pointer flex items-center justify-center w-11 h-11 rounded-lg shadow-xl mr-4 mt-8 bg-gray-300 hover:bg-gray-400"
					>
						<Icon
							@click="toggleShowFilterModal"
							icon="material-symbols:filter-alt"
							style="font-size: 36px"
							class="text-white"
						/>
					</UTooltip>

					<div
						v-if="showFilterModal"
						class="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-lg border p-3 z-50"
					>
						<p class="text-sm font-semibold mb-2 px-1">Filter</p>

						<div
							@click="selectFilter('never_called_clients')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'never_called_clients'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Nikdy nevolané čísla klienti
						</div>

						<div
							@click="selectFilter('never_called_coworkers')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'never_called_coworkers'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Nikdy nevolané čísla spolupracovníci
						</div>

						<div
							@click="selectFilter('never_answered_clients')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'never_answered_clients'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Nikdy nezdvihli klienti
						</div>

						<div
							@click="selectFilter('never_answered_coworkers')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'never_answered_coworkers'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Nikdy nezdvihli spolupracovníci
						</div>

						<div
							@click="selectFilter('wrong_number')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'wrong_number'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Zlé telefónne číslo
						</div>

						<div
							@click="selectFilter('clients')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'clients'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Zobraziť všetky kontakty na klientov
						</div>

						<div
							@click="selectFilter('Kolegovia')"
							:class="[
								'flex items-center gap-2 text-sm py-1.5 px-1 cursor-pointer rounded-md',
								activeFilter === 'Kolegovia'
									? 'bg-slate-200'
									: 'hover:bg-slate-200',
							]"
						>
							Zobraziť všetky kontakty na spolupracovníkov
						</div>
					</div>
				</div>

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
			<button
				v-if="contactsStore.selectedContacts.length > 0"
				@click="uncheckAll"
				class="px-3 py-1 bg-red-500 hover:bg-red-700 rounded-lg text-white shadow-xl"
			>
				Zrušiť výber {{ contactsStore.selectedContacts.length }}
			</button>
			<button
				v-if="contactsStore.selectedContacts.length > 0"
				@click="toggleCallList"
				class="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white ml-4 shadow-xl"
			>
				Vytvoriť Call List
			</button>

			<button
				v-if="contactsStore.selectedContacts.length > 0"
				@click="showDelegateForm = !showDelegateForm"
				class="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white ml-4 shadow-xl"
			>
				Odovzdať kontakty
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

	<UTable
		:rows="people"
		:columns="columns"
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
							@click="
								deletePerson(row.id).then(() => {
									people.value = people.value.filter(
										(person) => person.id !== row.id,
									);
								})
							"
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

	<!-- Load More button (only when a filter is active and there are more results) -->
	<div
		v-if="activeFilter !== null && hasMoreResults"
		class="flex justify-center mt-6 mb-4"
	>
		<button
			@click="loadMore"
			:disabled="contactsStore.loadingState"
			class="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg shadow-md"
		>
			<span v-if="contactsStore.loadingState">Načítavam...</span>
			<span v-else>Načítať viac</span>
		</button>
	</div>

	<!-- No more results message (filter active, all shown) -->
	<div
		v-if="activeFilter !== null && !hasMoreResults && people.length > 0"
		class="flex justify-center mt-4 mb-4 text-sm text-gray-400"
	>
		Všetky výsledky sú zobrazené
	</div>

	<!-- Normal pagination (only when no filter is active) -->
	<div
		class="flex justify-center items-center gap-2 mt-[30px] mb-[50px]"
		v-if="!contactsStore.searchQuery && activeFilter === null"
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
