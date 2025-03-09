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

			<select
				v-model="selectedActivityType"
				class="border rounded p-2 bg-white shadow-md"
				@change="fetchData"
			>
				<option value="all">Všetky aktivity</option>
				<option value="Telefonát klient">Telefonát</option>
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
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import BarChart from "~/components/BarChart.vue";
import axios from "axios";
const config = useRuntimeConfig();
import { useAuthStore } from "#imports";
const authStore = useAuthStore();

const updateActivity = ref(false);
const activityID = ref(null);

const toggleUpdateActivity = (id) => {
	activityID.value = id;
	if (updateActivity.value === true) {
		//location.reload();
	}
	updateActivity.value = !updateActivity.value;
};

// State
const dateRange = ref({ from: "", to: "" });
const selectedPeriod = ref("month");
const selectedActivityType = ref("all");
const statistics = ref({ called: 0, reached: 0, scheduled: 0 });
const activities = ref([]);
const loadingStateCalendar = ref(false);

// Chart data computed property
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

	try {
		const fromDate = new Date(dateRange.value.from);
		const toDate = new Date(dateRange.value.to);
		toDate.setHours(23, 59, 59, 999); // Set to the end of the day

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

		statistics.value = response.data.statistics;
		console.log("Statistics:", response.data);
		activities.value = response.data.activities;
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
