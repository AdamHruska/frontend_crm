<template>
	<!-- The follower div -->

	<div
		v-if="showFollower"
		class="fixed bg-white p-4 shadow-xl rounded-xl w-[250px] max-h-[365px] z-50"
		:style="{
			left: `${mouseX + 15}px`,
			top: `${mouseY + 15}px`,
		}"
	>
		<p class="font-semibold">Zoznam ľudí</p>
		<div class="my-4 overflow-y-auto max-h-[280px]">
			<!--Checked people-->
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
					(p) => p.activity_status === 'check'
				)"
				:key="person.contact_id"
				class="py-1 cursor-pointer hover:bg-gray-100 px-2 rounded"
				@click="goToContact(person.contact_id)"
			>
				{{ person.meno }} {{ person.priezvisko }}
			</div>
			<!--Not checked people-->
			<p class="font-semibold">Ostatné</p>
			<div
				v-for="person in dataInFollower.filter(
					(p) => p.activity_status !== 'check'
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
				<option value="Telefonát klient">Telefonát klient</option>
			</select>

			<!-- Statistics Cards -->
			<div
				class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-sm bg-white p-4"
			>
				<div
					class="bg-blue-100 p-4 rounded"
					@mouseenter="
						() =>
							responseData?.grouped_activities?.volane &&
							showVolaneFollower(responseData.grouped_activities.volane)
					"
					@mouseleave="hideFollower"
				>
					<h3 class="font-bold">Volané</h3>
					<p class="text-2xl">{{ statistics.called }}</p>
				</div>
				<div
					class="bg-green-100 p-4 rounded"
					@mouseenter="
						() =>
							responseData?.grouped_activities?.dovolane &&
							showVolaneFollower(responseData.grouped_activities.dovolane)
					"
					@mouseleave="hideFollower"
				>
					<h3 class="font-bold">Dovolané</h3>
					<p class="text-2xl">{{ statistics.reached }}</p>
				</div>
				<div
					class="bg-purple-100 p-4 rounded"
					@mouseenter="
						() =>
							responseData?.grouped_activities?.dohodnute &&
							showVolaneFollower(responseData.grouped_activities.dohodnute)
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
							() => showVolaneFollower(otherActiviesNames['Prvé stretnutie'])
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left">
							<p>Prvé stretnutia:</p>
						</div>
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
							() =>
								showVolaneFollower(
									otherActiviesNames['Analýza osobných financií']
								)
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left">
							<p>Analýza osobných financií:</p>
						</div>
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
							() => showVolaneFollower(otherActiviesNames['poradenstvo nové'])
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left">
							<p>Poradenstvo nové:</p>
						</div>
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

						<div
							class="item"
							@mouseenter="
								() => showVolaneFollower(otherActiviesNames['realizácia'])
							"
							@mouseleave="hideFollower"
						>
							<div class="item-left">
								<p>Realizácie:</p>
							</div>
							<div class="item-right">
								<div class="right-count">
									Pocet vsetkych: {{ otherActivies["realizácia"]?.total || 0 }}
								</div>
								<div class="right-count green">
									Pocet zrealizovanych:
									{{ otherActivies["realizácia"]?.checked || 0 }}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="flex gap-32">
					<div
						class="item"
						@mouseenter="
							() => showVolaneFollower(otherActiviesNames['Servisná analýza'])
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left">
							<p>Servisná analýza:</p>
						</div>
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

					<div
						class="item"
						@mouseenter="
							() =>
								showVolaneFollower(otherActiviesNames['servisné poradenstvo'])
						"
						@mouseleave="hideFollower"
					>
						<div class="item-left">
							<p>Poradenstvo servisné:</p>
						</div>
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
						@mouseenter="() => showVolaneFollower(responseData.new_contacts)"
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
			<!-- <div class="bg-white rounded shadow">
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
			</div> -->
		</div>

		<!-- Pohovory Statistika -->
		<h1 class="text-2xl font-bold mb-4 mt-16">Štatistika pre Nábory</h1>

		<div class="p-2 bg-white font-semibold text-lg">Pohovory</div>

		<div class="bg-white p-4 rounded shadow mb-6">
			<BarChart :data="chartDataPohovory" />
		</div>

		<div class="container" v-if="seminarActivitesStatistics">
			<div
				class="item"
				@mouseenter="
					() => showVolaneFollower(seminarActivitesNames['welcome seminár'])
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left">
					<p>Welcome Seminár:</p>
				</div>
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
				@mouseenter="() => showVolaneFollower(seminarActivitesNames['basic 1'])"
				@mouseleave="hideFollower"
			>
				<div class="item-left">
					<p>Basic 1:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ seminarActivitesStatistics["basic 1"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 1"]?.checked || 0 }}
					</div>
				</div>
			</div>

			<div
				class="item"
				@mouseenter="() => showVolaneFollower(seminarActivitesNames['basic 2'])"
				@mouseleave="hideFollower"
			>
				<div class="item-left">
					<p>Basic 2:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ seminarActivitesStatistics["basic 2"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 2"]?.checked || 0 }}
					</div>
				</div>
			</div>

			<div
				class="item"
				@mouseenter="() => showVolaneFollower(seminarActivitesNames['basic 3'])"
				@mouseleave="hideFollower"
			>
				<div class="item-left">
					<p>Basic 3:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ seminarActivitesStatistics["basic 3"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["basic 3"]?.checked || 0 }}
					</div>
				</div>
			</div>

			<div
				class="item"
				@mouseenter="() => showVolaneFollower(seminarActivitesNames['basic 4'])"
				@mouseleave="hideFollower"
			>
				<div class="item-left">
					<p>Basic 4:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ seminarActivitesStatistics["basic 4"]?.total || 0 }}
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
					() => showVolaneFollower(seminarActivitesNames['Post info'])
				"
				@mouseleave="hideFollower"
			>
				<div class="item-left">
					<p>Post info:</p>
				</div>
				<div class="item-right">
					<div class="right-count">
						Všetky:
						{{ seminarActivitesStatistics["Post info"]?.total || 0 }}
					</div>
					<div class="right-count green">
						Zrealizované:
						{{ seminarActivitesStatistics["Post info"]?.checked || 0 }}
					</div>
				</div>
			</div>
		</div>

		<!-- Zoznam zaujatych po pohovore -->
		<h1 class="font-semibold mb-4 mt-8">Zoznam zaujatych ľudí po pohovore:</h1>
		<div class="max-h-[400px] overflow-y-auto bg-white max-w-[650px]">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50">
						<th class="p-3 text-left">Meno a Priezvisko</th>
						<!-- <th class="p-3 text-left">Dátum Pohovoru</th> -->
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="kanditat in zaujatiKandidati"
						class="border-t cursor-pointer hover:bg-gray-50"
						@click="goToContact(kanditat.id)"
					>
						<td class="p-3">{{ kanditat.meno }} {{ kanditat.priezvisko }}</td>
						<!-- <td class="p-3">{{ formatDate(kanditat.date) }}</td> -->
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
const responseData = ref({});
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
const selectedActivityType = ref("Telefonát klient");
const statistics = ref({ called: 0, reached: 0, scheduled: 0 });
const activities = ref([]);
const loadingStateCalendar = ref(false);
const dataPohovory = ref();

const mouseX = ref(0);
const mouseY = ref(0);
const showFollower = ref(false);

const dataInFollower = ref([]);

const showVolaneFollower = (data) => {
	console.log("showVolaneFollower triggered with:", data);
	dataInFollower.value = Array.isArray(data) ? data : [];
	if (dataInFollower.value.length === 0) {
		dataInFollower.value = [{ meno: "Žiadni ľudia", priezvisko: "" }];
	}
	showFollower.value = true;
};

const hideFollower = () => {
	showFollower.value = false;
	dataInFollower.value = [];
};

function handleMouseMove(e) {
	mouseX.value = e.clientX;
	mouseY.value = e.clientY;
}

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
	if (!dataPohovory.value) {
		return {
			labels: ["Volané", "Dovolané", "Dohodnuté", "Zrealizované", "Zaujatí"],
			datasets: [{ data: [0, 0, 0, 0, 0] }],
		};
	}

	return {
		labels: ["Volané", "Dovolané", "Dohodnuté", "Zrealizované", "Zaujatí"],
		datasets: [
			{
				data: [
					dataPohovory.value.called,
					dataPohovory.value.reached,
					dataPohovory.value.scheduled,
					dataPohovory.value.realized,
					dataPohovory.value.accepted,
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

const otherActivies = ref({});
const otherActiviesNames = ref([]);
const seminarActivitesStatistics = ref({});
const seminarActivitesNames = ref([]);
// Methods
const fetchData = async () => {
	loadingStateCalendar.value = true;
	const fromDate = new Date(dateRange.value.from);
	const toDate = new Date(dateRange.value.to);
	toDate.setDate(toDate.getDate() + 1); // Include the entire 'to' date
	toDate.setHours(23, 59, 59, 999); // Set to the end of the day
	console.log("fromDate", fromDate);
	console.log("toDate", toDate);
	console.log("aktivity", selectedActivityType.value);
	try {
		const response = await axios.get(
			`${config.public.apiUrl}telefonat-klient-statistics`,
			{
				params: {
					from_date: fromDate.toISOString().split("T")[0], // e.g. "2025-08-18"
					to_date: toDate.toISOString().split("T")[0], // e.g. "2025-09-18"
					activity_type: selectedActivityType.value, // optional
				},
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		responseData.value = response.data;
		console.log("skuska", responseData.value);
		statistics.value = response.data.statistics;
		activities.value = response.data.activities;

		const responsePohovory = await axios.get(
			`${config.public.apiUrl}pohovory-statistics`,
			{
				params: {
					from_date: fromDate.toISOString().split("T")[0], // e.g. "2025-08-18"
					to_date: toDate.toISOString().split("T")[0], // e.g. "2025-09-18"
					activity_type: selectedActivityType.value, // optional
				},
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);
		console.log("responsePohovory", responsePohovory.data.statistics);
		dataPohovory.value = responsePohovory.data.statistics;

		const otherActivitiesData = await axios.get(
			`${config.public.apiUrl}other-activities-statistics`,
			{
				params: {
					from_date: fromDate.toISOString().split("T")[0], // e.g. "2025-08-18"
					to_date: toDate.toISOString().split("T")[0], // e.g. "2025-09-18"
					activity_type: selectedActivityType.value, // optional
				},
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		otherActivies.value = otherActivitiesData.data.statistics;
		otherActiviesNames.value = otherActivitiesData.data.activities_by_type;

		console.log(
			"otherActiviesNames",
			otherActiviesNames.value["Analýza osobných financií"]
		);
		const seminarActivitesStatisticsResponse = await axios.get(
			`${config.public.apiUrl}seminar-activities-statistics`,
			{
				params: {
					from_date: fromDate.toISOString().split("T")[0], // e.g. "2025-08-18"
					to_date: toDate.toISOString().split("T")[0], // e.g. "2025-09-18"
					activity_type: selectedActivityType.value, // optional
				},
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		seminarActivitesStatistics.value =
			seminarActivitesStatisticsResponse.data.statistics;

		seminarActivitesNames.value =
			seminarActivitesStatisticsResponse.data.activities_by_type;
		console.log("seminarActivitesNames", seminarActivitesNames.value);
		// 	const responsePohovory = await axios.post(
		// 		`${config.public.apiUrl}statistics-pohovory`,
		// 		{
		// 			from_date: fromDate.toISOString().split("T")[0],
		// 			to_date: toDate.toISOString(),
		// 			activity_type: selectedActivityType.value,
		// 		},
		// 		{
		// 			headers: {
		// 				Authorization: `Bearer ${authStore.token}`,
		// 			},
		// 		}
		// 	);
		// 	dataPohovory.value = responsePohovory.data;

		// 	console.log("dataPohovory", dataPohovory.value.activities);

		// 	zaujatiKandidati.value = dataPohovory.value.activities
		// 		.filter(
		// 			(activity) =>
		// 				activity.type === "Pohovor" && activity.status == "zaujatý"
		// 		)
		// 		.map((activity) => ({
		// 			id: activity.contact_id,
		// 			meno: activity.meno,
		// 			priezvisko: activity.priezvisko,
		// 			date: activity.date,
		// 		}));

		const interviewCandidatesResponse = await axios.get(
			`${config.public.apiUrl}interview-candidates`,
			{
				params: {
					from_date: fromDate.toISOString().split("T")[0], // e.g. "2025-08-18"
					to_date: toDate.toISOString().split("T")[0], // e.g. "2025-09-18"
					activity_type: selectedActivityType.value, // optional
				},
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);
		zaujatiKandidati.value = interviewCandidatesResponse.data.candidates;
		console.log("zaujatiKandidati", zaujatiKandidati.value);
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

function handleMouseEnter() {
	showFollower.value = true;
}

function handleMouseLeave() {
	showFollower.value = false;
}

// Lifecycle
onMounted(() => {
	updateDateRange();
	window.addEventListener("mousemove", handleMouseMove);

	// REMOVE THIS SECTION - it's causing the conflict
	// const items = document.querySelectorAll(".item");
	// items.forEach((item) => {
	// 	item.addEventListener("mouseenter", handleMouseEnter);
	// 	item.addEventListener("mouseleave", handleMouseLeave);
	// });
});

onBeforeUnmount(() => {
	window.removeEventListener("mousemove", handleMouseMove);

	// REMOVE THIS SECTION TOO
	// const items = document.querySelectorAll(".item");
	// items.forEach((item) => {
	// 	item.removeEventListener("mouseenter", handleMouseEnter);
	// 	item.removeEventListener("mouseleave", handleMouseLeave);
	// });
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
