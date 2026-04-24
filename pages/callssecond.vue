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
	{ key: "meno", label: "Meno" },
	{ key: "priezvisko", label: "Priezvisko" },
	{ key: "cislo", label: "Tel. číslo" },
	{ key: "email", label: "Email" },
	{ key: "odporucitel", label: "Odporúčiteľ" },
	{ key: "poznamka", label: "Poznámka" },
	{ key: "actions" },
	{ key: "checkbox", label: "", type: "checkbox" },
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
			click: () => router.push(`/contact/${row.id}`),
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
		if (person.first_event === 0) cssClass += "row-green ";
		if (person.last_activity && callListStore.singleCallList.created_at) {
			const lastActivityDate = new Date(person.last_activity);
			const callListCreatedDate = new Date(
				callListStore.singleCallList.created_at,
			);
			if (lastActivityDate < callListCreatedDate) cssClass += "row-yellow ";
			else if (lastActivityDate > callListCreatedDate) cssClass += "row-red ";
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
});

if (callListStore.selectedCallListPeople.length > 0) {
	people.value = decoratePeople(callListStore.selectedCallListPeople);
}

const ids_from_call_list = ref([]);

const getCallList = async (id) => {
	loadingState.value = true;
	callListStore.getCallListById(id);
	callListStore.setSelectedCallList(id);

	try {
		let contactIds;
		try {
			contactIds = JSON.parse(callListStore.singleCallList.contact_ids);
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
			},
		);

		if (callListResponse.data.contacts) {
			people.value = callListResponse.data.contacts.map((person) => {
				let cssClass = "";
				if (person.first_event === 0) cssClass += "row-green ";
				if (person.last_activity && callListStore.singleCallList.created_at) {
					const lastActivityDate = new Date(person.last_activity);
					const callListCreatedDate = new Date(
						callListStore.singleCallList.created_at,
					);
					if (lastActivityDate < callListCreatedDate) cssClass += "row-yellow ";
					else if (lastActivityDate > callListCreatedDate)
						cssClass += "row-red ";
				}
				return { ...person, class: cssClass.trim() };
			});
			callListStore.selectedCallListPeople = callListResponse.data.contacts;
		}
	} catch (error) {
		console.error("Error fetching contacts:", error);
	}
	loadingState.value = false;
};

const deleteCallList = async (id) => {
	const confirmed = window.confirm(
		"Ste si istý, že chete vymazat tento call list?",
	);
	if (!confirmed) return;
	await callListStore.deleteCallList(id);
	call_lists.value = callListStore.callLists;
};

const editingCallListId = ref(null);
const editingCallListName = ref("");

const startEditCallList = (callList, event) => {
	event.stopPropagation();
	editingCallListId.value = callList.id;
	editingCallListName.value = callList.name;
};

const cancelEditCallList = () => {
	editingCallListId.value = null;
	editingCallListName.value = "";
};

const saveCallListName = async (id) => {
	if (!editingCallListName.value.trim()) return;
	try {
		await axios.put(
			`${config.public.apiUrl}call-lists/${id}`,
			{ name: editingCallListName.value.trim() },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		const list = call_lists.value.find((l) => l.id === id);
		if (list) list.name = editingCallListName.value.trim();
		callListStore.callLists = [...call_lists.value];
	} catch (error) {
		console.error("Failed to update call list name:", error);
	}
	cancelEditCallList();
};
</script>

<template>
	<div class="page-layout">
		<loadigcomponent v-if="callListStore.loadingState" />
		<loadigcomponent v-if="loadingState" />

		<!-- Sidebar -->
		<aside class="sidebar">
			<div class="sidebar-header">
				<h2 class="sidebar-title">Call Listy</h2>
				<span class="sidebar-count">{{ call_lists.length }}</span>
			</div>

			<div class="sidebar-search">
				<CallsSearchBar
					@updateResults="updateResults"
					:call_lists="call_lists"
				/>
			</div>

			<nav class="sidebar-nav">
				<div
					v-for="call_list in call_lists"
					:key="call_list.id"
					:class="[
						'list-item',
						call_list.id === callListStore.selectedCallList
							? 'list-item--active'
							: '',
					]"
				>
					<!-- Edit mode -->
					<template v-if="editingCallListId === call_list.id">
						<input
							v-model="editingCallListName"
							class="list-edit-input"
							@keyup.enter="saveCallListName(call_list.id)"
							@keyup.escape="cancelEditCallList"
							@click.stop
							autofocus
						/>
						<div class="list-edit-actions">
							<button
								class="btn-icon btn-confirm"
								@click.stop="saveCallListName(call_list.id)"
								title="Uložiť"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							<button
								class="btn-icon btn-cancel"
								@click.stop="cancelEditCallList"
								title="Zrušiť"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</template>

					<!-- View mode -->
					<template v-else>
						<div
							class="list-item-indicator"
							:class="
								call_list.id === callListStore.selectedCallList
									? 'indicator--active'
									: ''
							"
						></div>
						<span class="list-item-name" @click="getCallList(call_list.id)">{{
							call_list.name
						}}</span>
						<div class="list-item-actions">
							<button
								class="btn-icon btn-edit"
								@click="startEditCallList(call_list, $event)"
								title="Premenovať"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
									/>
								</svg>
							</button>
							<button
								class="btn-icon btn-delete"
								@click.stop="deleteCallList(call_list.id)"
								title="Vymazať"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</template>
				</div>

				<div v-if="call_lists.length === 0" class="sidebar-empty">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					<span>Žiadne call listy</span>
				</div>
			</nav>
		</aside>

		<!-- Main content -->
		<main class="main-content">
			<!-- Header bar -->
			<div class="content-header">
				<div class="content-title">
					<h1 class="content-heading">
						{{ callListStore.singleCallList?.name || "Vyberte call list" }}
					</h1>
					<span v-if="people.length > 0" class="content-count"
						>{{ people.length }} kontaktov</span
					>
				</div>

				<div class="header-right">
					<!-- Legend tooltip -->
					<div
						class="legend-wrapper"
						@mouseenter="showDisclaimer = true"
						@mouseleave="showDisclaimer = false"
					>
						<button class="legend-btn">
							<Icon
								icon="material-symbols:info-outline-rounded"
								class="legend-icon"
							/>
						</button>
						<div v-if="showDisclaimer" class="legend-popup">
							<p class="legend-title">Farebné označenie</p>
							<div class="legend-item">
								<span class="legend-dot legend-dot--yellow"></span>
								<span>Posledná aktivita staršia ako vytvorenie call listu</span>
							</div>
							<div class="legend-item">
								<span class="legend-dot legend-dot--red"></span>
								<span>Posledná aktivita novšia ako vytvorenie call listu</span>
							</div>
							<div class="legend-item">
								<span class="legend-dot legend-dot--green"></span>
								<span>Žiadna aktivita</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Empty state -->
			<div v-if="people.length === 0" class="empty-state">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				<p>Vyberte call list zo zoznamu vľavo</p>
			</div>

			<!-- Table -->
			<div v-else class="table-wrapper">
				<UTable :rows="people" :columns="columns" class="calls-table">
					<template #name-data="{ row }">
						<span
							:class="
								selected.find((p) => p.id === row.id)
									? 'text-indigo-600 font-medium'
									: ''
							"
						>
							{{ row.name }}
						</span>
					</template>

					<template #poznamka-data="{ row }">
						<div v-if="row.poznamka" class="note-cell">
							<span class="note-truncate">{{ row.poznamka }}</span>
							<div class="note-tooltip">{{ row.poznamka }}</div>
						</div>
						<span v-else class="text-slate-400">—</span>
					</template>

					<template #actions-data="{ row }">
						<div class="row-actions">
							<button
								class="action-btn action-btn--primary"
								@click="detailView(row.id)"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
									<path
										fill-rule="evenodd"
										d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
										clip-rule="evenodd"
									/>
								</svg>
								Detail
							</button>
							<button
								class="action-btn action-btn--ghost"
								@click="findPerson(row.id)"
								title="Upraviť"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
									/>
								</svg>
							</button>
							<button
								class="action-btn action-btn--danger"
								@click="deletePerson(row.id, callListStore.selectedCallList)"
								title="Vymazať z listu"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							<input
								type="checkbox"
								class="row-checkbox"
								@change="toggleCheckbox(row.id)"
								:checked="!!selected.find((p) => p.id === row.id)"
							/>
						</div>
					</template>
				</UTable>
			</div>
		</main>

		<AlterPersonForm
			v-if="showAlterPesonForm"
			@cancelAlter="alterPerson()"
			@alterPerson="updatePerson"
			:single_contact="single_contact"
		/>
	</div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap");

:root {
	--page-bg: #f4f6fb;
	--sidebar-bg: #ffffff;
	--main-bg: #ffffff;
	--text-primary: #0f172a;
	--text-secondary: #64748b;
	--text-muted: #94a3b8;
	--border: #e2e8f0;
	--accent: #6366f1;
	--accent-light: #eef2ff;
	--accent-hover: #4f46e5;
	--danger: #ef4444;
	--danger-light: #fef2f2;
	--success: #10b981;
	--warning: #f59e0b;
	--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
	--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
	--radius: 14px;
	--radius-sm: 8px;
}

* {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

body {
	font-family: "DM Sans", sans-serif;
	background: var(--page-bg);
	color: var(--text-primary);
}

/* ─── Layout ─────────────────────────────────────────── */
.page-layout {
	display: flex;
	gap: 0;
	min-height: 100vh;
	padding: 16px;
	gap: 14px;
	background: var(--page-bg);
	overflow-x: hidden;
}

/* ─── Sidebar ─────────────────────────────────────────── */
.sidebar {
	width: 260px;
	min-width: 260px;
	background: var(--sidebar-bg);
	border-radius: var(--radius);
	box-shadow: var(--shadow-md);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	flex-shrink: 0;
}

.sidebar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 18px 12px;
	border-bottom: 1px solid var(--border);
}

.sidebar-title {
	font-size: 0.95rem;
	font-weight: 700;
	color: var(--text-primary);
	letter-spacing: -0.01em;
}

.sidebar-count {
	font-size: 0.72rem;
	font-weight: 600;
	background: var(--accent-light);
	color: var(--accent);
	padding: 2px 8px;
	border-radius: 20px;
}

.sidebar-search {
	padding: 12px 14px;
	border-bottom: 1px solid var(--border);
}

.sidebar-nav {
	flex: 1;
	overflow-y: auto;
	padding: 8px 10px;
	scrollbar-width: thin;
	scrollbar-color: var(--border) transparent;
}

.sidebar-nav::-webkit-scrollbar {
	width: 4px;
}
.sidebar-nav::-webkit-scrollbar-track {
	background: transparent;
}
.sidebar-nav::-webkit-scrollbar-thumb {
	background: var(--border);
	border-radius: 4px;
}

.sidebar-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 40px 16px;
	color: var(--text-muted);
	font-size: 0.8rem;
}

.sidebar-empty svg {
	width: 32px;
	height: 32px;
	opacity: 0.4;
}

/* ─── List Item ─────────────────────────────────────── */
.list-item {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 9px 10px;
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background 0.15s ease;
	margin-bottom: 2px;
}

.list-item:hover {
	background: #f8fafc;
}

.list-item--active {
	background: var(--accent-light);
}

.list-item-indicator {
	width: 3px;
	height: 16px;
	border-radius: 2px;
	background: var(--border);
	flex-shrink: 0;
	transition: background 0.15s;
}

.indicator--active {
	background: var(--accent);
}

.list-item-name {
	flex: 1;
	min-width: 0;
	font-size: 0.82rem;
	font-weight: 500;
	color: var(--text-primary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.list-item--active .list-item-name {
	color: var(--accent);
	font-weight: 600;
}

.list-item-actions {
	display: flex;
	gap: 2px;
	opacity: 0;
	transition: opacity 0.15s;
}

.list-item:hover .list-item-actions {
	opacity: 1;
}

.list-edit-input {
	flex: 1;
	min-width: 0;
	font-size: 0.8rem;
	font-family: "DM Sans", sans-serif;
	border: 1.5px solid var(--accent);
	border-radius: 6px;
	padding: 3px 8px;
	outline: none;
	color: var(--text-primary);
	background: white;
}

.list-edit-actions {
	display: flex;
	gap: 2px;
}

/* ─── Icon Buttons ────────────────────────────────── */
.btn-icon {
	width: 26px;
	height: 26px;
	border-radius: 6px;
	border: none;
	background: transparent;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.15s;
	padding: 0;
}

.btn-icon svg {
	width: 13px;
	height: 13px;
}

.btn-edit svg {
	color: var(--text-muted);
}
.btn-edit:hover {
	background: #f1f5f9;
}
.btn-edit:hover svg {
	color: var(--accent);
}

.btn-delete svg {
	color: var(--text-muted);
}
.btn-delete:hover {
	background: var(--danger-light);
}
.btn-delete:hover svg {
	color: var(--danger);
}

.btn-confirm svg {
	color: var(--success);
}
.btn-confirm:hover {
	background: #f0fdf4;
}

.btn-cancel svg {
	color: var(--text-muted);
}
.btn-cancel:hover {
	background: #f8fafc;
}

/* ─── Main Content ────────────────────────────────── */
.main-content {
	flex: 1;
	background: var(--main-bg);
	border-radius: var(--radius);
	box-shadow: var(--shadow-md);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	min-width: 0;
}

.content-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 24px 16px;
	border-bottom: 1px solid var(--border);
	flex-shrink: 0;
}

.content-title {
	display: flex;
	align-items: baseline;
	gap: 10px;
}

.content-heading {
	font-size: 1.05rem;
	font-weight: 700;
	color: var(--text-primary);
	letter-spacing: -0.02em;
}

.content-count {
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--text-muted);
}

.header-right {
	display: flex;
	align-items: center;
	gap: 10px;
}

/* ─── Legend ──────────────────────────────────────── */
.legend-wrapper {
	position: relative;
}

.legend-btn {
	width: 34px;
	height: 34px;
	border-radius: 8px;
	border: 1.5px solid var(--border);
	background: white;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		border-color 0.15s,
		background 0.15s;
}

.legend-btn:hover {
	border-color: var(--accent);
	background: var(--accent-light);
}

.legend-icon {
	font-size: 17px;
	color: var(--text-secondary);
}

.legend-popup {
	position: absolute;
	right: 0;
	top: calc(100% + 8px);
	background: white;
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 14px 16px;
	width: 290px;
	box-shadow: var(--shadow-md);
	z-index: 100;
}

.legend-title {
	font-size: 0.78rem;
	font-weight: 700;
	color: var(--text-primary);
	margin-bottom: 10px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 6px 0;
	font-size: 0.8rem;
	color: var(--text-secondary);
}

.legend-item + .legend-item {
	border-top: 1px solid #f1f5f9;
}

.legend-dot {
	width: 14px;
	height: 14px;
	border-radius: 4px;
	flex-shrink: 0;
}

.legend-dot--yellow {
	background: #fef08a;
	border: 1.5px solid #eab308;
}
.legend-dot--red {
	background: #fecaca;
	border: 1.5px solid #ef4444;
}
.legend-dot--green {
	background: #bbf7d0;
	border: 1.5px solid #22c55e;
}

/* ─── Table ───────────────────────────────────────── */
.table-wrapper {
	flex: 1;
	overflow: auto;
	padding: 0 8px 8px;
}

.calls-table {
	width: 100%;
}

/* Row colour classes — must beat UTable's own td backgrounds */
tr.row-green td {
	background-color: #bbf7d0 !important;
}
tr.row-yellow td {
	background-color: #fef08a !important;
}
tr.row-red td {
	background-color: #fecaca !important;
}

/* Generic hover — coloured overrides must come AFTER */
.calls-table tr:hover td {
	background-color: #f8fafc !important;
}

/* Coloured row hovers — declared after generic so they win */
tr.row-green:hover td {
	background-color: #86efac !important;
}
tr.row-yellow:hover td {
	background-color: #fde047 !important;
}
tr.row-red:hover td {
	background-color: #fca5a5 !important;
}

/* Table text always dark */
.calls-table td,
.calls-table th {
	color: var(--text-primary) !important;
	font-size: 0.82rem;
}

.calls-table th {
	font-weight: 600;
	color: var(--text-secondary) !important;
	text-transform: uppercase;
	font-size: 0.7rem;
	letter-spacing: 0.06em;
	padding-top: 12px;
	padding-bottom: 12px;
}

/* ─── Note Cell ───────────────────────────────────── */
.note-cell {
	position: relative;
	max-width: 180px;
}

.note-truncate {
	display: block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 0.8rem;
	color: var(--text-secondary);
}

.note-tooltip {
	display: none;
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 50;
	background: white;
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
	width: 260px;
	font-size: 0.8rem;
	color: var(--text-primary);
	box-shadow: var(--shadow-md);
	white-space: normal;
	line-height: 1.5;
}

.note-cell:hover .note-tooltip {
	display: block;
}

/* ─── Row Actions ─────────────────────────────────── */
.row-actions {
	display: flex;
	align-items: center;
	gap: 6px;
}

.action-btn {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 5px 10px;
	border-radius: 7px;
	font-size: 0.75rem;
	font-weight: 500;
	font-family: "DM Sans", sans-serif;
	border: none;
	cursor: pointer;
	transition: all 0.15s ease;
	white-space: nowrap;
}

.action-btn svg {
	width: 13px;
	height: 13px;
}

.action-btn--primary {
	background: var(--accent);
	color: white;
}
.action-btn--primary:hover {
	background: var(--accent-hover);
	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.action-btn--ghost {
	background: #f1f5f9;
	color: var(--text-secondary);
	padding: 0;
	width: 28px;
	height: 28px;
	justify-content: center;
}
.action-btn--ghost:hover {
	background: #e2e8f0;
	color: var(--text-primary);
}

.action-btn--danger {
	background: transparent;
	color: var(--text-muted);
	padding: 0;
	width: 28px;
	height: 28px;
	justify-content: center;
}
.action-btn--danger:hover {
	background: var(--danger-light);
	color: var(--danger);
}

/* ─── Checkbox ────────────────────────────────────── */
.row-checkbox {
	width: 15px;
	height: 15px;
	cursor: pointer;
	accent-color: var(--accent);
	margin-left: 4px;
}

/* ─── Empty State ─────────────────────────────────── */
.empty-state {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14px;
	color: var(--text-muted);
	font-size: 0.9rem;
}

.empty-state svg {
	width: 56px;
	height: 56px;
	opacity: 0.3;
}

/* ─── Responsive ──────────────────────────────────── */
@media (max-width: 768px) {
	.page-layout {
		flex-direction: column;
		overflow-x: hidden;
	}

	.sidebar {
		width: 100%;
		min-width: 100%;
		max-width: 100%;
		position: relative;
		left: 0;
		transform: none;
	}

	.main-content {
		width: 100%;
	}
}
</style>
