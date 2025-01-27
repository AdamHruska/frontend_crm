<!-- pages/statistics.vue -->
<template>
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
					/>
				</div>
				<div>
					<label class="block text-sm mb-1">Do</label>
					<input
						type="date"
						v-model="dateRange.to"
						class="border rounded p-2 bg-white shadow-sm"
					/>
				</div>

				<!-- Period Quick Select -->
				<select
					v-model="selectedPeriod"
					class="border rounded p-2 bg-white shadow-sm"
					@change="updateDateRange"
				>
					<option value="week">Týždeň</option>
					<option value="month">Mesiac</option>
					<option value="quarter">Štvrťrok</option>
					<option value="halfYear">Polrok</option>
					<option value="year">Rok</option>
				</select>
			</div>

			<!-- Activity Type Filter -->
			<div class="mb-4">
				<label class="block text-sm mb-1">Typ aktivity</label>
				<select
					v-model="selectedActivityType"
					class="border rounded p-2 bg-white shadow-md"
				>
					<option value="all">Všetky aktivity</option>
					<option value="telefonat">Telefonát</option>
					<option value="klient">Prvé stretnutie</option>
					<option value="aof">AOF</option>
					<option value="poradenstvo">Poradenstvo</option>
					<option value="realizacia">Realizácia</option>
				</select>
			</div>

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
					<tbody>
						<tr
							v-for="activity in filteredActivities"
							:key="activity.id"
							class="border-t"
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

// State
const dateRange = ref({ from: "", to: "" });
const selectedPeriod = ref("month");
const selectedActivityType = ref("all");

// Mock data - replace with actual API calls
const activities = ref([
	{
		id: 1,
		meno: "Olivia",
		priezvisko: "Martinez",
		type: "telefonat",
		date: "2024-01-15",
		status: "volané",
	},
	// Add more mock data...
]);

// Computed properties
const filteredActivities = computed(() => {
	return activities.value.filter((activity) => {
		if (
			selectedActivityType.value !== "all" &&
			activity.type !== selectedActivityType.value
		) {
			return false;
		}
		const activityDate = new Date(activity.date);
		return (
			activityDate >= new Date(dateRange.value.from) &&
			activityDate <= new Date(dateRange.value.to)
		);
	});
});

const statistics = computed(() => {
	const filtered = filteredActivities.value;
	return {
		called: filtered.filter((a) => a.status === "volané").length,
		reached: filtered.filter((a) => a.status === "dovolané").length,
		scheduled: filtered.filter((a) => a.status === "dohodnuté").length,
	};
});

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
};

const formatDate = (date) => {
	return new Date(date).toLocaleDateString("sk-SK");
};

// Lifecycle
onMounted(() => {
	updateDateRange();
});
</script>
