<template>
	<!-- The follower div -->
	<div
		v-if="showFollower"
		class="fixed bg-white p-4 shadow-xl rounded-xl w-[250px] max-h-[365px] z-50"
		:style="{
			left: `${mouseX + 15}px`,
			top: `${mouseY + 15}px`,
		}"
		@mouseenter="
			() => {
				isHoveringFollower = true;
				clearTimeout(hideTimeout);
			}
		"
		@mouseleave="
			() => {
				isHoveringFollower = false;
				hideFollower();
			}
		"
	>
		<p class="font-semibold">Zoznam ľudí</p>
		<div class="my-4 overflow-y-auto max-h-[280px]">
			<p
				class="font-semibold"
				v-if="
					dataInFollower.filter((p) => p.activity_status === 'check').length !==
					0
				"
			>
				Zrealizované
			</p>
			<div
				v-for="person in dataInFollower.filter(
					(p) => p.activity_status === 'check',
				)"
				:key="person.contact_id"
				class="py-1 cursor-pointer hover:bg-gray-100 px-2 rounded"
				@click="goToContact(person.contact_id)"
			>
				{{ person.meno }} {{ person.priezvisko }}
			</div>
			<p class="font-semibold">Ostatné</p>
			<div
				v-for="person in dataInFollower.filter(
					(p) => p.activity_status !== 'check',
				)"
				:key="person.contact_id"
				class="py-1 cursor-pointer hover:bg-gray-100 px-2 rounded"
				@click="goToContact(person.contact_id)"
			>
				{{ person.meno }} {{ person.priezvisko }}
			</div>
		</div>
	</div>

	<loadigcomponent v-if="loadingStateCalendar" />

	<div class="p-6">
		<div class="mb-6">
			<!-- ─── Custom multi-select dropdown ─── -->
			<div class="relative mb-4 max-w-72" ref="dropdownRef">
				<button
					type="button"
					class="w-full flex items-center justify-between border rounded p-2 bg-white shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
					@click="dropdownOpen = !dropdownOpen"
				>
					<span class="truncate text-gray-700">{{ dropdownLabel }}</span>
					<svg
						class="w-4 h-4 ml-2 text-gray-400 flex-shrink-0 transition-transform"
						:class="{ 'rotate-180': dropdownOpen }"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				<!-- Dropdown panel -->
				<div
					v-if="dropdownOpen"
					class="absolute z-40 mt-1 w-full bg-white border rounded shadow-lg max-h-72 overflow-y-auto"
				>
					<!-- My stats option -->
					<label
						class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b"
					>
						<input
							type="checkbox"
							:checked="includeMyStats"
							@change="toggleMyStats"
							class="rounded"
						/>
						<span class="text-sm font-medium">Moje štatistiky</span>
					</label>

					<!-- Each shared user -->
					<label
						v-for="user in sharedUsers"
						:key="user.id"
						class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
					>
						<input
							type="checkbox"
							:checked="selectedUserIds.includes(user.id)"
							@change="toggleUser(user.id)"
							class="rounded"
						/>
						<span class="text-sm">{{ user.name }}</span>
					</label>

					<!-- Select all -->
					<div class="border-t px-3 py-2 flex gap-2">
						<button
							type="button"
							class="text-xs text-blue-600 hover:underline"
							@click="selectAll"
						>
							Vybrať všetkých
						</button>
						<span class="text-gray-300">|</span>
						<button
							type="button"
							class="text-xs text-gray-500 hover:underline"
							@click="clearAll"
						>
							Zrušiť výber
						</button>
					</div>
				</div>
			</div>

			<h1 class="text-2xl font-bold mb-4">Štatistika aktivít</h1>

			<!-- Date Range Picker -->
			<div class="flex gap-4 mb-4 bg-white p-4 rounded shadow">
				<div>
					<label class="block text-sm mb-1">Od</label>
					<input
						type="date"
						v-model="dateRange.from"
						class="border rounded p-2 bg-white shadow-sm"
						@change="fetchData"
					/>
				</div>
				<div>
					<label class="block text-sm mb-1">Do</label>
					<input
						type="date"
						v-model="dateRange.to"
						class="border rounded p-2 bg-white shadow-sm"
						@change="fetchData"
					/>
				</div>
				<div>
					<label class="block text-sm mb-1">Obdobie</label>
					<select
						v-model="selectedPeriod"
						class="border rounded p-[11px] bg-white shadow-sm"
						@change="updateDateRange"
					>
						<option value="week">Týždeň</option>
						<option value="month">Mesiac</option>
						<option value="quarter">Štvrťrok</option>
						<option value="halfYear">Polrok</option>
						<option value="year">Rok</option>
					</select>
				</div>
			</div>

			<select
				v-model="selectedActivityType"
				class="border rounded p-2 bg-white shadow-md"
				@change="fetchData"
			>
				<option value="Telefonát klient">Telefonát klient</option>
			</select>

			<!-- Statistics Cards -->
			<div
				class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-sm bg-white p-4"
			>
				<div
					class="bg-blue-100 p-4 rounded"
					@mouseenter="
						(e) =>
							responseData?.grouped_activities?.volane &&
							showVolaneFollower(responseData.grouped_activities.volane, e)
					"
					@mouseleave="hideFollower"
				>
					<h3 class="font-bold">Volané</h3>
					<p class="text-2xl">{{ statistics.called }}</p>
				</div>
				<div
					class="bg-green-100 p-4 rounded"
					@mouseenter="
						(e) =>
							responseData?.grouped_activities?.dovolane &&
							showVolaneFollower(responseData.grouped_activities.dovolane, e)
					"
					@mouseleave="hideFollower"
				>
					<h3 class="font-bold">Dovolané</h3>
					<p class="text-2xl">{{ statistics.reached }}</p>
				</div>
				<div
					class="bg-purple-100 p-4 rounded"
					@mouseenter="
						(e) =>
							responseData?.grouped_activities?.dohodnute &&
							showVolaneFollower(responseData.grouped_activities.dohodnute, e)
					"
					@mouseleave="hideFollower"
				>
					<h3 class="font-bold">Dohodnuté</h3>
					<p class="text-2xl">{{ statistics.scheduled }}</p>
				</div>
			</div>

			<div class="mb-6 flex flex-col gap-16" v-if="otherActivies">
				<div class="flex gap-32">
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(otherActiviesNames['Prvé stretnutie'], e)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Prvé stretnutia:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["Prvé stretnutie"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["Prvé stretnutie"]?.checked || 0 }}
							</div>
						</div>
					</div>
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(
									otherActiviesNames['Analýza osobných financí'],
									e,
								)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Analýza osobných financií:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["Analýza osobných financí"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["Analýza osobných financí"]?.checked || 0 }}
							</div>
						</div>
					</div>
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(otherActiviesNames['poradenstvo nové'], e)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Poradenstvo nové:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["poradenstvo nové"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["poradenstvo nové"]?.checked || 0 }}
							</div>
						</div>
					</div>
				</div>

				<div class="flex gap-32">
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(otherActiviesNames['realizácia nová'], e)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Realizácie nové:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["realizácia nová"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["realizácia nová"]?.checked || 0 }}
							</div>
						</div>
					</div>
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(otherActiviesNames['realizácia servisná'], e)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Realizácie servisné:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["realizácia servisná"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["realizácia servisná"]?.checked || 0 }}
							</div>
						</div>
					</div>
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(otherActiviesNames['Servisná analýza'], e)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Servisná analýza:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["Servisná analýza"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["Servisná analýza"]?.checked || 0 }}
							</div>
						</div>
					</div>
				</div>

				<div class="flex gap-32">
					<div
						class="item"
						@mouseenter="
							(e) =>
								showVolaneFollower(
									otherActiviesNames['servisné poradenstvo'],
									e,
								)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"><p>Poradenstvo servisné:</p></div>
						<div class="item-right">
							<div class="right-count">
								Pocet vsetkych:
								{{ otherActivies["servisné poradenstvo"]?.total || 0 }}
							</div>
							<div class="right-count green">
								Pocet zrealizovanych:
								{{ otherActivies["servisné poradenstvo"]?.checked || 0 }}
							</div>
						</div>
					</div>
					<div
						class="item ml-24"
						@mouseenter="
							(e) => showVolaneFollower(responseData.new_contacts, e)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left"></div>
						<div class="item-right">
							<div class="right-count green">
								Počet nových kontaktov:
								{{ responseData?.new_contacts?.length || 0 }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Pohovory Statistika -->
		<h1 class="text-2xl font-bold mb-4 mt-16">Štatistika pre Nábory</h1>
		<div class="p-2 bg-white font-semibold text-lg">Pohovory</div>

		<div
			class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 shadow-sm bg-white p-4"
		>
			<div
				class="bg-blue-100 p-4 rounded"
				@mouseenter="(e) => showPohovoryFollower('called', e)"
				@mouseleave="hideFollower"
			>
				<h3 class="font-bold">Volané</h3>
				<p class="text-2xl">{{ dataPohovory?.statistics?.called || 0 }}</p>
			</div>
			<div
				class="bg-green-100 p-4 rounded"
				@mouseenter="(e) => showPohovoryFollower('reached', e)"
				@mouseleave="hideFollower"
			>
				<h3 class="font-bold">Dovolané</h3>
				<p class="text-2xl">{{ dataPohovory?.statistics?.reached || 0 }}</p>
			</div>
			<div
				class="bg-purple-100 p-4 rounded"
				@mouseenter="(e) => showPohovoryFollower('scheduled', e)"
				@mouseleave="hideFollower"
			>
				<h3 class="font-bold">Dohodnuté</h3>
				<p class="text-2xl">{{ dataPohovory?.statistics?.scheduled || 0 }}</p>
			</div>
			<div
				class="bg-yellow-100 p-4 rounded"
				@mouseenter="(e) => showPohovoryFollower('realized', e)"
				@mouseleave="hideFollower"
			>
				<h3 class="font-bold">Zrealizované</h3>
				<p class="text-2xl">{{ dataPohovory?.statistics?.realized || 0 }}</p>
			</div>
			<div
				class="bg-red-100 p-4 rounded"
				@mouseenter="(e) => showPohovoryFollower('accepted', e)"
				@mouseleave="hideFollower"
			>
				<h3 class="font-bold">Zaujatí</h3>
				<p class="text-2xl">{{ dataPohovory?.statistics?.accepted || 0 }}</p>
			</div>
		</div>

		<div class="container" v-if="seminarActivitesStatistics">
			<div
				class="item"
				@mouseenter="
					(e) => showVolaneFollower(seminarActivitesNames['welcome seminár'], e)
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left"><p>Welcome Seminár:</p></div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ seminarActivitesStatistics["welcome seminár"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["welcome seminár"]?.checked || 0 }}
					</div>
				</div>
			</div>
			<div
				class="item"
				@mouseenter="
					(e) => showVolaneFollower(seminarActivitesNames['basic 1'], e)
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left"><p>Basic 1:</p></div>
				<div class="item-right">
					<div class="right-count">
						Všetky: {{ seminarActivitesStatistics["basic 1"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 1"]?.checked || 0 }}
					</div>
				</div>
			</div>
			<div
				class="item"
				@mouseenter="
					(e) => showVolaneFollower(seminarActivitesNames['basic 2'], e)
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left"><p>Basic 2:</p></div>
				<div class="item-right">
					<div class="right-count">
						Všetky: {{ seminarActivitesStatistics["basic 2"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 2"]?.checked || 0 }}
					</div>
				</div>
			</div>
			<div
				class="item"
				@mouseenter="
					(e) => showVolaneFollower(seminarActivitesNames['basic 3'], e)
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left"><p>Basic 3:</p></div>
				<div class="item-right">
					<div class="right-count">
						Všetky: {{ seminarActivitesStatistics["basic 3"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 3"]?.checked || 0 }}
					</div>
				</div>
			</div>
			<div
				class="item"
				@mouseenter="
					(e) => showVolaneFollower(seminarActivitesNames['basic 4'], e)
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left"><p>Basic 4:</p></div>
				<div class="item-right">
					<div class="right-count">
						Všetky: {{ seminarActivitesStatistics["basic 4"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 4"]?.checked || 0 }}
					</div>
				</div>
			</div>
			<div
				class="item"
				@mouseenter="
					(e) => showVolaneFollower(seminarActivitesNames['Post info'], e)
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left"><p>Post info:</p></div>
				<div class="item-right">
					<div class="right-count">
						Všetky: {{ seminarActivitesStatistics["Post info"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["Post info"]?.checked || 0 }}
					</div>
				</div>
			</div>
		</div>

		<h1 class="font-semibold mb-4 mt-8">Zoznam zaujatych ľudí po pohovore:</h1>
		<div class="max-h-[400px] overflow-y-auto bg-white max-w-[650px]">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50">
						<th class="p-3 text-left">Meno a Priezvisko</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="kanditat in zaujatiKandidati"
						class="border-t cursor-pointer hover:bg-gray-50"
						@click="goToContact(kanditat.id)"
					>
						<td class="p-3">{{ kanditat.meno }} {{ kanditat.priezvisko }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import BarChart from "~/components/BarChart.vue";
import axios from "axios";
const config = useRuntimeConfig();

import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useUserStore } from "#imports";
const userStore = useUserStore();

import { useRouter } from "vue-router";
const router = useRouter();

// ─── Multi-select dropdown state ───────────────────────────────────────────
const dropdownOpen = ref(false);
const dropdownRef = ref(null);
const selectedUserIds = ref([]);
const includeMyStats = ref(true);

const dropdownLabel = computed(() => {
	const names = [];
	if (includeMyStats.value) names.push("Moje štatistiky");
	selectedUserIds.value.forEach((id) => {
		const u = sharedUsers.value.find((u) => u.id === id);
		if (u) names.push(u.name);
	});
	if (names.length === 0) return "Vybrať...";
	if (names.length === 1) return names[0];
	return `${names.length} vybraní`;
});

const toggleMyStats = () => {
	includeMyStats.value = !includeMyStats.value;
	onUserSelectionChange();
};

const selectAll = () => {
	includeMyStats.value = true;
	selectedUserIds.value = sharedUsers.value.map((u) => u.id);
	onUserSelectionChange();
};

const clearAll = () => {
	includeMyStats.value = false;
	selectedUserIds.value = [];
	onUserSelectionChange();
};

const toggleUser = (id) => {
	const idx = selectedUserIds.value.indexOf(id);
	if (idx === -1) {
		selectedUserIds.value.push(id);
	} else {
		selectedUserIds.value.splice(idx, 1);
	}
	onUserSelectionChange();
};

const onUserSelectionChange = () => {
	fetchData();
};

// Close dropdown when clicking outside
const handleClickOutside = (e) => {
	if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
		dropdownOpen.value = false;
	}
};

// ─── Existing state ─────────────────────────────────────────────────────────
const isHoveringFollower = ref(false);
let hideTimeout = null;

const updateActivity = ref(false);
const activityID = ref(null);
const responseData = ref({});

const sharedUsers = computed(() => userStore.allSharedUsers);

const zaujatiKandidati = ref([]);
const dateRange = ref({ from: "", to: "" });
const selectedPeriod = ref("month");
const selectedActivityType = ref("Telefonát klient");
const statistics = ref({ called: 0, reached: 0, scheduled: 0 });
const activities = ref([]);
const loadingStateCalendar = ref(false);
const dataPohovory = ref();

const mouseX = ref(0);
const mouseY = ref(0);
const showFollower = ref(false);
const dataInFollower = ref([]);

const otherActivies = ref({});
const otherActiviesNames = ref([]);
const seminarActivitesStatistics = ref({});
const seminarActivitesNames = ref([]);

// ─── Helpers ────────────────────────────────────────────────────────────────
const showVolaneFollower = (data, event) => {
	dataInFollower.value = Array.isArray(data) ? data : [];
	if (dataInFollower.value.length === 0) {
		dataInFollower.value = [{ meno: "Žiadni ľudia", priezvisko: "" }];
	}
	mouseX.value = event.clientX;
	mouseY.value = event.clientY;
	showFollower.value = true;
};

const hideFollower = () => {
	hideTimeout = setTimeout(() => {
		if (!isHoveringFollower.value) {
			showFollower.value = false;
			dataInFollower.value = [];
		}
	}, 150);
};

const goToContact = (id) => {
	router.push(`/contact/${id}`);
};

const formatDate = (date) => new Date(date).toLocaleDateString("sk-SK");

// ─── Fetch (now supports multiple user IDs, sums results) ───────────────────
const fetchData = async () => {
	loadingStateCalendar.value = true;
	const fromDate = new Date(dateRange.value.from);
	const toDate = new Date(dateRange.value.to);
	toDate.setDate(toDate.getDate() + 1);
	toDate.setHours(23, 59, 59, 999);

	const from_date = fromDate.toISOString().split("T")[0];
	const to_date = toDate.toISOString().split("T")[0];

	// Determine which user IDs to fetch. null = own stats.
	const userIdList = [
		...(includeMyStats.value ? [null] : []),
		...selectedUserIds.value,
	];

	if (userIdList.length === 0) {
		loadingStateCalendar.value = false;
		return;
	}

	try {
		// Fetch all endpoints for every selected user in parallel
		const allResults = await Promise.all(
			userIdList.map((uid) =>
				Promise.all([
					axios.get(`${config.public.apiUrl}telefonat-klient-statistics`, {
						params: {
							from_date,
							to_date,
							activity_type: selectedActivityType.value,
							user_id: uid,
						},
						headers: { Authorization: `Bearer ${authStore.token}` },
					}),
					axios.get(`${config.public.apiUrl}pohovory-statistics`, {
						params: {
							from_date,
							to_date,
							activity_type: selectedActivityType.value,
							user_id: uid,
						},
						headers: { Authorization: `Bearer ${authStore.token}` },
					}),
					axios.get(`${config.public.apiUrl}other-activities-statistics`, {
						params: {
							from_date,
							to_date,
							activity_type: selectedActivityType.value,
							user_id: uid,
						},
						headers: { Authorization: `Bearer ${authStore.token}` },
					}),
					axios.get(`${config.public.apiUrl}seminar-activities-statistics`, {
						params: {
							from_date,
							to_date,
							activity_type: selectedActivityType.value,
							user_id: uid,
						},
						headers: { Authorization: `Bearer ${authStore.token}` },
					}),
					axios.get(`${config.public.apiUrl}interview-candidates`, {
						params: {
							from_date,
							to_date,
							activity_type: selectedActivityType.value,
							user_id: uid,
						},
						headers: { Authorization: `Bearer ${authStore.token}` },
					}),
				]),
			),
		);

		// ── Sum / merge results across users ──────────────────────────────────

		// 1. telefonat-klient statistics
		const sumStats = { called: 0, reached: 0, scheduled: 0 };
		const mergedGrouped = { volane: [], dovolane: [], dohodnute: [] };
		const mergedNewContacts = [];

		allResults.forEach(([r]) => {
			sumStats.called += r.data.statistics?.called || 0;
			sumStats.reached += r.data.statistics?.reached || 0;
			sumStats.scheduled += r.data.statistics?.scheduled || 0;

			if (r.data.grouped_activities?.volane)
				mergedGrouped.volane.push(...r.data.grouped_activities.volane);
			if (r.data.grouped_activities?.dovolane)
				mergedGrouped.dovolane.push(...r.data.grouped_activities.dovolane);
			if (r.data.grouped_activities?.dohodnute)
				mergedGrouped.dohodnute.push(...r.data.grouped_activities.dohodnute);
			if (r.data.new_contacts) mergedNewContacts.push(...r.data.new_contacts);
		});

		statistics.value = sumStats;
		responseData.value = {
			grouped_activities: mergedGrouped,
			new_contacts: mergedNewContacts,
		};

		// 2. pohovory statistics
		const sumPohovory = {
			called: 0,
			reached: 0,
			scheduled: 0,
			realized: 0,
			accepted: 0,
		};
		const mergedPohovoryPeople = {
			called: [],
			reached: [],
			scheduled: [],
			realized: [],
			accepted: [],
		};

		allResults.forEach(([, r]) => {
			["called", "reached", "scheduled", "realized", "accepted"].forEach(
				(k) => {
					sumPohovory[k] += r.data.statistics?.[k] || 0;
					if (r.data.grouped_people?.[k])
						mergedPohovoryPeople[k].push(...r.data.grouped_people[k]);
				},
			);
		});

		dataPohovory.value = {
			statistics: sumPohovory,
			grouped_people: mergedPohovoryPeople,
		};

		// 3. other activities
		const activityKeys = [
			"Prvé stretnutie",
			"Analýza osobných financí",
			"poradenstvo nové",
			"realizácia nová",
			"realizácia servisná",
			"Servisná analýza",
			"servisné poradenstvo",
		];
		const sumOther = {};
		const mergedOtherNames = {};
		activityKeys.forEach((k) => {
			sumOther[k] = { total: 0, checked: 0 };
			mergedOtherNames[k] = [];
		});

		allResults.forEach(([, , r]) => {
			activityKeys.forEach((k) => {
				sumOther[k].total += r.data.statistics?.[k]?.total || 0;
				sumOther[k].checked += r.data.statistics?.[k]?.checked || 0;
				if (r.data.activities_by_type?.[k])
					mergedOtherNames[k].push(...r.data.activities_by_type[k]);
			});
		});

		otherActivies.value = sumOther;
		otherActiviesNames.value = mergedOtherNames;

		// 4. seminar activities
		const seminarKeys = [
			"welcome seminár",
			"basic 1",
			"basic 2",
			"basic 3",
			"basic 4",
			"Post info",
		];
		const sumSeminar = {};
		const mergedSeminarNames = {};
		seminarKeys.forEach((k) => {
			sumSeminar[k] = { total: 0, checked: 0 };
			mergedSeminarNames[k] = [];
		});

		allResults.forEach(([, , , r]) => {
			seminarKeys.forEach((k) => {
				sumSeminar[k].total += r.data.statistics?.[k]?.total || 0;
				sumSeminar[k].checked += r.data.statistics?.[k]?.checked || 0;
				if (r.data.activities_by_type?.[k])
					mergedSeminarNames[k].push(...r.data.activities_by_type[k]);
			});
		});

		seminarActivitesStatistics.value = sumSeminar;
		seminarActivitesNames.value = mergedSeminarNames;

		// 5. interview candidates
		const merged = [];
		allResults.forEach(([, , , , r]) => {
			if (r.data.candidates) merged.push(...r.data.candidates);
		});
		zaujatiKandidati.value = merged;
	} catch (error) {
		console.error(
			"Error fetching statistics:",
			error.response?.data || error.message,
		);
	}

	loadingStateCalendar.value = false;
};

const updateDateRange = () => {
	const now = new Date();
	const from = new Date();
	switch (selectedPeriod.value) {
		case "week":
			from.setDate(now.getDate() - 7);
			break;
		case "month":
			from.setMonth(now.getMonth() - 1);
			break;
		case "quarter":
			from.setMonth(now.getMonth() - 3);
			break;
		case "halfYear":
			from.setMonth(now.getMonth() - 6);
			break;
		case "year":
			from.setFullYear(now.getFullYear() - 1);
			break;
	}
	dateRange.value = {
		from: from.toISOString().split("T")[0],
		to: now.toISOString().split("T")[0],
	};
	fetchData();
};

const showPohovoryFollower = (key, event) => {
	if (!dataPohovory.value?.grouped_people?.[key]) {
		dataInFollower.value = [{ meno: "Žiadni ľudia", priezvisko: "" }];
	} else {
		dataInFollower.value = dataPohovory.value.grouped_people[key];
	}
	mouseX.value = event.clientX;
	mouseY.value = event.clientY;
	showFollower.value = true;
};

onMounted(async () => {
	updateDateRange();
	await userStore.fetchSharedCalendarUsers();
	document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.container {
	padding: 50px 0;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(0, max-content));
	gap: 8rem;
}

.item {
	display: flex;
	gap: 24px;
	height: 150px;
	width: 150px;
}

.right-count {
	font-weight: bold;
	background-color: #fff;
	padding: 10px 15px;
}

.green {
	background-color: #86efac;
}

.dark-green {
	background-color: #22c55e;
}
</style>
