<script setup>
const config = useRuntimeConfig();

import { useContactsStore } from "#imports";
const contactsStore = useContactsStore();

import { useUserStore } from "#imports";
const userStore = useUserStore();

import axios from "axios";
import { format } from "date-fns";

import { useRoute } from "vue-router";

import { useTodosStore } from "../stores/todoStore";
const todoStore = useTodosStore();

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

import { useToast } from "vue-toastification";
const toast = useToast();

const { id } = useRoute().params;
const people = ref([]);
const AddActivityBool = ref(false);

const activities = ref([]);

const author_id = ref(null);
const user_id = ref(null);

const showWrongNumberButton = ref(true);

const changeAddActivityBool = () => {
	AddActivityBool.value = !AddActivityBool.value;
};

const showShareContactsForm = ref(false);

const openShareContactsForm = () => {
	showShareContactsForm.value = true;
};

const closeShareContactsForm = () => {
	showShareContactsForm.value = false;
};

const activities_todo = computed(() => {
	return (todoStore.todosHistory || [])
		.filter((todo) => todo.contact_id == id)
		.map((todo) => ({
			id: todo.id,
			activity: todo.activity_name,
			dueDate: todo.due_date
				? todo.due_date.split("+")[0].replace("T", " ").slice(0, -3)
				: "",
			updated_at:
				todo.is_completed && todo.updated_at
					? todo.updated_at.split("+")[0].replace("T", " ").slice(0, -3)
					: null,
			completed: todo.is_completed,
		}));
});

const delegatedUser = computed(() => {
	const user = userStore.allUsers.find(
		(user) => user.id == people.value[0]?.author_id,
	);
	return user ? `${user.first_name} ${user.last_name}` : "";
});

// ── Actions dropdown ──
const actionsMenuOpen = ref(false);

const closeMenuOnOutsideClick = (e) => {
	if (!e.target.closest(".menu-dropdown-wrapper")) {
		actionsMenuOpen.value = false;
	}
};

onMounted(async () => {
	document.addEventListener("click", closeMenuOnOutsideClick);
	console.log("users", userStore.allUsers);
});

onUnmounted(() => {
	document.removeEventListener("click", closeMenuOnOutsideClick);
});

const callListNames = ref([]);
const sharedId = ref(null);

const sharedAuthorName = computed(() => {
	sharedId.value = people.value[0]?.shared_author;
	if (!sharedId.value) return "";
	const user = userStore.allUsersAdmin.find((u) => u.id === sharedId.value);
	return user ? `${user.first_name} ${user.last_name}` : "";
});

onBeforeMount(async () => {
	await userStore.fetchAllUsersAdmin();
	contactsStore.lastShowenDetails = id;
	const person = await findPerson(id);
	console.log("Person details:", person);
	await findActivities(id);
	await todoStore.fetchTodosHistory();
	activities_todo.value = todoStore.todosHistory
		.filter((todo) => todo.contact_id == id)
		.map((todo) => ({
			id: todo.id,
			activity: todo.activity_name,
			dueDate: todo.due_date.split("+")[0].replace("T", " ").slice(0, -3),
			updated_at: todo.is_completed
				? todo.updated_at.split("+")[0].replace("T", " ").slice(0, -3)
				: null,
			completed: todo.is_completed,
		}));
	console.log("Activities todo:", activities_todo.value);
	const user = await getUser();
	user_id.value = user.id;

	callListNames.value = await axios.get(`${config.public.apiUrl}call-lists`, {
		headers: { Authorization: `Bearer ${authStore.token}` },
	});
	callListNames.value = callListNames.value.data;
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: { Authorization: `Bearer ${authStore.token}` },
		});
		if (response.data && response.data.contact) {
			people.value = [response.data.contact];
			showWrongNumberButton.value = response.data.contact.wrong_number == 0;
		}
		author_id.value = response.data.contact.author_id;
	} catch (error) {
		console.error("Error fetching contact:", error);
	}
};

const findActivities = async (id) => {
	const response = await axios.get(
		`${config.public.apiUrl}contacts/${id}/activities`,
		{ headers: { Authorization: `Bearer ${authStore.token}` } },
	);
	activities.value = response.data.activities;
};

const getUser = async () => {
	const response = await axios.get(`${config.public.apiUrl}get-user`, {
		headers: { Authorization: `Bearer ${authStore.token}` },
	});
	return response.data.user;
};

const actityFormBool = ref(false);
const activityID = ref(null);

const alterActivity = (id) => {
	activityID.value = id;
	actityFormBool.value = !actityFormBool.value;
};

const addActivityToList = (activity) => {
	activities.value.push(activity);
};

const deleteContact = async (id) => {
	contactsStore.deleteContact(id);
};

const columns_first_row = [
	{ key: "meno", label: "Meno" },
	{ key: "priezvisko", label: "Priezvisko" },
	{ key: "cislo", label: "Tel. číslo" },
	{ key: "email", label: "Email" },
	{ key: "odporucitel", label: "Odporúčateľ" },
];

const columns_second_row = [
	{ key: "created_at", label: "Dátum pridania" },
	{ key: "adresa", label: "Adresa" },
	{ key: "rok_narodenia", label: "Vek" },
	{ key: "zamestanie", label: "Zamestnanie" },
	{ key: "actions" },
];

const items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => showAlterPersonForm(),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () => deleteContact(row.id).then(navigateTo("/")),
		},
	],
];

const columns_activity = ref([
	{ key: "aktivita", label: "Aktivita" },
	{ key: "datumCas", label: "Začiatok" },
	{ key: "koniec", label: "Koniec" },
	{ key: "poznamka", label: "Poznámka" },
	{ key: "volane", label: "Volané" },
	{ key: "dovolane", label: "Dovolané" },
	{ key: "dohodnute", label: "Dohodnuté" },
	{ key: "letters", label: "Vyhodnotenie" },
	{ key: "created_at", label: "Vytvorené" },
	{ key: "miesto_stretnutia", label: "Miesto" },
	{ key: "actions" },
]);

const activity_items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => alterActivity(row.id),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () =>
				axios
					.delete(`${config.public.apiUrl}delete-activities/${row.id}`, {
						headers: { Authorization: `Bearer ${authStore.token}` },
					})
					.then(() => {
						activities.value = activities.value.filter(
							(activity) => activity.id !== row.id,
						);
					}),
		},
	],
];

const handleActivityRowClick = (row) => {
	console.log("Activity row clicked:", row);
};

const formatDate = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy");
};

const formatDateTime = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy HH:mm");
};

function calculateAge(yearOfBirth) {
	const currentYear = new Date().getFullYear();
	const age = currentYear - yearOfBirth;
	if (age === 0 || age === currentYear) return "N/A";
	return age;
}

const showAlterPesonForm = ref(false);

const showAlterPersonForm = () => {
	showAlterPesonForm.value = !showAlterPesonForm.value;
};

const updatePerson = async (updatedContact) => {
	try {
		if (people.value.length > 0) {
			people.value = [{ ...people.value[0], ...updatedContact }];
		} else {
			people.value = [updatedContact];
		}
		showAlterPesonForm.value = false;
		try {
			const completeContact = { ...people.value[0] };
			await contactsStore.updatePerson(completeContact);
		} catch (storeError) {
			console.warn("Failed to update contact in store:", storeError);
		}
	} catch (error) {
		console.error("Error updating contact:", error);
		alert(`Failed to update contact: ${error.message}`);
	}
};

const columns_todo = [
	{ key: "dueDate", label: "Termín" },
	{ key: "activity", label: "Aktivita" },
	{ key: "completed", label: "Status" },
	{ key: "updated_at", label: "Dokončené" },
	{ key: "actions" },
];

const todo_items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => changeupdateTodoBool(row),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () => todoStore.deleteTodo(row.id),
		},
	],
];

const todoBool = ref(false);
const changeToDoBool = () => {
	todoBool.value = !todoBool.value;
};

const updateTodoBool = ref(false);
const todoToUpdate = ref({});
const changeupdateTodoBool = (row) => {
	updateTodoBool.value = !updateTodoBool.value;
	todoToUpdate.value = row;
};

function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

const callListBool = ref(false);
const changeCallListBool = () => {
	callListBool.value = !callListBool.value;
};

const pendingFirstMeetingRow = ref(null);
const currentActivity = ref(null);

const selectedActivityId = ref(null);

const changeActivityStatus = async (row, status) => {
	const originalStatus = row.activity_status;
	try {
		if (row.aktivita === "Prvé stretnutie" && status === "check") {
			changeConfirmEventModal();
			pendingFirstMeetingRow.value = row;
			return;
		}
		if (status === "discarded") {
			currentActivity.value = row;
			changeDiscardActivityModal();
		}
		if (
			(row.aktivita === "Analýza osobných financí" && status === "check") ||
			(row.aktivita === "Servisná analýza" && status === "check")
		) {
			selectedActivityId.value = row.id;
			console.log(
				"Selected activity ID for new names:",
				selectedActivityId.value,
			);
			changeShowNewNamesModal();
		}
		row.activity_status = status;
		await axios.patch(
			`${config.public.apiUrl}activities/${row.id}/status`,
			{ activity_status: status },
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
	} catch (error) {
		row.activity_status = originalStatus;
		console.error("Error updating activity status:", error);
	}
};

const handleConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			pendingFirstMeetingRow.value.activity_status = "check";
			await addFinancialAnalysisActivity(
				pendingFirstMeetingRow.value.contact_id,
				pendingFirstMeetingRow.value.koniec,
			);
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{ activity_status: "check" },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			await findActivities(id);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
	} finally {
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

const handleCloseConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			pendingFirstMeetingRow.value.activity_status = "check";
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{ activity_status: "check" },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			await findActivities(id);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
	} finally {
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

async function addFinancialAnalysisActivity(contactId, dateTimeStart) {
	try {
		const startTime = new Date(dateTimeStart);
		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
		const dateTimeEnd = endTime
			.toISOString()
			.replace("T", " ")
			.substring(0, 19);
		const response = await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: contactId,
				aktivita: "Analýza osobných financí",
				datumCas: dateTimeStart,
				koniec: dateTimeEnd,
				volane: null,
				dovozene: null,
				dohodnute: null,
				online_meeting: false,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		activities.value.push(response.data.activity);
		return response.data;
	} catch (error) {
		console.error(
			"Error creating activity:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

const showConfirmEvent = ref(false);
const changeConfirmEventModal = () => {
	showConfirmEvent.value = !showConfirmEvent.value;
};

const showDiscardActivityModal = ref(false);
const changeDiscardActivityModal = () => {
	showDiscardActivityModal.value = !showDiscardActivityModal.value;
};

const showNewNamesModal = ref(false);
const changeShowNewNamesModal = () => {
	showNewNamesModal.value = !showNewNamesModal.value;
};

const handleActivityUpdate = (updatedActivity) => {
	const index = activities.value.findIndex((a) => a.id === updatedActivity.id);
	if (index !== -1) {
		activities.value[index] = {
			...activities.value[index],
			...updatedActivity,
		};
	}
	showDiscardActivityModal.value = false;
};

const setWrongNumber = async () => {
	try {
		await axios.patch(
			`${config.public.apiUrl}contacts/${id}/toggle-wrong-number`,
			{},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		showWrongNumberButton.value = !showWrongNumberButton.value;
		toast.success("Stav čísla bol zmenený", {
			position: "top-right",
			timeout: 5000,
		});
	} catch (error) {
		toast.error("Prepísanie stavu tel. čísla", {
			position: "top-right",
			timeout: 5000,
		});
		console.error("Error toggling wrong number:", error);
	}
};

const closeDiscardActivityModal = () => {
	showDiscardActivityModal.value = false;
};

// ── Duplicate check ──
const duplicateResults = ref([]); // stores last check results for the modal
const showDuplicateModal = ref(false);
const duplicateOwnFlag = ref(false); // true if YOU also have this contact

const checkDuplicity = async () => {
	authStore.loadToken();
	const phone = people.value[0]?.cislo;

	try {
		await axios.get(`${config.public.apiUrl}duplicate-check`, {
			params: { cislo: phone },
			headers: { Authorization: `Bearer ${authStore.token}` },
		});
		// 200 = no duplicate at all
		toast.success("Kontakt nie je duplicitný", {
			position: "top-right",
			timeout: 5000,
		});
	} catch (error) {
		if (error.response?.status === 409) {
			const data = error.response.data;

			// ── Own only (nobody else has it) ──
			if (data.type === "own") {
				toast.warning("Kontakt už existuje vo vašej databáze", {
					position: "top-right",
					timeout: 5000,
				});
				return;
			}

			// ── Other users have it (you may or may not too) ──
			if (data.type === "other_users" && data.duplicates?.length > 0) {
				duplicateResults.value = data.duplicates;
				duplicateOwnFlag.value = data.own ?? false;
				showDuplicateModal.value = true;

				// Also write a note to this contact
				const now = new Date().toLocaleDateString("sk-SK");
				let noteLines = [`[Kontrola duplicity ${now}]`];
				if (data.own) {
					noteLines.push("• Kontakt existuje aj vo vašej vlastnej databáze");
				}
				for (const dup of data.duplicates) {
					const fullName =
						dup.first_name || dup.last_name
							? `${dup.first_name} ${dup.last_name}`.trim()
							: dup.username;
					noteLines.push(
						`• Používateľ: ${fullName} (${dup.username}) | ${dup.last_activity_type} | ${dup.last_activity}`,
					);
				}
				const duplicateNote = noteLines.join("\n");
				const existingNote = people.value[0]?.poznamka || "";
				const newNote = existingNote
					? `${existingNote}\n\n${duplicateNote}`
					: duplicateNote;

				//people.value[0].poznamka = newNote;
			}
		} else {
			console.error("Chyba pri kontrole duplicity:", error);
			toast.error("Chyba pri kontrole duplicity", {
				position: "top-right",
				timeout: 5000,
			});
		}
	}
};

// ── Sync to Google / phone ──
const syncingGoogle = ref(false);

const syncToGoogle = async () => {
	syncingGoogle.value = true;
	try {
		await axios.post(
			`${config.public.apiUrl}google/contacts/sync`,
			{ userId: user_id.value, contactId: id },
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		toast.success("Kontakt bol uložený do Google Contacts!", {
			position: "top-right",
			timeout: 4000,
		});
	} catch (error) {
		const msg = error.response?.data?.error ?? "Chyba pri synchronizácii";
		toast.error(msg, { position: "top-right", timeout: 5000 });
	} finally {
		syncingGoogle.value = false;
	}
};

// ── Initials for avatar ──
const contactInitials = computed(() => {
	const p = people.value[0];
	if (!p) return "—";
	return `${(p.meno || "")[0] || ""}${(p.priezvisko || "")[0] || ""}`.toUpperCase();
});
</script>

<template>
	<!-- ── Duplicate results modal ── -->
	<Teleport to="body">
		<div
			v-if="showDuplicateModal"
			class="dup-overlay"
			@click.self="showDuplicateModal = false"
		>
			<div class="dup-modal">
				<div class="dup-modal-header">
					<span class="dup-modal-icon">🔍</span>
					<div>
						<h2 class="dup-modal-title">Kontrola duplicity</h2>
					</div>
					<button class="dup-close-btn" @click="showDuplicateModal = false">
						✕
					</button>
				</div>

				<div v-if="duplicateOwnFlag" class="dup-own-banner">
					⚠️ Tento kontakt existuje aj vo vašej vlastnej databáze
				</div>

				<div class="dup-table-wrap">
					<table class="dup-table">
						<thead>
							<tr>
								<th>Meno</th>
								<th>Username</th>
								<th>Typ aktivity</th>
								<th>Posledná aktivita</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(dup, i) in duplicateResults" :key="i" class="dup-row">
								<td class="dup-name">
									{{
										dup.first_name || dup.last_name
											? `${dup.first_name} ${dup.last_name}`.trim()
											: "—"
									}}
								</td>
								<td class="dup-username">{{ dup.username }}</td>
								<td>
									<span class="dup-activity-pill">{{
										dup.last_activity_type
									}}</span>
								</td>
								<td class="dup-date">{{ dup.last_activity }}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="dup-modal-footer">
					<button class="btn btn-primary" @click="showDuplicateModal = false">
						Zavrieť
					</button>
				</div>
			</div>
		</div>
	</Teleport>

	<!-- Modals -->
	<DiscardActivityModal
		v-if="showDiscardActivityModal"
		:activityData="currentActivity"
		@closeDiscardActivity="closeDiscardActivityModal"
		@activityUpdated="handleActivityUpdate"
	/>
	<NewNamesModal
		v-if="showNewNamesModal"
		@close="changeShowNewNamesModal"
		:activityId="selectedActivityId"
	/>
	<ConfirmEventModal
		v-if="showConfirmEvent"
		@close="changeConfirmEventModal"
		@confirm="handleConfirmEvent"
		@closeConfirm="handleCloseConfirmEvent"
	/>
	<Loadigcomponent v-if="todoStore.loadingState" />
	<CallListAdd
		v-if="callListBool"
		:callListNames="callListNames"
		:user_id="id"
		:selected="id"
		@cancleCallListForm="changeCallListBool"
	/>
	<UpdateToDoForm
		:item="todoToUpdate"
		v-if="updateTodoBool"
		@cancelToDoActivity="changeupdateTodoBool"
	/>
	<addToDoForm
		v-if="todoBool"
		@cancelToDoActivity="changeToDoBool"
		:contact_id="id"
		:contact="people"
	/>
	<AlterPersonForm
		v-if="showAlterPesonForm"
		@cancelAlter="showAlterPersonForm()"
		:single_contact="people[0]"
		@alterPerson="updatePerson"
	/>
	<AddActivityForm
		:contact_id="id"
		v-if="AddActivityBool"
		@cancelAddActivity="changeAddActivityBool"
		@activityAdded="addActivityToList"
	/>
	<AlterActivityForm
		v-if="actityFormBool"
		:activityID="activityID"
		@cancelAddActivity="alterActivity"
	/>

	<ShareContactsForm
		v-if="showShareContactsForm"
		:selected="people"
		@cancelShareContacts="closeShareContactsForm"
		@refreshCallLists="findPerson(id)"
		@uncheckAll="() => {}"
		@cancelDelegateForm="closeShareContactsForm"
	/>

	<!-- Page -->
	<div class="page-wrapper">
		<!-- ── Top Header Bar ── -->
		<header class="page-header">
			<div class="header-left">
				<div class="avatar-circle">{{ contactInitials }}</div>
				<div>
					<h1 class="page-title">
						{{ people[0]?.meno }} {{ people[0]?.priezvisko }}
					</h1>
					<p class="page-subtitle">Kontakt #{{ id }}</p>
				</div>
			</div>

			<div class="header-badges">
				<span
					v-if="
						userStore.user &&
						people[0]?.shared_author !== null &&
						people[0]?.shared_author !== userStore.user?.id
					"
					class="badge badge-blue"
				>
					<Icon name="i-heroicons-share-20-solid" size="14" />
					Zdielaný s <strong>{{ sharedAuthorName }}</strong>
				</span>
				<span
					v-if="
						people[0]?.who_created_contact == userStore.user?.id &&
						delegatedUser
					"
					class="badge badge-violet"
				>
					<Icon name="i-heroicons-arrow-right-circle-20-solid" size="14" />
					Delegovaný: <strong>{{ delegatedUser }}</strong>
				</span>
			</div>

			<!-- ── Actions dropdown ── -->
			<div class="header-actions">
				<div class="relative menu-dropdown-wrapper">
					<button
						class="btn btn-actions"
						@click="actionsMenuOpen = !actionsMenuOpen"
					>
						Akcie
						<Icon
							:name="
								actionsMenuOpen
									? 'heroicons:chevron-up-20-solid'
									: 'heroicons:chevron-down-20-solid'
							"
							size="16"
						/>
					</button>

					<div v-if="actionsMenuOpen" class="actions-dropdown">
						<!-- Duplicate check -->
						<button
							class="dropdown-item"
							@click="
								checkDuplicity();
								actionsMenuOpen = false;
							"
						>
							🔍 Kontrola duplicity
						</button>

						<!-- Sync to phone -->
						<button
							class="dropdown-item"
							:disabled="syncingGoogle"
							@click="
								syncToGoogle();
								actionsMenuOpen = false;
							"
						>
							<span v-if="syncingGoogle">⏳ Synchronizujem...</span>
							<span v-else>📱 Uložiť do telefónu</span>
						</button>

						<!-- Wrong number toggle -->
						<button
							v-if="showWrongNumberButton"
							class="dropdown-item dropdown-item-danger"
							@click="
								setWrongNumber();
								actionsMenuOpen = false;
							"
						>
							❌ Zlé tel. číslo
						</button>
						<button
							v-else
							class="dropdown-item dropdown-item-success"
							@click="
								setWrongNumber();
								actionsMenuOpen = false;
							"
						>
							✅ Tel. číslo bolo opravené
						</button>

						<!-- Call list -->
						<button
							class="dropdown-item dropdown-item-green"
							@click="
								changeCallListBool();
								actionsMenuOpen = false;
							"
						>
							📋 Pridať do call listu
						</button>

						<!-- Sharing -->
						<button
							class="dropdown-item dropdown-item-green !pl-6"
							@click="
								openShareContactsForm();
								actionsMenuOpen = false;
							"
						>
							Zdielanie kontaktu
						</button>
					</div>
				</div>
			</div>
		</header>

		<!-- ── Contact Info Cards ── -->
		<section class="section">
			<h2 class="section-title">Základné informácie</h2>
			<div class="info-grid">
				<div class="info-card" v-for="col in columns_first_row" :key="col.key">
					<span class="info-label">{{ col.label }}</span>
					<span class="info-value">{{ people[0]?.[col.key] || "—" }}</span>
				</div>
				<div
					class="info-card"
					v-for="col in columns_second_row.filter((c) => c.key !== 'actions')"
					:key="col.key"
				>
					<span class="info-label">{{ col.label }}</span>
					<span class="info-value">
						<template v-if="col.key === 'created_at'">{{
							people[0]?.created_at ? formatDate(people[0].created_at) : "—"
						}}</template>
						<template v-else-if="col.key === 'rok_narodenia'">{{
							calculateAge(people[0]?.rok_narodenia)
						}}</template>
						<template v-else>{{ people[0]?.[col.key] || "—" }}</template>
					</span>
				</div>
				<!-- Edit/Delete actions -->
				<div class="info-card info-card-actions">
					<span class="info-label">Akcie</span>
					<div class="flex gap-2 mt-1">
						<button class="action-btn" @click="showAlterPersonForm()">
							<Icon name="i-heroicons-pencil-square-20-solid" size="15" />
							Upraviť
						</button>
						<button
							class="action-btn action-btn-danger"
							@click="deleteContact(people[0]?.id).then(navigateTo('/'))"
						>
							<Icon name="i-heroicons-trash-20-solid" size="15" /> Zmazať
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- ── Notes & Advisor ── -->
		<section
			class="section meta-grid"
			v-if="people[0]?.current_advisor || people[0]?.poznamka"
		>
			<div class="meta-block" v-if="people[0]?.current_advisor">
				<div class="meta-label">
					<Icon name="i-heroicons-user-circle-20-solid" size="16" /> Aktuálny
					poradca
				</div>
				<div class="meta-value">{{ people[0].current_advisor }}</div>
			</div>
			<div class="meta-block meta-block-full" v-if="people[0]?.poznamka">
				<div class="meta-label">
					<Icon
						name="i-heroicons-chat-bubble-left-ellipsis-20-solid"
						size="16"
					/>
					Poznámka
				</div>
				<div class="meta-value">{{ people[0].poznamka }}</div>
			</div>
		</section>

		<!-- ── ToDo List ── -->
		<section class="section">
			<div class="section-header-row">
				<h2 class="section-title">ToDo Zoznam</h2>
				<button
					v-if="author_id == user_id || people[0]?.shared_author == user_id"
					class="btn btn-sm btn-green"
					@click="changeToDoBool"
				>
					<Icon name="i-heroicons-plus-20-solid" size="14" /> Pridať ToDo
				</button>
			</div>

			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th v-for="col in columns_todo" :key="col.key">
								{{ col.label }}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="activities_todo.length === 0">
							<td :colspan="columns_todo.length" class="empty-row">
								Žiadne ToDo položky
							</td>
						</tr>
						<tr v-for="row in activities_todo" :key="row.id" class="data-row">
							<td class="td-mono">{{ row.dueDate }}</td>
							<td>{{ row.activity }}</td>
							<td>
								<span
									:class="
										row.completed
											? 'badge-status badge-done'
											: 'badge-status badge-pending'
									"
								>
									{{ row.completed ? "Dokončené" : "Čaká" }}
								</span>
							</td>
							<td class="td-mono text-muted">{{ row.updated_at || "—" }}</td>
							<td>
								<UDropdown :items="todo_items(row)" theme="light">
									<button class="icon-btn">
										<Icon
											name="i-heroicons-ellipsis-horizontal-20-solid"
											size="18"
										/>
									</button>
								</UDropdown>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- ── Activities ── -->
		<section class="section">
			<div class="section-header-row">
				<h2 class="section-title">Aktivity</h2>
				<button
					v-if="author_id == user_id || people[0]?.shared_author == user_id"
					class="btn btn-sm btn-primary"
					@click="changeAddActivityBool"
				>
					<Icon name="i-heroicons-plus-20-solid" size="14" /> Pridať udalosť
				</button>
			</div>

			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th v-for="col in columns_activity" :key="col.key">
								{{ col.label }}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="activities.length === 0">
							<td :colspan="columns_activity.length" class="empty-row">
								Žiadne aktivity
							</td>
						</tr>
						<tr
							v-for="row in activities"
							:key="row.id"
							class="data-row"
							@click="handleActivityRowClick(row)"
						>
							<td>
								<span class="activity-pill">{{ row.aktivita }}</span>
							</td>
							<td class="td-mono">{{ formatDateTime(row.datumCas) }}</td>
							<td class="td-mono">{{ formatDateTime(row.koniec) }}</td>
							<td class="td-note td-wide" :title="row.poznamka">
								{{ row.poznamka }}
							</td>

							<td class="td-center td-narrow">
								<span v-if="row.volane === null"></span>
								<span v-else :class="row.volane ? 'check-icon' : 'cross-icon'">
									{{ row.volane ? "✔" : "✖" }}
								</span>
							</td>
							<td class="td-center td-narrow">
								<span v-if="row.dovolane === null"></span>
								<span
									v-else
									:class="row.dovolane ? 'check-icon' : 'cross-icon'"
								>
									{{ row.dovolane ? "✔" : "✖" }}
								</span>
							</td>
							<td class="td-center td-narrow">
								<span v-if="row.dohodnute === null"></span>
								<span
									v-else
									:class="row.dohodnute ? 'check-icon' : 'cross-icon'"
								>
									{{ row.dohodnute ? "✔" : "✖" }}
								</span>
							</td>

							<!-- Status icons -->
							<td @click.stop>
								<div class="status-icons">
									<button
										class="status-btn"
										:class="{ active: row.activity_status === 'questionmark' }"
										title="Otáznik"
										@click="changeActivityStatus(row, 'questionmark')"
									>
										<Icon name="pepicons-pencil:question" size="18" />
									</button>
									<button
										class="status-btn status-btn-green"
										:class="{
											active:
												row.activity_status === 'check' ||
												row.activity_status === 'accepted',
										}"
										title="Dokončené"
										@click="changeActivityStatus(row, 'check')"
									>
										<Icon name="fa6-solid:check" size="14" />
									</button>
									<button
										class="status-btn status-btn-red"
										:class="{ active: row.activity_status === 'discarded' }"
										title="Zamietnuté"
										@click="changeActivityStatus(row, 'discarded')"
									>
										<Icon name="material-symbols:close" size="18" />
									</button>
									<template
										v-if="
											row.aktivita === 'Pohovor' ||
											row.aktivita === 'konfirmačný servis'
										"
									>
										<button
											class="status-btn status-btn-blue"
											:class="{ active: row.activity_status === 'accepted' }"
											title="Prijaté"
											@click="changeActivityStatus(row, 'accepted')"
										>
											<Icon name="fa6-solid:thumbs-up" size="14" />
										</button>
										<button
											class="status-btn status-btn-orange"
											:class="{ active: row.activity_status === 'rejected' }"
											title="Odmietnuté"
											@click="changeActivityStatus(row, 'rejected')"
										>
											<Icon name="fa6-solid:thumbs-down" size="14" />
										</button>
									</template>
								</div>
							</td>

							<td class="td-mono text-muted">
								{{ formatDateTime(row.created_at) }}
							</td>

							<td>
								<a
									v-if="isValidUrl(row.miesto_stretnutia)"
									:href="row.miesto_stretnutia"
									target="_blank"
									rel="noopener noreferrer"
									class="link-btn"
									@click.stop
								>
									<Icon name="i-heroicons-video-camera-20-solid" size="14" />
									Meeting link
								</a>
								<span v-else class="td-note">{{ row.miesto_stretnutia }}</span>
							</td>

							<td
								@click.stop
								v-if="
									author_id == user_id || people[0]?.shared_author == user_id
								"
							>
								<UDropdown :items="activity_items(row)" theme="light">
									<button class="icon-btn">
										<Icon
											name="i-heroicons-ellipsis-horizontal-20-solid"
											size="18"
										/>
									</button>
								</UDropdown>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>

<style scoped>
/* ── Variables ── */
:root {
	--bg: #f4f6f9;
	--surface: #ffffff;
	--surface-alt: #f8f9fb;
	--border: #e4e8ef;
	--text: #111827;
	--text-muted: #6b7280;
	--text-label: #9ca3af;
	--primary: #2563eb;
	--primary-hover: #1d4ed8;
	--green: #16a34a;
	--green-hover: #15803d;
	--red: #dc2626;
	--violet: #7c3aed;
	--radius: 10px;
	--shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 4px 16px rgba(0, 0, 0, 0.04);
}

/* ── Page ── */
.page-wrapper {
	min-height: 100vh;
	background: #f4f6f9;
	padding: 0 0 60px;
	font-family: "DM Sans", "Segoe UI", sans-serif;
}

/* ── Header ── */
.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 16px;
	background: #fff;
	border-bottom: 1px solid #e4e8ef;
	padding: 20px 40px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
}

.avatar-circle {
	width: 52px;
	height: 52px;
	border-radius: 50%;
	background: linear-gradient(135deg, #2563eb, #7c3aed);
	color: #fff;
	font-size: 18px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	letter-spacing: 0.5px;
}

.page-title {
	font-size: 22px;
	font-weight: 700;
	color: #111827;
	margin: 0;
	line-height: 1.2;
}

.page-subtitle {
	font-size: 13px;
	color: #9ca3af;
	margin: 2px 0 0;
}

.header-badges {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;
}

.badge-blue {
	background: #eff6ff;
	color: #1d4ed8;
	border: 1px solid #bfdbfe;
}

.badge-violet {
	background: #f5f3ff;
	color: #6d28d9;
	border: 1px solid #ddd6fe;
}

.header-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	align-items: center;
}

/* ── Buttons ── */
.btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 9px 16px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	border: none;
	transition: all 0.15s ease;
	text-decoration: none;
}

.btn-primary {
	background: #2563eb;
	color: #fff;
}
.btn-primary:hover {
	background: #1d4ed8;
}

.btn-actions {
	background: #16a34a;
	color: #fff;
}
.btn-actions:hover {
	background: #15803d;
}

.btn-danger {
	background: #fee2e2;
	color: #b91c1c;
	border: 1px solid #fca5a5;
}
.btn-danger:hover {
	background: #fecaca;
}

.btn-success-outline {
	background: #dcfce7;
	color: #15803d;
	border: 1px solid #86efac;
}
.btn-success-outline:hover {
	background: #bbf7d0;
}

.btn-sm {
	padding: 7px 13px;
	font-size: 13px;
}

.btn-green {
	background: #16a34a;
	color: #fff;
}
.btn-green:hover {
	background: #15803d;
}

/* ── Actions dropdown ── */
.relative {
	position: relative;
}

.actions-dropdown {
	position: absolute;
	right: 0;
	top: calc(100% + 6px);
	width: 220px;
	background: #fff;
	border: 1px solid #e4e8ef;
	border-radius: 10px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	z-index: 50;
	overflow: hidden;
}

.dropdown-item {
	display: block;
	width: 100%;
	padding: 12px 16px;
	text-align: left;
	font-size: 14px;
	font-weight: 600;
	color: #111827;
	background: transparent;
	border: none;
	border-bottom: 1px solid #f1f3f7;
	cursor: pointer;
	transition: background 0.12s;
}

.dropdown-item:last-child {
	border-bottom: none;
}

.dropdown-item:hover {
	background: #f8f9fb;
}

.dropdown-item:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.dropdown-item-danger {
	color: #b91c1c;
}
.dropdown-item-danger:hover {
	background: #fff1f1;
}

.dropdown-item-success {
	color: #15803d;
}
.dropdown-item-success:hover {
	background: #f0fdf4;
}

.dropdown-item-green {
	color: #15803d;
}
.dropdown-item-green:hover {
	background: #f0fdf4;
}

/* ── Sections ── */
.section {
	margin: 28px 40px 0;
}

.section-title {
	font-size: 17px;
	font-weight: 700;
	color: #111827;
	margin: 0 0 14px;
	padding-bottom: 10px;
	border-bottom: 2px solid #e4e8ef;
}

.section-header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 14px;
	padding-bottom: 10px;
	border-bottom: 2px solid #e4e8ef;
}

.section-header-row .section-title {
	margin: 0;
	border: none;
	padding: 0;
}

/* ── Info Grid ── */
.info-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 12px;
}

.info-card {
	background: #fff;
	border: 1px solid #e4e8ef;
	border-radius: 10px;
	padding: 14px 16px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
	transition: box-shadow 0.15s;
}

.info-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-label {
	display: block;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #9ca3af;
	margin-bottom: 6px;
}

.info-value {
	display: block;
	font-size: 15px;
	font-weight: 500;
	color: #111827;
	word-break: break-word;
}

.info-card-actions {
	display: flex;
	flex-direction: column;
}

.action-btn {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	color: #374151;
	cursor: pointer;
	transition: all 0.15s;
}
.action-btn:hover {
	background: #e4e8ef;
}
.action-btn-danger {
	color: #b91c1c;
	border-color: #fca5a5;
}
.action-btn-danger:hover {
	background: #fee2e2;
}

/* ── Meta blocks ── */
.meta-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 12px;
}

.meta-block {
	background: #fff;
	border: 1px solid #e4e8ef;
	border-radius: 10px;
	padding: 16px 18px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.meta-block-full {
	grid-column: 1 / -1;
}

.meta-label {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #9ca3af;
	margin-bottom: 8px;
}

.meta-value {
	font-size: 15px;
	color: #111827;
	line-height: 1.6;
	word-break: break-word;
}

/* ── Tables ── */
.table-wrapper {
	background: #fff;
	border: 1px solid #e4e8ef;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.data-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13.5px;
	table-layout: auto;
}

.data-table thead tr {
	background: #f8f9fb;
	border-bottom: 2px solid #e4e8ef;
}

.data-table th {
	padding: 12px 14px;
	text-align: left;
	font-size: 11.5px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #6b7280;
	white-space: nowrap;
}

.data-row {
	border-bottom: 1px solid #f1f3f7;
	transition: background 0.1s;
}

.data-row:last-child {
	border-bottom: none;
}
.data-row:hover {
	background: #f8f9fb;
	cursor: pointer;
}

.data-table td {
	padding: 12px 14px;
	color: #111827;
	vertical-align: middle;
	word-break: break-word;
	max-width: 220px;
}

.td-mono {
	font-family: "JetBrains Mono", "Fira Code", monospace;
	font-size: 12.5px;
	color: #374151;
	white-space: nowrap;
}

.td-center {
	text-align: center;
}

.td-note {
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.text-muted {
	color: #9ca3af;
}

.empty-row {
	text-align: center;
	padding: 32px 14px !important;
	color: #9ca3af;
	font-style: italic;
}

/* ── Status badges in table ── */
.badge-status {
	display: inline-block;
	padding: 3px 10px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
}

.badge-done {
	background: #dcfce7;
	color: #15803d;
}

.badge-pending {
	background: #fef9c3;
	color: #a16207;
}

.check-icon {
	color: #16a34a;
	font-weight: 700;
}
.cross-icon {
	color: #dc2626;
	font-weight: 700;
}

/* ── Activity status icons ── */
.status-icons {
	display: flex;
	gap: 4px;
	align-items: center;
}

.status-btn {
	width: 28px;
	height: 28px;
	border-radius: 6px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: #6b7280;
	transition: all 0.15s;
	flex-shrink: 0;
}

.status-btn:hover {
	border-color: #9ca3af;
	background: #f1f3f7;
	color: #374151;
}
.status-btn.active {
	border-color: transparent;
}

.status-btn-green.active {
	background: #dcfce7;
	color: #15803d;
	border-color: #86efac;
}
.status-btn-red.active {
	background: #fee2e2;
	color: #b91c1c;
	border-color: #fca5a5;
}
.status-btn-blue.active {
	background: #eff6ff;
	color: #1d4ed8;
	border-color: #bfdbfe;
}
.status-btn-orange.active {
	background: #fff7ed;
	color: #c2410c;
	border-color: #fdba74;
}
.status-btn.active:not(.status-btn-green):not(.status-btn-red):not(
		.status-btn-blue
	):not(.status-btn-orange) {
	background: #fef9c3;
	color: #a16207;
	border-color: #fde047;
}

/* ── Activity pill ── */
.activity-pill {
	display: inline-block;
	padding: 3px 10px;
	background: #eff6ff;
	color: #1d4ed8;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}

/* ── Link button ── */
.link-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	color: #2563eb;
	font-size: 13px;
	font-weight: 500;
	text-decoration: none;
	padding: 3px 8px;
	background: #eff6ff;
	border-radius: 6px;
	transition: background 0.15s;
	white-space: nowrap;
}
.link-btn:hover {
	background: #dbeafe;
}

/* ── Icon buttons ── */
.icon-btn {
	width: 32px;
	height: 32px;
	border-radius: 6px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: #6b7280;
	transition: all 0.15s;
}
.icon-btn:hover {
	border-color: #9ca3af;
	color: #374151;
	background: #f1f3f7;
}

/* ── Narrow boolean columns ── */
.td-narrow {
	width: 1%;
	white-space: nowrap;
	text-align: center;
	padding-left: 6px !important;
	padding-right: 6px !important;
}

/* ── Make note column expand ── */
.td-wide {
	width: 100%;
	max-width: none;
	white-space: normal;
}

/* ── Responsive ── */
@media (max-width: 768px) {
	.page-header {
		padding: 16px 20px;
		flex-direction: column;
		align-items: flex-start;
	}
	.section {
		margin: 20px 16px 0;
	}
	.info-grid {
		grid-template-columns: 1fr 1fr;
	}
}
/* ── Duplicate modal ── */
.dup-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: 20px;
}
.dup-modal {
	background: #fff;
	border-radius: 14px;
	width: 100%;
	max-width: 680px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}
.dup-modal-header {
	display: flex;
	align-items: flex-start;
	gap: 14px;
	padding: 22px 24px 18px;
	border-bottom: 1px solid #e4e8ef;
}
.dup-modal-icon {
	font-size: 28px;
	line-height: 1;
	flex-shrink: 0;
	margin-top: 2px;
}
.dup-modal-title {
	font-size: 18px;
	font-weight: 700;
	color: #111827;
	margin: 0 0 3px;
}
.dup-modal-sub {
	font-size: 13px;
	color: #6b7280;
	margin: 0;
}
.dup-close-btn {
	margin-left: auto;
	width: 30px;
	height: 30px;
	border-radius: 6px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	color: #6b7280;
	font-size: 14px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.15s;
}
.dup-close-btn:hover {
	background: #fee2e2;
	color: #b91c1c;
	border-color: #fca5a5;
}
.dup-own-banner {
	margin: 0;
	padding: 12px 24px;
	background: #fef9c3;
	border-bottom: 1px solid #fde047;
	font-size: 13.5px;
	font-weight: 600;
	color: #a16207;
}
.dup-table-wrap {
	overflow-x: auto;
	padding: 16px 24px;
}
.dup-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13.5px;
}
.dup-table thead tr {
	background: #f8f9fb;
	border-bottom: 2px solid #e4e8ef;
}
.dup-table th {
	padding: 10px 12px;
	text-align: left;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #6b7280;
	white-space: nowrap;
}
.dup-row {
	border-bottom: 1px solid #f1f3f7;
}
.dup-row:last-child {
	border-bottom: none;
}
.dup-row:hover {
	background: #f8f9fb;
}
.dup-table td {
	padding: 11px 12px;
	color: #111827;
	vertical-align: middle;
}
.dup-name {
	font-weight: 600;
}
.dup-username {
	color: #6b7280;
	font-family: monospace;
	font-size: 12.5px;
}
.dup-activity-pill {
	display: inline-block;
	padding: 2px 9px;
	background: #eff6ff;
	color: #1d4ed8;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}
.dup-date {
	color: #374151;
	font-family: monospace;
	font-size: 12.5px;
	white-space: nowrap;
}
.dup-modal-footer {
	padding: 16px 24px;
	border-top: 1px solid #e4e8ef;
	display: flex;
	justify-content: flex-end;
}
</style>
