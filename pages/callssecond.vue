<script setup>
const config = useRuntimeConfig();
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useCallListStore } from "~/stores/callListStore";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

const callListStore = useCallListStore();
const authStore = useAuthStore();
authStore.loadToken();
const toast = useToast();
const router = useRouter();

// ── State ──────────────────────────────────────────────────────────────────
const loadingState = ref(false);
const people = ref([]);
const call_lists = ref([]);
const single_contact = ref({});
const showAlterPesonForm = ref(false);
const showDisclaimer = ref(false);
const selected = ref([]);
const editingCallListId = ref(null);
const editingCallListName = ref("");

// Split-view state
const splitViewActive = ref(false);
const currentContactIndex = ref(0);
const contactDetail = ref(null);
const contactActivities = ref([]);
const loadingDetail = ref(false);

// VDD note modal
const showNoteModal = ref(false);
const pendingNote = ref("");
const pendingVDD = ref(null); // 'volane' | 'dovolane' | 'dohodnute'

// Calendar date
const calendarDate = ref(format(new Date(), "yyyy-MM-dd"));
const calendarTime = ref("");

// Add activity form
const showAddActivity = ref(false);

// Restore position from localStorage
const STORAGE_KEY = "callListPosition";

const savePosition = () => {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				callListId: callListStore.selectedCallList,
				index: currentContactIndex.value,
			}),
		);
	} catch {}
};

const restorePosition = () => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
		return saved;
	} catch {
		return null;
	}
};

// ── Call list sidebar ──────────────────────────────────────────────────────
const updateResults = (results) => {
	call_lists.value = results;
};

onMounted(async () => {
	if (callListStore.callLists.length === 0) {
		await callListStore.fetchCallLists();
	}
	call_lists.value = callListStore.callLists;

	if (callListStore.selectedCallListPeople.length > 0) {
		people.value = decoratePeople(callListStore.selectedCallListPeople);

		// Restore position
		const saved = restorePosition();
		if (saved && saved.callListId === callListStore.selectedCallList) {
			const idx = Math.min(saved.index, people.value.length - 1);
			currentContactIndex.value = idx;
			if (people.value[idx]) {
				await openSplitView(idx);
			}
		}
	}
});

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

const getCallList = async (id) => {
	loadingState.value = true;
	callListStore.getCallListById(id);
	callListStore.setSelectedCallList(id);
	splitViewActive.value = false;

	try {
		let contactIds;
		try {
			contactIds = JSON.parse(callListStore.singleCallList.contact_ids);
		} catch {}
		const res = await axios.post(
			`${config.public.apiUrl}call-list`,
			{ ids: contactIds },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (res.data.contacts) {
			people.value = decoratePeople(res.data.contacts);
			callListStore.selectedCallListPeople = res.data.contacts;

			// Try to restore position for this list
			const saved = restorePosition();
			if (saved && saved.callListId === id) {
				currentContactIndex.value = Math.min(
					saved.index,
					people.value.length - 1,
				);
			} else {
				currentContactIndex.value = 0;
			}
		}
	} catch (error) {
		console.error("Error fetching contacts:", error);
	}
	loadingState.value = false;
};

const deleteCallList = async (id) => {
	if (!confirm("Ste si istý, že chcete vymazať tento call list?")) return;
	await callListStore.deleteCallList(id);
	call_lists.value = callListStore.callLists;
	if (callListStore.selectedCallList === id) splitViewActive.value = false;
};

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

// ── Split view ─────────────────────────────────────────────────────────────
const currentContact = computed(
	() => people.value[currentContactIndex.value] ?? null,
);

const openSplitView = async (index) => {
	currentContactIndex.value = index;
	splitViewActive.value = true;
	savePosition();
	await loadContactDetail(people.value[index]?.id);
};

const loadContactDetail = async (contactId) => {
	if (!contactId) return;
	loadingDetail.value = true;
	try {
		const [contactRes, activitiesRes] = await Promise.all([
			axios.get(`${config.public.apiUrl}contact/${contactId}`, {
				headers: { Authorization: `Bearer ${authStore.token}` },
			}),
			axios.get(`${config.public.apiUrl}contacts/${contactId}/activities`, {
				headers: { Authorization: `Bearer ${authStore.token}` },
			}),
		]);
		contactDetail.value = contactRes.data.contact;
		showWrongNumberButton.value = contactDetail.value.wrong_number == 0;
		contactActivities.value = activitiesRes.data.activities ?? [];
	} catch (err) {
		console.error("Error loading contact detail:", err);
	}
	loadingDetail.value = false;
};

const closeSplitView = () => {
	splitViewActive.value = false;
};

const goToNextContact = async () => {
	if (currentContactIndex.value < people.value.length - 1) {
		currentContactIndex.value++;
		savePosition();
		await loadContactDetail(people.value[currentContactIndex.value]?.id);
	} else {
		toast.success("Prešli ste všetkých kontaktov v call liste!");
		closeSplitView();
	}
};

const goToPrevContact = async () => {
	if (currentContactIndex.value > 0) {
		currentContactIndex.value--;
		savePosition();
		await loadContactDetail(people.value[currentContactIndex.value]?.id);
	}
};

const pendingType = ref("klient"); // which panel triggered the note modal
const pendingActivityType = ref("");
const pendingActivityDateTime = ref(null);

// ── VDD buttons ────────────────────────────────────────────────────────────

const openAddActivity = (type) => {
	if (!currentContact.value) return;
	pendingActivityType.value = type === "klient" ? "Prvé stretnutie" : "Pohovor";
	pendingActivityDateTime.value = null;
	showAddActivity.value = true;
};

const onCalendarSlotClicked = (dateTime) => {
	if (!currentContact.value) return; // ← guard
	pendingActivityType.value = "Telefonát klient";
	pendingActivityDateTime.value = dateTime;
	showAddActivity.value = true;
};

const handleVolane = (type) => {
	pendingType.value = type;
	pendingVDD.value = "volane";
	pendingNote.value = "";
	showNoteModal.value = true;
};

const handleDovolane = (type) => {
	pendingType.value = type;
	pendingVDD.value = "dovolane";
	pendingNote.value = "";
	todoFromNote.value = false;
	todoDueDate.value = format(new Date(), "yyyy-MM-dd'T'HH:mm");
	showNoteModal.value = true;
};

const handleDohodnuteStretnutie = (type) => {
	if (!currentContact.value) return;
	pendingActivityType.value = type === "klient" ? "Prvé stretnutie" : "Pohovor";
	pendingActivityDateTime.value = null;
	showAddActivity.value = true;
};

const confirmNoteAndAdvance = async () => {
	const type = pendingVDD.value;
	const panel = pendingType.value;

	await logVDDActivity(type, panel, pendingNote.value);

	if (todoFromNote.value && pendingNote.value) {
		await saveTodoFromNote();
	}

	showNoteModal.value = false;
	pendingNote.value = "";
	pendingVDD.value = null;
	todoFromNote.value = false;

	await goToNextContact();
};

const cancelNote = () => {
	showNoteModal.value = false;
	pendingNote.value = "";
	pendingVDD.value = null;
	todoFromNote.value = false;
};

const logVDDActivity = async (type, panel = "klient", note = "") => {
	if (!currentContact.value) return;
	try {
		const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
		const end = format(new Date(Date.now() + 5 * 60000), "yyyy-MM-dd'T'HH:mm");

		// Activity name based on panel
		const aktivita =
			panel === "klient" ? "Telefonát klient" : "Telefonát nábor";

		await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: currentContact.value.id,
				aktivita,
				datumCas: now,
				koniec: end,
				poznamka: note || null,
				volane: 1,
				dovolane: type === "dovolane" || type === "dohodnute" ? 1 : 0,
				dohodnute: type === "dohodnute" ? 1 : 0,
				online_meeting: false,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		toast.success(
			type === "volane"
				? "Volané zaznamenané"
				: type === "dovolane"
					? "Dovolané zaznamenané"
					: "Dohodnuté zaznamenané",
		);
		await loadContactDetail(currentContact.value.id);
	} catch (err) {
		console.error("Error logging VDD activity:", err);
		toast.error("Chyba pri ukladaní aktivity");
	}
};

// ── Todo from note modal ────────────────────────────────────────────────────
const todoFromNote = ref(false);
const todoDueDate = ref(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
const todoActivityName = ref("");
const showTodoModal = ref(false);

const openTodoModal = () => {
	todoActivityName.value = "";
	todoDueDate.value = format(new Date(), "yyyy-MM-dd'T'HH:mm");
	showTodoModal.value = true;
};

const saveTodo = async () => {
	if (!currentContact.value || !todoActivityName.value) return;
	try {
		await axios.post(
			`${config.public.apiUrl}todos`,
			{
				activity_name: todoActivityName.value,
				due_date: todoDueDate.value,
				contact_id: currentContact.value.id,
				contact_name:
					`${currentContact.value.meno ?? ""} ${currentContact.value.priezvisko ?? ""}`.trim(),
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		toast.success("ToDo vytvorené");
		showTodoModal.value = false;
	} catch (err) {
		console.error("Error creating todo:", err);
		toast.error("Chyba pri vytváraní ToDo");
	}
};

// Wrong number toggle
const showWrongNumberButton = ref(true);

const setWrongNumber = async () => {
	if (!currentContact.value) return;
	try {
		await axios.patch(
			`${config.public.apiUrl}contacts/${currentContact.value.id}/toggle-wrong-number`,
			{},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		showWrongNumberButton.value = !showWrongNumberButton.value;
		toast.success("Stav čísla bol zmenený");
	} catch (error) {
		console.error("Error toggling wrong number:", error);
		toast.error("Chyba pri zmene stavu tel. čísla");
	}
};

const saveTodoFromNote = async () => {
	if (!currentContact.value || !pendingNote.value) return;
	try {
		await axios.post(
			`${config.public.apiUrl}todos`,
			{
				activity_name: pendingNote.value,
				due_date: todoDueDate.value,
				contact_id: currentContact.value.id,
				contact_name:
					`${currentContact.value.meno ?? ""} ${currentContact.value.priezvisko ?? ""}`.trim(),
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		toast.success("ToDo vytvorené z poznámky");
	} catch (err) {
		console.error("Error creating todo from note:", err);
	}
};

// ── Calendar handlers ──────────────────────────────────────────────────────
const onCalendarDateUpdate = (date) => {
	calendarDate.value = date;
};
const onCalendarTimeClicked = (time) => {
	calendarTime.value = time;
};

// ── Activity added from calendar ────────────────────────────────────────────
const calendarComponentRef = ref(null);

const onActivityAdded = async (activity) => {
	showAddActivity.value = false;
	pendingActivityDateTime.value = null;
	pendingActivityType.value = "";

	if (calendarComponentRef.value && activity) {
		calendarComponentRef.value.addNewEvent(activity);
	}

	toast.success("Aktivita pridaná – prechod na ďalší kontakt");

	// Load detail silently without triggering loadingDetail spinner
	try {
		const [contactRes, activitiesRes] = await Promise.all([
			axios.get(`${config.public.apiUrl}contact/${currentContact.value?.id}`, {
				headers: { Authorization: `Bearer ${authStore.token}` },
			}),
			axios.get(
				`${config.public.apiUrl}contacts/${currentContact.value?.id}/activities`,
				{
					headers: { Authorization: `Bearer ${authStore.token}` },
				},
			),
		]);
		contactDetail.value = contactRes.data.contact;
		contactActivities.value = activitiesRes.data.activities ?? [];
	} catch (err) {
		console.error("Silent reload failed:", err);
	}

	await goToNextContact();
};

// const onActivityAdded = async (activity) => {
// 	showAddActivity.value = false;
// 	pendingActivityDateTime.value = null;
// 	pendingActivityType.value = "";

// 	if (calendarComponentRef.value && activity) {
// 		calendarComponentRef.value.addNewEvent(activity);
// 	}

// 	toast.success("Aktivita pridaná – prechod na ďalší kontakt");
// 	await loadContactDetail(currentContact.value?.id);
// 	await goToNextContact();
// };

// ── Helpers ────────────────────────────────────────────────────────────────
const detailView = (id) => {
	router.push(`/contact/${id}`);
};
const findPerson = async (id) => {
	const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
		headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
	});
	single_contact.value = response.data.contact;
	showAlterPesonForm.value = true;
};
const deletePerson = async (id, callListId) => {
	try {
		await callListStore.deletePersonStore(id, callListId);
		people.value = decoratePeople(callListStore.selectedCallListPeople);
	} catch (error) {
		console.error("Failed to delete person:", error);
	}
};
const toggleCheckbox = (id) => {
	const person = people.value.find((p) => p.id === id);
	if (!person) return;
	const index = selected.value.findIndex((p) => p.id === id);
	if (index === -1) selected.value.push(person);
	else selected.value.splice(index, 1);
};

const formatDateTime = (str) => {
	if (!str) return "";
	return format(new Date(str), "dd.MM.yyyy HH:mm");
};

const contactInitials = computed(() => {
	const p = contactDetail.value;
	if (!p) return "—";
	return `${(p.meno || "")[0] || ""}${(p.priezvisko || "")[0] || ""}`.toUpperCase();
});
</script>

<template>
	<div class="page-root">
		<loadigcomponent v-if="loadingState || loadingDetail" />

		<!-- ═══ SIDEBAR LIST (hidden when split view active) ═══ -->
		<div class="page-layout" :class="{ 'split-active': splitViewActive }">
			<!-- Sidebar -->
			<aside class="sidebar" v-show="!splitViewActive">
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

			<!-- ── Contact table (normal view) ── -->
			<main class="main-content" v-show="!splitViewActive">
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
									<span class="legend-dot legend-dot--yellow"></span
									><span
										>Posledná aktivita staršia ako vytvorenie call listu</span
									>
								</div>
								<div class="legend-item">
									<span class="legend-dot legend-dot--red"></span
									><span
										>Posledná aktivita novšia ako vytvorenie call listu</span
									>
								</div>
								<div class="legend-item">
									<span class="legend-dot legend-dot--green"></span
									><span>Žiadna aktivita</span>
								</div>
							</div>
						</div>
					</div>
				</div>

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

				<div v-else class="table-wrapper">
					<UTable
						:rows="people"
						:columns="[
							{ key: 'meno', label: 'Meno' },
							{ key: 'priezvisko', label: 'Priezvisko' },
							{ key: 'cislo', label: 'Tel. číslo' },
							{ key: 'email', label: 'Email' },
							{ key: 'odporucitel', label: 'Odporúčiteľ' },
							{ key: 'poznamka', label: 'Poznámka' },
							{ key: 'actions' },
						]"
						class="calls-table"
					>
						<template #poznamka-data="{ row }">
							<div v-if="row.poznamka" class="note-cell">
								<span class="note-truncate">{{ row.poznamka }}</span>
								<div class="note-tooltip">{{ row.poznamka }}</div>
							</div>
							<span v-else class="text-slate-400">—</span>
						</template>
						<template #actions-data="{ row, index }">
							<div class="row-actions">
								<button
									class="action-btn action-btn--call"
									@click="openSplitView(people.indexOf(row))"
								>
									📞 Volať
								</button>
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
							</div>
						</template>
					</UTable>
				</div>
			</main>

			<!-- ═══ SPLIT VIEW ═══ -->
			<div class="split-view" v-if="splitViewActive">
				<!-- Top bar -->
				<div class="split-topbar">
					<button class="split-back-btn" @click="closeSplitView">
						← Späť na zoznam
					</button>
					<div class="split-progress">
						<span class="split-progress-text"
							>{{ currentContactIndex + 1 }} / {{ people.length }}</span
						>
						<div class="split-progress-bar">
							<div
								class="split-progress-fill"
								:style="{
									width:
										((currentContactIndex + 1) / people.length) * 100 + '%',
								}"
							></div>
						</div>
					</div>
					<div class="split-nav-btns">
						<button
							class="nav-btn"
							@click="goToPrevContact"
							:disabled="currentContactIndex === 0"
						>
							← Predošlý
						</button>
						<button
							class="nav-btn nav-btn--next"
							@click="goToNextContact"
							:disabled="currentContactIndex >= people.length - 1"
						>
							Ďalší →
						</button>
					</div>
				</div>

				<!-- Split panels -->
				<div class="split-panels">
					<!-- LEFT: Contact detail -->
					<div class="split-left">
						<div v-if="loadingDetail" class="detail-loading">Načítavam...</div>
						<template v-else-if="contactDetail">
							<!-- Contact header -->
							<div class="detail-header">
								<div class="avatar-circle">{{ contactInitials }}</div>
								<div>
									<h2 class="detail-name">
										{{ contactDetail.meno }} {{ contactDetail.priezvisko }}
									</h2>
									<!-- <a
										:href="`/contact/${contactDetail.id}`"
										target="_blank"
										class="detail-link"
										>Otvoriť plný detail →</a
									> -->
								</div>
							</div>

							<!-- Contact info grid -->
							<div class="detail-info-grid">
								<div class="detail-info-item">
									<span class="detail-info-label">Tel. číslo</span>
									<span class="detail-info-value">{{
										contactDetail.cislo || "—"
									}}</span>
								</div>
								<div class="detail-info-item">
									<span class="detail-info-label">Email</span>
									<span class="detail-info-value">{{
										contactDetail.email || "—"
									}}</span>
								</div>
								<div class="detail-info-item">
									<span class="detail-info-label">Odporúčateľ</span>
									<span class="detail-info-value">{{
										contactDetail.odporucitel || "—"
									}}</span>
								</div>
								<div class="detail-info-item">
									<span class="detail-info-label">Zamestnanie</span>
									<span class="detail-info-value">{{
										contactDetail.zamestanie || "—"
									}}</span>
								</div>
								<div class="detail-info-item">
									<span class="detail-info-label">Adresa</span>
									<span class="detail-info-value">{{
										contactDetail.adresa || "—"
									}}</span>
								</div>
								<div class="detail-info-item">
									<span class="detail-info-label">Vek</span>
									<span class="detail-info-value">{{
										contactDetail.rok_narodenia
											? new Date().getFullYear() - contactDetail.rok_narodenia
											: "—"
									}}</span>
								</div>
							</div>

							<!-- Poznámka -->
							<div v-if="contactDetail.poznamka" class="detail-note">
								<span class="detail-info-label">Poznámka</span>
								<p class="detail-note-text">{{ contactDetail.poznamka }}</p>
							</div>

							<!-- ── VDD Buttons ── -->
							<div class="vdd-wrapper">
								<!-- LEFT: Klient -->
								<div class="vdd-panel vdd-panel--klient">
									<h3 class="vdd-panel-title">📋 Klient</h3>
									<div class="vdd-buttons">
										<button
											class="vdd-btn vdd-btn--volane"
											@click="handleVolane('klient')"
										>
											📵 Volané
										</button>
										<button
											class="vdd-btn vdd-btn--dovolane"
											@click="handleDovolane('klient')"
										>
											📞 Dovolané
										</button>
										<button
											class="vdd-btn vdd-btn--dohodnute"
											@click="handleDohodnuteStretnutie('klient')"
										>
											✅ Dohodnuté stretnutie
										</button>
									</div>
									<button
										class="vdd-btn vdd-btn--activity mt-3"
										@click="openAddActivity('klient')"
									>
										📅 Pridať aktivitu do diára
									</button>
									<button
										class="vdd-btn vdd-btn--todo mt-2"
										@click="openTodoModal"
									>
										📝 Vytvoriť ToDo
									</button>
								</div>
								<!-- RIGHT: Nábor -->
								<div class="vdd-panel vdd-panel--nabor">
									<h3 class="vdd-panel-title">🤝 Nábor</h3>
									<div class="vdd-buttons">
										<button
											class="vdd-btn vdd-btn--volane"
											@click="handleVolane('nabor')"
										>
											📵 Volané
										</button>
										<button
											class="vdd-btn vdd-btn--dovolane"
											@click="handleDovolane('nabor')"
										>
											📞 Dovolané
										</button>
										<button
											class="vdd-btn vdd-btn--dohodnute"
											@click="handleDohodnuteStretnutie('nabor')"
										>
											✅ Dohodnuté stretnutie
										</button>
									</div>
									<button
										class="vdd-btn vdd-btn--activity mt-3"
										@click="openAddActivity('nabor')"
									>
										📅 Pridať aktivitu do diára
									</button>
									<button
										class="vdd-btn vdd-btn--todo mt-2"
										@click="openTodoModal"
									>
										📝 Vytvoriť ToDo
									</button>
								</div>
							</div>

							<div class="wrong-number-row">
								<button
									v-if="showWrongNumberButton"
									class="vdd-btn vdd-btn--wrong"
									@click="setWrongNumber"
								>
									❌ Zlé tel. číslo
								</button>
								<button
									v-else
									class="vdd-btn vdd-btn--wrong-fixed"
									@click="setWrongNumber"
								>
									✅ Číslo bolo opravené
								</button>
							</div>

							<!-- Recent activities -->
							<div
								class="detail-activities"
								v-if="contactActivities.length > 0"
							>
								<h3 class="detail-section-title">Posledné aktivity</h3>
								<div class="activity-list">
									<div
										v-for="act in contactActivities.slice(0, 5)"
										:key="act.id"
										class="activity-item"
									>
										<div class="activity-item-top">
											<span class="activity-pill-sm">{{ act.aktivita }}</span>
											<span class="activity-date">{{
												formatDateTime(act.datumCas)
											}}</span>
											<span
												class="activity-status"
												:class="`status--${act.activity_status}`"
												>{{ act.activity_status || "—" }}</span
											>
										</div>

										<div class="activity-item-flags">
											<span
												class="flag-badge"
												:class="
													act.volane
														? 'flag-badge--volane-on'
														: 'flag-badge--off'
												"
												>📵 Volané</span
											>
											<span
												class="flag-badge"
												:class="
													act.dovolane
														? 'flag-badge--dovolane-on'
														: 'flag-badge--off'
												"
												>📞 Dovolané</span
											>
											<span
												class="flag-badge"
												:class="
													act.dohodnute
														? 'flag-badge--dohodnute-on'
														: 'flag-badge--off'
												"
												>✅ Dohodnuté</span
											>
										</div>

										<p v-if="act.poznamka" class="activity-note">
											{{ act.poznamka }}
										</p>
									</div>
								</div>
							</div>
						</template>
					</div>

					<!-- RIGHT: Mini calendar -->
					<div class="split-right">
						<CallsCalendarComponent
							ref="calendarComponentRef"
							:date="calendarDate"
							:contactId="currentContact?.id"
							@updateDate="onCalendarDateUpdate"
							@timeClicked="onCalendarTimeClicked"
							@slotClicked="onCalendarSlotClicked"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Add activity form (overlay) ── -->
		<AddActivityCalendarSecond
			v-if="showAddActivity"
			:end_date="
				pendingActivityDateTime ||
				calendarDate + 'T' + (calendarTime || '09:00')
			"
			:presetContactId="currentContact?.id"
			:presetAktivita="pendingActivityType"
			@cancelAddActivity="
				showAddActivity = false;
				pendingActivityDateTime = null;
				pendingActivityType = '';
			"
			@activityAdded="onActivityAdded"
		/>

		<!-- ── Note modal for Volané ── -->
		<Teleport to="body">
			<div v-if="showNoteModal" class="modal-overlay" @click.self="cancelNote">
				<div class="note-modal">
					<h3 class="note-modal-title">📵 Volané – pridať poznámku</h3>
					<p class="note-modal-sub">
						Kontakt:
						<strong
							>{{ currentContact?.meno }}
							{{ currentContact?.priezvisko }}</strong
						>
					</p>
					<textarea
						v-model="pendingNote"
						class="note-textarea"
						placeholder="Dôvod nedovolania, poznámka... (voliteľné)"
						rows="4"
						autofocus
					></textarea>
					<div v-if="pendingVDD === 'dovolane'" class="todo-from-note">
						<label class="todo-check-label">
							<input type="checkbox" v-model="todoFromNote" />
							<span>Vytvoriť ToDo s touto poznámkou</span>
						</label>
						<div v-if="todoFromNote" class="mt-2">
							<label
								class="note-modal-sub"
								style="margin: 0 0 4px; display: block"
								>Termín ToDo:</label
							>
							<input
								v-model="todoDueDate"
								type="datetime-local"
								class="note-textarea"
								style="height: auto; padding: 8px 12px"
							/>
						</div>
					</div>
					<div class="note-modal-actions">
						<button class="note-btn note-btn--cancel" @click="cancelNote">
							Zrušiť
						</button>
						<button
							class="note-btn note-btn--confirm"
							@click="confirmNoteAndAdvance"
						>
							Uložiť a pokračovať →
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ── Todo modal ── -->
		<Teleport to="body">
			<div
				v-if="showTodoModal"
				class="modal-overlay"
				@click.self="showTodoModal = false"
			>
				<div class="note-modal">
					<h3 class="note-modal-title">📝 Vytvoriť ToDo</h3>
					<p class="note-modal-sub">
						Kontakt:
						<strong
							>{{ currentContact?.meno }}
							{{ currentContact?.priezvisko }}</strong
						>
					</p>
					<input
						v-model="todoActivityName"
						class="note-textarea"
						style="height: auto; padding: 8px 12px"
						placeholder="Názov úlohy..."
					/>
					<input
						v-model="todoDueDate"
						type="datetime-local"
						class="note-textarea mt-2"
						style="height: auto; padding: 8px 12px"
					/>
					<div class="note-modal-actions">
						<button
							class="note-btn note-btn--cancel"
							@click="showTodoModal = false"
						>
							Zrušiť
						</button>
						<button class="note-btn note-btn--confirm" @click="saveTodo">
							Uložiť ToDo
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<AlterPersonForm
			v-if="showAlterPesonForm"
			@cancelAlter="showAlterPesonForm = false"
			:single_contact="single_contact"
		/>
	</div>
</template>

<style>
/* ── Reuse existing CSS variables ── */
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

.page-root {
	font-family: "DM Sans", sans-serif;
	background: var(--page-bg);
	min-height: 100vh;
}

/* ── Normal layout ── */
.page-layout {
	display: flex;
	gap: 14px;
	min-height: 100vh;
	padding: 16px;
}

.page-layout.split-active {
	padding: 0;
	gap: 0;
}

/* ── Sidebar (copied from original) ── */
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

/* ── Main content (table view) ── */
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

.table-wrapper {
	flex: 1;
	overflow: auto;
	padding: 0 8px 8px;
}
.calls-table {
	width: 100%;
}
tr.row-green td {
	background-color: #bbf7d0 !important;
}
tr.row-yellow td {
	background-color: #fef08a !important;
}
tr.row-red td {
	background-color: #fecaca !important;
}
.calls-table tr:hover td {
	background-color: #f8fafc !important;
}
tr.row-green:hover td {
	background-color: #86efac !important;
}
tr.row-yellow:hover td {
	background-color: #fde047 !important;
}
tr.row-red:hover td {
	background-color: #fca5a5 !important;
}
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
.action-btn--call {
	background-color: #16a34a;
	color: white;
}
.action-btn--call:hover {
	background-color: #15803d;
	transform: translateY(-1px);
}
.action-btn--primary {
	background-color: #921337;
	color: white;
}
.action-btn--primary:hover {
	background-color: #cc1d4d;
	transform: translateY(-1px);
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

/* ══════ SPLIT VIEW ══════ */
.split-view {
	width: 100%;
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--page-bg);
	overflow: hidden;
}

.split-topbar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 24px;
	background: white;
	border-bottom: 1px solid var(--border);
	box-shadow: var(--shadow-sm);
	position: sticky;
	top: 0;
	z-index: 20;
	flex-shrink: 0;
}

.split-back-btn {
	background: #f1f5f9;
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 7px 14px;
	font-size: 0.82rem;
	font-weight: 600;
	cursor: pointer;
	color: var(--text-primary);
	transition: background 0.15s;
	white-space: nowrap;
	font-family: "DM Sans", sans-serif;
}
.split-back-btn:hover {
	background: #e2e8f0;
}

.split-progress {
	display: flex;
	align-items: center;
	gap: 10px;
	flex: 1;
}
.split-progress-text {
	font-size: 0.8rem;
	color: var(--text-muted);
	white-space: nowrap;
}
.split-progress-bar {
	flex: 1;
	height: 6px;
	background: #e2e8f0;
	border-radius: 4px;
	overflow: hidden;
}
.split-progress-fill {
	height: 100%;
	background: var(--accent);
	border-radius: 4px;
	transition: width 0.3s ease;
}

.split-nav-btns {
	display: flex;
	gap: 8px;
}
.nav-btn {
	background: var(--accent);
	color: white;
	border: none;
	border-radius: 8px;
	padding: 7px 14px;
	font-size: 0.82rem;
	font-weight: 600;
	cursor: pointer;
	font-family: "DM Sans", sans-serif;
	transition: background 0.15s;
	white-space: nowrap;
}
.nav-btn:hover:not(:disabled) {
	background: var(--accent-hover);
}
.nav-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
.nav-btn--next {
	background: #16a34a;
}
.nav-btn--next:hover:not(:disabled) {
	background: #15803d;
}

.split-panels {
	display: grid;
	grid-template-columns: 1fr 880px;
	gap: 0;
	flex: 1;
	min-height: 0;
	height: calc(100vh - 57px);
	overflow: hidden;
}
/* LEFT panel */
.split-left {
	padding: 24px;
	overflow-y: auto;
	border-right: 1px solid var(--border);
	background: white;
}

.detail-loading {
	color: var(--text-muted);
	padding: 40px;
	text-align: center;
}

.detail-header {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--border);
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
}
.detail-name {
	font-size: 1.2rem;
	font-weight: 700;
	color: var(--text-primary);
	margin: 0 0 4px;
}
.detail-link {
	font-size: 0.78rem;
	color: var(--accent);
	text-decoration: none;
}
.detail-link:hover {
	text-decoration: underline;
}

.detail-info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-bottom: 16px;
}
.detail-info-item {
	background: #f8fafc;
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
}
.detail-info-label {
	display: block;
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--text-muted);
	margin-bottom: 4px;
}
.detail-info-value {
	display: block;
	font-size: 0.88rem;
	font-weight: 500;
	color: var(--text-primary);
	word-break: break-word;
}

.detail-note {
	background: #fefce8;
	border: 1px solid #fde047;
	border-radius: 8px;
	padding: 12px 14px;
	margin-bottom: 16px;
}
.detail-note-text {
	font-size: 0.85rem;
	color: #78350f;
	line-height: 1.6;
	margin: 4px 0 0;
	white-space: pre-wrap;
}

/* VDD */
.vdd-section {
	background: #f0fdf4;
	border: 1px solid #86efac;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 20px;
}
.vdd-title {
	font-size: 0.85rem;
	font-weight: 700;
	color: #166534;
	margin: 0 0 12px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}
.vdd-buttons {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.vdd-btn {
	width: 100%;
	padding: 11px 16px;
	border-radius: 8px;
	font-size: 0.88rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	font-family: "DM Sans", sans-serif;
	transition: all 0.15s;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16px;
}
.vdd-btn--volane {
	background: #fef9c3;
	color: #854d0e;
	border: 1px solid #fde047;
}
.vdd-btn--volane:hover {
	background: #fef08a;
}
.vdd-btn--dovolane {
	background: #dbeafe;
	color: #1e40af;
	border: 1px solid #93c5fd;
}
.vdd-btn--dovolane:hover {
	background: #bfdbfe;
}
.vdd-btn--dohodnute {
	background: #dcfce7;
	color: #166534;
	border: 1px solid #86efac;
}
.vdd-btn--dohodnute:hover {
	background: #bbf7d0;
}
.vdd-btn--activity {
	background: #ede9fe;
	color: #5b21b6;
	border: 1px solid #c4b5fd;
}
.vdd-btn--activity:hover {
	background: #ddd6fe;
}
.mt-3 {
	margin-top: 10px;
}

/* Activity list */
.detail-activities {
}
.detail-section-title {
	font-size: 0.82rem;
	font-weight: 700;
	color: var(--text-secondary);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 10px;
}
.activity-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
}
/*
.activity-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	background: #f8fafc;
	border: 1px solid var(--border);
	border-radius: 8px;
	font-size: 0.8rem;
}
	*/
.activity-item {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 10px 12px;
	background: #f8fafc;
	border: 1px solid var(--border);
	border-radius: 8px;
	font-size: 0.8rem;
}

.activity-item-top {
	display: flex;
	align-items: center;
	gap: 8px;
}

.activity-item-flags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.flag-badge {
	font-size: 0.7rem;
	font-weight: 600;
	padding: 2px 8px;
	border-radius: 10px;
	white-space: nowrap;
	border: 1px solid transparent;
}

.flag-badge--off {
	background: #f1f5f9;
	color: var(--text-muted);
	border-color: var(--border);
}

.flag-badge--volane-on {
	background: #fef9c3;
	color: #854d0e;
	border-color: #fde047;
}

.flag-badge--dovolane-on {
	background: #dbeafe;
	color: #1e40af;
	border-color: #93c5fd;
}

.flag-badge--dohodnute-on {
	background: #dcfce7;
	color: #166534;
	border-color: #86efac;
}

.activity-note {
	margin: 0;
	font-size: 0.78rem;
	color: var(--text-secondary);
	line-height: 1.5;
	white-space: pre-wrap;
	background: white;
	border: 1px solid var(--border);
	border-radius: 6px;
	padding: 6px 8px;
}
.activity-pill-sm {
	background: #eff6ff;
	color: #1d4ed8;
	border-radius: 12px;
	padding: 2px 8px;
	font-size: 0.72rem;
	font-weight: 600;
	white-space: nowrap;
	flex-shrink: 0;
}
.activity-date {
	color: var(--text-muted);
	font-size: 0.75rem;
	flex: 1;
}
.activity-status {
	font-size: 0.72rem;
	font-weight: 600;
	border-radius: 10px;
	padding: 2px 7px;
	white-space: nowrap;
}
.status--check {
	background: #dcfce7;
	color: #166534;
}
.status--discarded {
	background: #fee2e2;
	color: #991b1b;
}
.status--questionmark {
	background: #fef9c3;
	color: #854d0e;
}

/* RIGHT panel */
.split-right {
	background: #f4f6fb;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: calc(100vh - 57px);
	min-height: 0;
}

.calendar-header-bar {
	padding: 16px 16px 8px;
	border-bottom: 1px solid var(--border);
	background: white;
}
.calendar-title {
	font-size: 0.9rem;
	font-weight: 700;
	color: var(--text-primary);
	margin: 0;
}

/* ── Note modal ── */
.modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: 20px;
}
.note-modal {
	background: white;
	border-radius: 14px;
	padding: 24px;
	width: 100%;
	max-width: 440px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.note-modal-title {
	font-size: 1.05rem;
	font-weight: 700;
	color: var(--text-primary);
	margin: 0 0 6px;
}
.note-modal-sub {
	font-size: 0.82rem;
	color: var(--text-muted);
	margin: 0 0 16px;
}
.note-textarea {
	width: 100%;
	border: 1.5px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
	font-size: 0.88rem;
	font-family: "DM Sans", sans-serif;
	color: var(--text-primary);
	background: #f8fafc;
	resize: vertical;
	outline: none;
	box-sizing: border-box;
	transition: border-color 0.15s;
}
.note-textarea:focus {
	border-color: var(--accent);
}
.note-modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 16px;
}
.note-btn {
	padding: 8px 16px;
	border-radius: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	border: none;
	font-family: "DM Sans", sans-serif;
	transition: background 0.15s;
}
.note-btn--cancel {
	background: #f1f5f9;
	color: var(--text-secondary);
}
.note-btn--cancel:hover {
	background: #e2e8f0;
}
.note-btn--confirm {
	background: #16a34a;
	color: white;
}
.note-btn--confirm:hover {
	background: #15803d;
}

@media (max-width: 900px) {
	.split-panels {
		grid-template-columns: 1fr;
	}
	.split-right {
		display: none;
	}
}

/* ── Two-panel VDD ── */
.vdd-wrapper {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-bottom: 20px;
}

.vdd-panel {
	border-radius: 10px;
	padding: 12px;
}

.vdd-panel--klient {
	background: #f0fdf4;
	border: 1px solid #86efac;
}

.vdd-panel--nabor {
	background: #eff6ff;
	border: 1px solid #93c5fd;
}

.vdd-panel-title {
	font-size: 0.78rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 10px;
}

.vdd-panel--klient .vdd-panel-title {
	color: #166534;
}
.vdd-panel--nabor .vdd-panel-title {
	color: #1e40af;
}

.vdd-btn--todo {
	background: #fef9c3;
	color: #854d0e;
	border: 1px solid #fde047;
}
.vdd-btn--todo:hover {
	background: #fef08a;
}

/* ── Todo from note ── */
.todo-from-note {
	margin-top: 12px;
	padding: 10px 12px;
	background: #f0fdf4;
	border: 1px solid #86efac;
	border-radius: 8px;
}

.todo-check-label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.85rem;
	font-weight: 500;
	color: #166534;
	cursor: pointer;
}

.todo-check-label input[type="checkbox"] {
	width: 16px;
	height: 16px;
	cursor: pointer;
	accent-color: #16a34a;
}

.vdd-btn--wrong {
	background: #dc2626;
	color: #ffffff;
	border: 1px solid #dc2626;
}
.vdd-btn--wrong:hover {
	background: #b91c1c;
	border-color: #b91c1c;
}
.vdd-btn--wrong-fixed {
	background: #16a34a;
	color: #ffffff;
	border: 1px solid #16a34a;
}
.vdd-btn--wrong-fixed:hover {
	background: #15803d;
	border-color: #15803d;
}
</style>
