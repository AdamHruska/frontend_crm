<template>
	<Loadigcomponent v-if="loadingState" />
	<div
		class="min-h-screen bg-slate-50 text-slate-800 font-['DM_Sans',sans-serif]"
	>
		<!-- Google Fonts -->
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link
			href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
			rel="stylesheet"
		/>

		<!-- Header -->
		<div
			class="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50 shadow-sm"
		>
			<div
				class="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between"
			>
				<div class="flex items-center gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm"
					>
						<svg
							class="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</div>
					<span class="font-semibold text-slate-900 tracking-tight"
						>Mesačný prehľad</span
					>
				</div>

				<!-- Date Range Picker -->
				<div class="flex items-center gap-3">
					<div
						class="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm relative"
					>
						<input
							type="date"
							v-model="dateFrom"
							class="bg-transparent text-sm text-slate-700 border-none outline-none"
						/>
						<svg
							class="w-4 h-4 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<span class="text-slate-400 text-sm">—</span>
					<div
						class="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm"
					>
						<input
							type="date"
							v-model="dateTo"
							class="bg-transparent text-sm text-slate-700 border-none outline-none"
						/>
						<svg
							class="w-4 h-4 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>

					<!-- View toggle -->
					<div
						class="flex items-center bg-slate-100 border border-slate-200 rounded-lg overflow-hidden"
					>
						<button
							@click="viewMode = 'moje'"
							:class="
								viewMode === 'moje'
									? 'bg-indigo-600 text-white'
									: 'text-slate-500 hover:text-slate-800'
							"
							class="px-3 py-2 text-sm font-medium transition-colors"
						>
							Moje
						</button>
						<button
							@click="viewMode = 'tim'"
							:class="
								viewMode === 'tim'
									? 'bg-indigo-600 text-white'
									: 'text-slate-500 hover:text-slate-800'
							"
							class="px-3 py-2 text-sm font-medium transition-colors"
						>
							Tím
						</button>
					</div>
				</div>
			</div>
		</div>

		<div class="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
			<!-- SUMMARY CARDS -->
			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
				<div
					v-for="stat in summaryStats"
					:key="stat.label"
					class="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col gap-1 shadow-sm"
				>
					<span
						class="text-xs text-slate-400 uppercase tracking-widest font-medium"
						>{{ stat.label }}</span
					>
					<span
						class="text-2xl font-semibold text-slate-900 font-['DM_Mono']"
						>{{ stat.value }}</span
					>
				</div>
			</div>

			<!-- TABLE 1 — NOVÉ VECI -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<div class="w-1 h-6 rounded-full bg-indigo-500"></div>
						<h2 class="text-base font-semibold text-slate-900 tracking-tight">
							Nové veci
						</h2>
						<span
							class="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5 font-medium"
						>
							{{ filteredNove.length }} klientov
						</span>
					</div>
					<div class="flex items-center gap-4 text-xs text-slate-500">
						<span class="flex items-center gap-1.5"
							><span
								class="w-2 h-2 rounded-full bg-emerald-500 inline-block"
							></span
							>Vykonané</span
						>
						<span class="flex items-center gap-1.5"
							><span
								class="w-2 h-2 rounded-full bg-rose-500 inline-block"
							></span
							>Neprebehlo</span
						>
						<span class="flex items-center gap-1.5"
							><span
								class="w-2 h-2 rounded-full bg-amber-400 inline-block"
							></span
							>Dohodnuté</span
						>
					</div>
				</div>

				<div
					class="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-sm"
				>
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-slate-200 bg-slate-50">
								<th
									class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Priezvisko Meno
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									1. stretnutie
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Dátum AoF
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Počet mien v AoF
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Poradenstvo
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Realizácia
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="row in filteredNove"
								:key="row.id"
								:class="rowColorClass(row)"
								class="border-b border-slate-100 transition-colors last:border-0 cursor-pointer"
								@click="navigateTo(`/contact/${row.id}`)"
							>
								<td
									class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap"
								>
									<div class="flex items-center gap-2">
										<span
											:class="rowDot(row)"
											class="w-2 h-2 rounded-full flex-shrink-0"
										></span>
										{{ row.priezvisko }} {{ row.meno }}
									</div>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumPrvStretnutie"
										:done="row.prvStretnutieDone"
										:status="row.prvStretnutieStatus"
									/>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumAoF"
										:done="row.aofDone"
										:status="row.aofStatus"
									/>
								</td>
								<td class="px-4 py-3 text-center">
									<span
										v-if="row.mienAoF"
										class="font-['DM_Mono'] text-slate-700 font-medium"
										>{{ row.mienAoF }}</span
									>
									<span v-else class="text-slate-300">—</span>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumPoradenstvo"
										:done="row.poradenstvoD"
										:status="row.poradenstvoStatus"
									/>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumRealizacia"
										:done="row.realizaciaD"
										:status="row.realizaciaStatus"
									/>
								</td>
							</tr>
							<tr v-if="filteredNove.length === 0">
								<td
									colspan="7"
									class="px-4 py-8 text-center text-slate-400 text-sm"
								>
									Žiadni klienti v tomto období
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- TABLE 2 — SERVISNÉ VECI -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<div class="w-1 h-6 rounded-full bg-teal-500"></div>
						<h2 class="text-base font-semibold text-slate-900 tracking-tight">
							Servisné veci
						</h2>
						<span
							class="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5 font-medium"
						>
							{{ filteredServisne.length }} klientov
						</span>
					</div>
				</div>

				<div
					class="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-sm"
				>
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-slate-200 bg-slate-50">
								<th
									class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Priezvisko Meno
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Serv. analýza
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Serv. poradenstvo
								</th>

								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Mien v analýze
								</th>
								<th
									class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
								>
									Serv. realizácia
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="row in filteredServisne"
								:key="row.id"
								:class="rowColorClass(row)"
								class="border-b border-slate-100 transition-colors last:border-0 cursor-pointer"
								@click="navigateTo(`/contact/${row.id}`)"
							>
								<td
									class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap"
								>
									<div class="flex items-center gap-2">
										<span
											:class="rowDot(row)"
											class="w-2 h-2 rounded-full flex-shrink-0"
										></span>
										{{ row.priezvisko }} {{ row.meno }}
									</div>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumServisAnalyza"
										:done="row.servisAnalyzaD"
										:status="row.servisAnalyzaStatus"
									/>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumServisPoradenstvo"
										:done="row.servisPoradenstvoD"
										:status="row.servisPoradenstvoStatus"
									/>
								</td>

								<td class="px-4 py-3 text-center">
									<span
										v-if="row.mienAoF"
										class="font-['DM_Mono'] text-slate-700 font-medium"
										>{{ row.mienAoF }}</span
									>
									<span v-else class="text-slate-300">—</span>
								</td>
								<td class="px-4 py-3 text-center">
									<DateCell
										:date="row.datumServisRealizacia"
										:done="row.servisRealizaciaD"
										:status="row.servisRealizaciaStatus"
									/>
								</td>
							</tr>
							<tr v-if="filteredServisne.length === 0">
								<td
									colspan="6"
									class="px-4 py-8 text-center text-slate-400 text-sm"
								>
									Žiadni klienti v tomto období
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>
	</div>
</template>

<script setup>
const config = useRuntimeConfig();
import axios from "axios";

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

import { useToast } from "vue-toastification";
const toast = useToast();

const klienti = ref([]);

function formatLocalDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const today = new Date();

const dateFrom = ref(
	formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
);

const dateTo = ref(formatLocalDate(today));

const viewMode = ref("moje");

const loadingState = ref(false);

const fetchData = async () => {
	loadingState.value = true;
	const res = await axios.get(`${config.public.apiUrl}monthly-overview`, {
		params: {
			from: dateFrom.value,
			to: dateTo.value,
		},
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	klienti.value = res.data;
	loadingState.value = false;
};

onMounted(() => {
	fetchData();
});

// watch([dateFrom, dateTo], () => {
// 	fetchData();
// });

watch([dateFrom, dateTo], ([newFrom, newTo]) => {
	fetchData();
});

const filteredNove = computed(() =>
	klienti.value.filter((r) => r.typ === "nove"),
);

const filteredServisne = computed(() =>
	klienti.value.filter((r) => r.typ === "servisne"),
);

function rowColorClass(row) {
	if (row.status === "green") return "bg-emerald-50 hover:bg-emerald-100/70";
	if (row.status === "red") return "bg-rose-50 hover:bg-rose-100/70";
	if (row.status === "orange") return "bg-amber-50 hover:bg-amber-100/70";
	return "hover:bg-slate-50";
}

function rowDot(row) {
	if (row.status === "green") return "bg-emerald-500";
	if (row.status === "red") return "bg-rose-500";
	if (row.status === "orange") return "bg-amber-400";
	return "bg-slate-300";
}

const summaryStats = computed(() => {
	const all = [...filteredNove.value, ...filteredServisne.value];
	const green = all.filter((r) => r.status === "green").length;
	const red = all.filter((r) => r.status === "red").length;
	const orange = all.filter((r) => r.status === "orange").length;
	const mien = all.reduce((s, r) => s + (r.mienAoF || 0), 0);
	const odp = all.reduce((s, r) => s + (r.odporucania || 0), 0);

	const mienAoF = filteredNove.value.reduce(
		(sum, r) => sum + (r.mienAoF || 0),
		0,
	);
	const mienAnalyza = filteredServisne.value.reduce(
		(sum, r) => sum + (r.mienAoF || 0),
		0,
	);

	const novychKlientov = mienAoF + mienAnalyza;
	return [{ label: "Nových klientov", value: novychKlientov }];
});
</script>
