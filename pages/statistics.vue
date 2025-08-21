<template>
	<loadigcomponent v-if="loadingStateCalendar" />
	<div class="p-6">
		<div class="mb-6">
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

				<!-- Period Quick Select -->
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

			<div
				class="container"
				v-if="statistics && responseData && responseData.detailed_statistics"
			>
				<!-- <div class="item">
					<div class="item-left">
						<p>Pohovory:</p>
					</div>
					<div class="item-right">
						<div class="right-count">
							Pocet vsetkych:
							{{ responseData.detailed_statistics.pohovory.total }}
						</div>
						<div class="right-count green">
							Pocet zrealizovanych:
							{{ responseData.detailed_statistics.pohovory.with_check_status }}
						</div>
					</div>
				</div> -->

				<div class="item">
					<div class="item-left">
						<p>Poradenstvá:</p>
					</div>
					<div class="item-right">
						<div class="right-count">
							Pocet vsetkych:
							{{ responseData.detailed_statistics.poradenstva.total }}
						</div>
						<div class="right-count green">
							Pocet zrealizovanych:
							{{
								responseData.detailed_statistics.poradenstva.with_check_status
							}}
						</div>
					</div>
				</div>

				<div class="item">
					<div class="item-left">
						<p>Prvé stretnutia:</p>
					</div>
					<div class="item-right">
						<div class="right-count">
							Pocet vsetkych:
							{{ responseData.detailed_statistics.prve_stretnutie.total }}
						</div>
						<div class="right-count green">
							Pocet zrealizovanych:
							{{
								responseData.detailed_statistics.prve_stretnutie
									.with_check_status
							}}
						</div>
					</div>
				</div>

				<div class="item">
					<div class="item-left">
						<p>Realizácie:</p>
					</div>
					<div class="item-right">
						<div class="right-count">
							Pocet vsetkych:
							{{ responseData.detailed_statistics.realizacie.total }}
						</div>
						<div class="right-count green">
							Pocet zrealizovanych:
							{{
								responseData.detailed_statistics.realizacie.with_check_status
							}}
						</div>
					</div>
				</div>

				<div class="item">
					<div class="item-left">
						<p>unikátne analýzy:</p>
					</div>
					<div class="item-right">
						<div class="right-count">
							Pocet vsetkych:
							{{ responseData.detailed_statistics.unikatne_analyzy.total }}
						</div>
						<div class="right-count green">
							Pocet zrealizovanych:
							{{
								responseData.detailed_statistics.unikatne_analyzy
									.with_check_status
							}}
						</div>
					</div>
				</div>

				<div class="item">
					<div class="item-left">
						<p>Servisná analýza:</p>
					</div>
					<div class="item-right">
						<div class="right-count">
							Pocet vsetkych:
							{{ responseData.detailed_statistics.servisna_analyza.total }}
						</div>
						<div class="right-count green">
							Pocet zrealizovanych:
							{{
								responseData.detailed_statistics.servisna_analyza
									.with_check_status
							}}
						</div>
					</div>
				</div>
			</div>

			<select
				v-model="selectedActivityType"
				class="border rounded p-2 bg-white shadow-md"
				@change="fetchData"
			>
				<option value="all">Všetky aktivity</option>
				<option value="Telefonát klient">Telefonát klient</option>
				<option value="Prvé stretnutie">Prvé stretnutie</option>
				<option value="Analýza osobných financí">AOF</option>
				<option value="poradenstvo">Poradenstvo</option>
				<option value="realizácia">Realizácia</option>
			</select>

			<!-- Statistics Cards -->
			<div
				class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-sm bg-white p-4"
			>
				<div class="bg-blue-100 p-4 rounded">
					<h3 class="font-bold">Volané</h3>
					<p class="text-2xl">{{ statistics.called }}</p>
				</div>
				<div class="bg-green-100 p-4 rounded">
					<h3 class="font-bold">Dovolané</h3>
					<p class="text-2xl">{{ statistics.reached }}</p>
				</div>
				<div class="bg-purple-100 p-4 rounded">
					<h3 class="font-bold">Dohodnuté</h3>
					<p class="text-2xl">{{ statistics.scheduled }}</p>
				</div>
			</div>

			<!-- Statistics Cards
			<div
				class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-sm bg-white p-4"
			>
				<div
					v-for="(value, key) in statistics"
					:key="key"
					class="p-4 rounded"
					:class="{
						'bg-blue-100': key === 'called',
						'bg-green-100': key === 'reached',
						'bg-purple-100': key === 'scheduled',
					}"
				>
					<h3 class="font-bold">{{ formatCardTitle(key) }}</h3>
					<p class="text-2xl">{{ value }}</p>
				</div>
			</div> -->

			<!-- Chart -->
			<div class="bg-white p-4 rounded shadow mb-6">
				<BarChart :data="chartData" />
			</div>

			<!-- Results Table -->
			<div class="bg-white rounded shadow">
				<div class="max-h-[400px] overflow-y-auto">
					<table class="w-full">
						<thead>
							<tr class="bg-gray-50">
								<th class="p-3 text-left">Meno</th>
								<th class="p-3 text-left">Priezvisko</th>
								<th class="p-3 text-left">Typ aktivity</th>
								<th class="p-3 text-left">Dátum</th>
								<th class="p-3 text-left">Status</th>
							</tr>
						</thead>
						<EventUpdateCalendar
							:activityID="activityID"
							v-if="updateActivity"
							@cancelAddActivity="toggleUpdateActivity"
							@alterEvents="alterEvents"
							:user.value="user"
						/>
						<tbody>
							<tr
								v-for="activity in activities"
								:key="activity.id"
								class="border-t cursor-pointer hover:bg-gray-50"
								@click="toggleUpdateActivity(activity.id)"
							>
								<td class="p-3">{{ activity.meno }}</td>
								<td class="p-3">{{ activity.priezvisko }}</td>
								<td class="p-3">{{ activity.type }}</td>
								<td class="p-3">{{ formatDate(activity.date) }}</td>
								<td class="p-3">{{ activity.status }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Pohovory Statistika -->
		<h1 class="text-2xl font-bold mb-4 mt-16">Štatistika pre Nábory</h1>

		<div
			class="container"
			v-if="dataPohovory && dataPohovory.pohovory_statistics"
		>
			<div class="item">
				<div class="item-left">
					<p>Telefonát nábor:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ dataPohovory.pohovory_statistics.telefonat_nabor.total }}
					</div>
					<div class="right-count green">
						Dohodnuté:
						{{ dataPohovory.pohovory_statistics.telefonat_nabor.dohodnute }}
					</div>
				</div>
			</div>

			<div class="item">
				<div class="item-left">
					<p>Pohovor:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Zaujatý: {{ dataPohovory.pohovory_statistics.pohovor.zaujaty }}
					</div>
					<div class="right-count green">
						Nezaujatý: {{ dataPohovory.pohovory_statistics.pohovor.nezaujaty }}
					</div>
					<div class="right-count dark-green">
						Zrelizované:
						{{ dataPohovory.pohovory_statistics.pohovor.with_check_status }}
					</div>
				</div>
			</div>

			<div class="item">
				<div class="item-left">
					<p>Welcome Seminár:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ dataPohovory.pohovory_statistics.welcome_seminar.total }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{
							dataPohovory.pohovory_statistics.welcome_seminar.with_check_status
						}}
					</div>
				</div>
			</div>

			<div class="item">
				<div class="item-left">
					<p>Basic 1:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ dataPohovory.pohovory_statistics.basic_1.total }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ dataPohovory.pohovory_statistics.basic_1.with_check_status }}
					</div>
				</div>
			</div>

			<div class="item">
				<div class="item-left">
					<p>Basic 2:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ dataPohovory.pohovory_statistics.basic_2.total }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ dataPohovory.pohovory_statistics.basic_2.with_check_status }}
					</div>
				</div>
			</div>

			<div class="item">
				<div class="item-left">
					<p>Basic 3:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ dataPohovory.pohovory_statistics.basic_3.total }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ dataPohovory.pohovory_statistics.basic_3.with_check_status }}
					</div>
				</div>
			</div>

			<div class="item">
				<div class="item-left">
					<p>Basic 4:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ dataPohovory.pohovory_statistics.basic_4.total }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ dataPohovory.pohovory_statistics.basic_4.with_check_status }}
					</div>
				</div>
			</div>
		</div>

		<div class="p-2 bg-white font-semibold text-lg">Pohovory</div>

		<div class="bg-white p-4 rounded shadow mb-6">
			<BarChart :data="chartDataPohovory" />
		</div>

		<!-- Zoznam zaujatych po pohovore -->
		<h1 class="font-semibold mb-4 mt-8">Zoznam zaujatych ľudí po pohovore:</h1>
		<div class="max-h-[400px] overflow-y-auto bg-white max-w-[650px]">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50">
						<th class="p-3 text-left">Meno a Priezvisko</th>
						<th class="p-3 text-left">Dátum Pohovoru</th>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="kanditat in zaujatiKandidati"
						class="border-t cursor-pointer hover:bg-gray-50"
						@click="goToContact(kanditat.id)"
					>
						<td class="p-3">{{ kanditat.meno }} {{ kanditat.priezvisko }}</td>
						<td class="p-3">{{ formatDate(kanditat.date) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import BarChart from "~/components/BarChart.vue";
import axios from "axios";
const config = useRuntimeConfig();
import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useRouter } from "vue-router";
const router = useRouter();

const updateActivity = ref(false);
const activityID = ref(null);
const responseData = ref(null);
const toggleUpdateActivity = (id) => {
	activityID.value = id;
	if (updateActivity.value === true) {
		//location.reload();
	}
	updateActivity.value = !updateActivity.value;
};

// State
const zaujatiKandidati = ref([]);
const dateRange = ref({ from: "", to: "" });
const selectedPeriod = ref("month");
const selectedActivityType = ref("all");
const statistics = ref({ called: 0, reached: 0, scheduled: 0 });
const activities = ref([]);
const loadingStateCalendar = ref(false);
const dataPohovory = ref();

// Chart data computed property

const goToContact = (id) => {
	router.push(`/contact/${id}`);
};

const chartData = computed(() => ({
	labels: ["Volané", "Dovolané", "Dohodnuté"],
	datasets: [
		{
			data: [
				statistics.value.called,
				statistics.value.reached,
				statistics.value.scheduled,
			],
			backgroundColor: ["#93C5FD", "#86EFAC", "#C084FC"],
		},
	],
}));

const chartDataPohovory = computed(() => {
	// Guard clause to prevent errors when data isn't loaded yet
	if (!dataPohovory.value?.pohovory_statistics?.pohovor) {
		return {
			labels: ["Volané", "Dovolané", "Dohodnuté", "Zaujatý", "Nezaujatý"],
			datasets: [
				{
					data: [0, 0, 0, 0, 0], // Default values
					backgroundColor: [
						"#93C5FD",
						"#86EFAC",
						"#C084FC",
						"#FBBF24",
						"#F87171",
					],
				},
			],
		};
	}

	return {
		labels: ["Volané", "Dovolané", "Dohodnuté", "Zaujatý", "Nezaujatý"],
		datasets: [
			{
				data: [
					dataPohovory.value.pohovory_statistics.pohovor.volane,
					dataPohovory.value.pohovory_statistics.pohovor.dovolane,
					dataPohovory.value.pohovory_statistics.pohovor.dohodnute,
					dataPohovory.value.pohovory_statistics.pohovor.zaujaty,
					dataPohovory.value.pohovory_statistics.pohovor.nezaujaty,
				],
				backgroundColor: [
					"#93C5FD",
					"#86EFAC",
					"#C084FC",
					"#FBBF24",
					"#F87171",
				],
			},
		],
	};
});

// Methods
const formatCardTitle = (key) => {
	switch (key) {
		case "called":
			return "Volané";
		case "reached":
			return "Dovolané";
		case "scheduled":
			return "Dohodnuté";
		default:
			return "";
	}
};

// Methods
const fetchData = async () => {
	loadingStateCalendar.value = true;
	const fromDate = new Date(dateRange.value.from);
	const toDate = new Date(dateRange.value.to);
	toDate.setHours(23, 59, 59, 999); // Set to the end of the day

	try {
		const response = await axios.post(
			`${config.public.apiUrl}activity-statistics`,
			{
				from_date: fromDate.toISOString().split("T")[0],
				to_date: toDate.toISOString(),
				activity_type: selectedActivityType.value,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		responseData.value = response.data;
		statistics.value = response.data.statistics;
		activities.value = response.data.activities;

		const responsePohovory = await axios.post(
			`${config.public.apiUrl}statistics-pohovory`,
			{
				from_date: fromDate.toISOString().split("T")[0],
				to_date: toDate.toISOString(),
				activity_type: selectedActivityType.value,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);
		dataPohovory.value = responsePohovory.data;

		console.log("dataPohovory", dataPohovory.value.activities);

		zaujatiKandidati.value = dataPohovory.value.activities
			.filter(
				(activity) =>
					activity.type === "Pohovor" && activity.status == "zaujatý"
			)
			.map((activity) => ({
				id: activity.contact_id,
				meno: activity.meno,
				priezvisko: activity.priezvisko,
				date: activity.date,
			}));
	} catch (error) {
		console.error(
			"Error fetching statistics:",
			error.response?.data || error.message
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

const formatDate = (date) => {
	return new Date(date).toLocaleDateString("sk-SK");
};

// Lifecycle
onMounted(() => {
	updateDateRange();
});
</script>

<style scoped>
.container {
	padding: 50px 0;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(0, max-content));
	gap: 3rem;
}

.item {
	display: flex;
	gap: 24px;
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
