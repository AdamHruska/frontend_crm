<template>
	<!-- The follower div -->
	<div class="bg-gray-50 min-h-screen">
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
						dataInFollower.filter((p) => p.activity_status === 'check')
							.length !== 0
					"
				>
					Zrealizované
				</p>
				<!-- Real links so middle-click / Ctrl+click opens the contact in a new tab -->
				<template
					v-for="person in dataInFollower.filter(
						(p) => p.activity_status === 'check',
					)"
					:key="person.contact_id"
				>
					<a
						v-if="person.contact_id"
						:href="`/contact/${person.contact_id}`"
						class="block py-1 cursor-pointer hover:bg-gray-100 px-2 rounded"
						@click="openContact($event, person.contact_id)"
					>
						{{ person.meno }} {{ person.priezvisko }}
					</a>
					<div v-else class="py-1 px-2">
						{{ person.meno }} {{ person.priezvisko }}
					</div>
				</template>
				<p class="font-semibold">Ostatné</p>
				<template
					v-for="person in dataInFollower.filter(
						(p) => p.activity_status !== 'check',
					)"
					:key="person.contact_id"
				>
					<a
						v-if="person.contact_id"
						:href="`/contact/${person.contact_id}`"
						class="block py-1 cursor-pointer hover:bg-gray-100 px-2 rounded"
						@click="openContact($event, person.contact_id)"
					>
						{{ person.meno }} {{ person.priezvisko }}
					</a>
					<div v-else class="py-1 px-2">
						{{ person.meno }} {{ person.priezvisko }}
					</div>
				</template>
			</div>
		</div>

		<loadigcomponent v-if="loadingStateCalendar" />

		<div class="p-6 max-w-[1400px] mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-bold mb-6">Štatistika aktivít</h1>

				<!-- Date Range Picker & Filters -->
				<div class="flex flex-wrap items-end gap-4 mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
					<div>
						<label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Od</label>
						<input
							type="date"
							v-model="dateRange.from"
							class="border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm"
							@change="fetchData"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Do</label>
						<input
							type="date"
							v-model="dateRange.to"
							class="border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm"
							@change="fetchData"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Obdobie</label>
						<select
							v-model="selectedPeriod"
							class="border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm"
							@change="updateDateRange"
						>
							<option value="week">Týždeň</option>
							<option value="month">Mesiac</option>
							<option value="quarter">Štvrťrok</option>
							<option value="halfYear">Polrok</option>
							<option value="year">Rok</option>
						</select>
					</div>
					<div>
						<div class="relative w-72" ref="dropdownRef">
							<label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Používatelia</label>
							<button
								type="button"
								class="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
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

							<div
								v-if="dropdownOpen"
								class="absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto"
							>
								<label
									class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
								>
									<input
										type="checkbox"
										:checked="includeMyStats"
										@change="toggleMyStats"
										class="rounded"
									/>
									<span class="text-sm font-medium">Moje štatistiky</span>
								</label>

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
									<span class="text-sm">
										{{ user.name }}
										<span
											v-if="user.isTransitive"
											class="text-xs text-gray-400 ml-1"
										>
											(zdieľaný)
										</span>
									</span>
								</label>

								<div class="border-t border-gray-100 px-3 py-2 flex gap-2">
									<button
										type="button"
										class="text-xs text-indigo-600 hover:underline"
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
					</div>

					<!-- Refresh -->
					<div class="ml-auto flex items-center gap-3">
						<span v-if="loadedAtLabel" class="text-xs text-gray-400">
							Načítané o {{ loadedAtLabel }}
						</span>
						<button
							type="button"
							class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							:disabled="loadingStateCalendar"
							title="Znova načítať štatistiky"
							@click="fetchData"
						>
							<svg
								class="w-4 h-4"
								:class="{ 'animate-spin': loadingStateCalendar }"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Obnoviť
						</button>
					</div>
				</div>

				<!-- ── Telefonát klient Section ── -->
				<div class="mb-10">
					<h2 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
						Štatistika Telefonát klient
					</h2>

					<!-- Main Stats Cards -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
						<div
							class="stat-card stat-card-blue group"
							@mouseenter="
								(e) =>
									responseData?.grouped_activities?.volane &&
									showVolaneFollower(responseData.grouped_activities.volane, e)
							"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-blue-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-500">Volané</p>
								<p class="text-3xl font-bold">{{ statistics.called }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-green group"
							@mouseenter="
								(e) =>
									responseData?.grouped_activities?.dovolane &&
									showVolaneFollower(responseData.grouped_activities.dovolane, e)
							"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-green-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-500">Dovolané</p>
								<p class="text-3xl font-bold">{{ statistics.reached }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-purple group"
							@mouseenter="
								(e) =>
									responseData?.grouped_activities?.dohodnute &&
									showVolaneFollower(responseData.grouped_activities.dohodnute, e)
							"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-purple-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-500">Dohodnuté</p>
								<p class="text-3xl font-bold">{{ statistics.scheduled }}</p>
							</div>
						</div>
					</div>

					<!-- Other Activities Grid -->
					<div v-if="otherActivies" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<div
							v-for="actKey in [
								'Prvé stretnutie',
								'Analýza osobných financí',
								'poradenstvo nové',
								'realizácia nová',
								'realizácia servisná',
								'Servisná analýza',
								'servisné poradenstvo',
							]"
							:key="actKey"
							class="activity-card"
							@mouseenter="
								(e) => showVolaneFollower(otherActiviesNames[actKey], e)
							"
							@mouseleave="hideFollower"
						>
							<div class="activity-card-header">
								<h4 class="font-semibold text-sm">{{ actKey }}</h4>
							</div>
							<div class="activity-card-body">
								<div class="activity-stat">
									<span class="activity-stat-label">Celkom</span>
									<span class="activity-stat-value">{{ otherActivies[actKey]?.total || 0 }}</span>
								</div>
								<div class="activity-stat activity-stat-checked">
									<span class="activity-stat-label">Zrealizované</span>
									<span class="activity-stat-value text-green-600">{{ otherActivies[actKey]?.checked || 0 }}</span>
								</div>
							</div>
						</div>

						<!-- New Contacts Cards -->
						<div class="activity-card">
							<div class="activity-card-header">
								<h4 class="font-semibold text-sm">Nové kontakty</h4>
							</div>
							<div class="activity-card-body">
								<div class="activity-stat">
									<span
										class="activity-stat-label cursor-help"
										@mouseenter="(e) => showVolaneFollower(responseData.new_contacts, e)"
										@mouseleave="hideFollower"
									>Klienti</span>
									<span class="activity-stat-value">
										{{ responseData?.new_contacts?.filter((c) => c.isContact).length || 0 }}
									</span>
								</div>
								<div class="activity-stat activity-stat-checked">
									<span
										class="activity-stat-label cursor-help"
										@mouseenter.stop="(e) => showVolaneFollower(responseData.new_contacts?.filter((c) => c.isCoWorker), e)"
										@mouseleave.stop="hideFollower"
									>Spolupracovníci</span>
									<span class="activity-stat-value text-green-600">
										{{ responseData?.new_contacts?.filter((c) => c.isCoWorker).length || 0 }}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ── Pohovory Section ── -->
				<div class="mb-10">
					<h2 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
						Štatistika pre Nábory
					</h2>
					<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pohovory</p>

					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
						<div
							class="stat-card stat-card-blue"
							@mouseenter="(e) => showPohovoryFollower('called', e)"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-blue-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
							</div>
							<div>
								<p class="text-xs font-medium text-gray-500">Volané</p>
								<p class="text-2xl font-bold">{{ dataPohovory?.statistics?.called || 0 }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-green"
							@mouseenter="(e) => showPohovoryFollower('reached', e)"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-green-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
							</div>
							<div>
								<p class="text-xs font-medium text-gray-500">Dovolané</p>
								<p class="text-2xl font-bold">{{ dataPohovory?.statistics?.reached || 0 }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-purple"
							@mouseenter="(e) => showPohovoryFollower('scheduled', e)"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-purple-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
							</div>
							<div>
								<p class="text-xs font-medium text-gray-500">Dohodnuté</p>
								<p class="text-2xl font-bold">{{ dataPohovory?.statistics?.scheduled || 0 }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-amber"
							@mouseenter="(e) => showPohovoryFollower('realized', e)"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-amber-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							</div>
							<div>
								<p class="text-xs font-medium text-gray-500">Zrealizované</p>
								<p class="text-2xl font-bold">{{ dataPohovory?.statistics?.realized || 0 }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-orange"
							@mouseenter="(e) => showPohovoryFollower('konfirmacny_servis_all', e)"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-orange-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
							</div>
							<div>
								<p class="text-xs font-medium text-gray-500">Konf. servis</p>
								<p class="text-2xl font-bold">{{ dataPohovory?.statistics?.konfirmacny_servis_all || 0 }}</p>
							</div>
						</div>
						<div
							class="stat-card stat-card-rose"
							@mouseenter="(e) => showPohovoryFollower('accepted', e)"
							@mouseleave="hideFollower"
						>
							<div class="stat-card-icon bg-rose-500">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							</div>
							<div>
								<p class="text-xs font-medium text-gray-500">Zaujatí</p>
								<p class="text-2xl font-bold">
									{{ dataPohovory?.statistics?.accepted || 0 }}
									<span class="text-xs font-normal text-gray-400 block">pohovory</span>
								</p>
								<p
									class="text-lg font-bold mt-1 cursor-help"
									@mouseenter.stop="(e) => showPohovoryFollower('konfirmacny_servis', e)"
									@mouseleave.stop="hideFollower"
								>
									{{ dataPohovory?.statistics?.konfirmacny_servis || 0 }}
									<span class="text-xs font-normal text-gray-400 block">konf. servis</span>
								</p>
							</div>
						</div>
					</div>

					<!-- Seminar Activities -->
					<div v-if="seminarActivitesStatistics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<div
							v-for="seminarKey in [
								'welcome seminár',
								'basic 1',
								'basic 2',
								'basic 3',
								'basic 4',
								'Post info',
							]"
							:key="seminarKey"
							class="activity-card"
							@mouseenter="(e) => showVolaneFollower(seminarActivitesNames[seminarKey], e)"
							@mouseleave="hideFollower"
						>
							<div class="activity-card-header">
								<h4 class="font-semibold text-sm">{{ seminarKey }}</h4>
							</div>
							<div class="activity-card-body">
								<div class="activity-stat">
									<span class="activity-stat-label">Celkom</span>
									<span class="activity-stat-value">{{ seminarActivitesStatistics[seminarKey]?.total || 0 }}</span>
								</div>
								<div class="activity-stat activity-stat-checked">
									<span class="activity-stat-label">Zrealizované</span>
									<span class="activity-stat-value text-green-600">{{ seminarActivitesStatistics[seminarKey]?.checked || 0 }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ── Zaujatí kandidáti ── -->
				<div class="mb-10">
					<h2 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
						Zoznam zaujatých ľudí po pohovore
					</h2>
					<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-[1100px]">
						<div class="max-h-[500px] overflow-y-auto">
							<table class="w-full">
								<thead class="bg-gray-50 sticky top-0">
									<tr>
										<th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Meno a Priezvisko</th>
										<th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Dátum pohovoru</th>
										<th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ďalšie udalosti po pohovore</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-100">
									<tr
										v-for="kanditat in zaujatiKandidati"
										:key="kanditat.activity_id"
										class="hover:bg-indigo-50 transition-colors align-top"
									>
										<td class="px-5 py-3 text-sm whitespace-nowrap">
											<a
												:href="`/contact/${kanditat.contact_id}`"
												class="font-medium text-indigo-600 hover:underline"
												@click="openContact($event, kanditat.contact_id)"
											>
												{{ kanditat.meno }} {{ kanditat.priezvisko }}
											</a>
											<span
												v-if="kanditat.is_shared"
												class="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700"
												title="Kontakt vám bol zdieľaný iným používateľom"
											>
												zdieľaný
											</span>
										</td>
										<td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
											{{ formatDateTime(kanditat.datumCas) }}
										</td>
										<td class="px-5 py-3 text-sm">
											<div
												v-if="kanditat.events_after?.length"
												class="flex flex-wrap gap-1.5"
											>
												<span
													v-for="ev in kanditat.events_after"
													:key="ev.id"
													class="event-pill"
													:class="statusClass(ev.activity_status)"
													:title="statusLabel(ev.activity_status)"
												>
													{{ statusIcon(ev.activity_status) }}
													{{ ev.aktivita }}
													<span class="opacity-70">· {{ formatDateTime(ev.datumCas) }}</span>
												</span>
											</div>
											<span v-else class="text-gray-400">Žiadne ďalšie udalosti</span>
										</td>
									</tr>
									<tr v-if="zaujatiKandidati.length === 0">
										<td colspan="3" class="px-5 py-6 text-center text-sm text-gray-400">Žiadni kandidáti v tomto období</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
const config = useRuntimeConfig();

import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useUserStore } from "#imports";
const userStore = useUserStore();

import { useRouter } from "vue-router";
const router = useRouter();

// Filters + loaded data live in Pinia, so they survive navigating to other pages
import { storeToRefs } from "pinia";
import { useStatisticsStore } from "~/stores/statisticsStore";
const statsStore = useStatisticsStore();
const {
	dateRange,
	selectedPeriod,
	selectedUserIds,
	includeMyStats,
	statistics,
	responseData,
	dataPohovory,
	otherActivies,
	otherActiviesNames,
	seminarActivitesStatistics,
	seminarActivitesNames,
	zaujatiKandidati,
	loadedAt,
} = storeToRefs(statsStore);

// ─── Multi-select dropdown state ───────────────────────────────────────────
const dropdownOpen = ref(false);
const dropdownRef = ref(null);

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

const handleClickOutside = (e) => {
	if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
		dropdownOpen.value = false;
	}
};

// ─── State ──────────────────────────────────────────────────────────────────
const isHoveringFollower = ref(false);
let hideTimeout = null;

const sharedUsers = computed(() => {
	const directUsers = (userStore.sharedUsers || []).map((u) => ({
		id: u.id,
		name: u.username || `${u.first_name} ${u.last_name}`,
		isTransitive: false,
	}));

	const transitiveUsers = (userStore.transitiveSharedUsers || []).map((u) => ({
		id: u.id,
		name: u.username || `${u.first_name} ${u.last_name}`,
		isTransitive: true,
	}));

	return [...directUsers, ...transitiveUsers];
});

const selectedActivityType = ref("Telefonát klient");
const loadingStateCalendar = ref(false);

const mouseX = ref(0);
const mouseY = ref(0);
const showFollower = ref(false);
const dataInFollower = ref([]);

const loadedAtLabel = computed(() =>
	loadedAt.value
		? new Date(loadedAt.value).toLocaleTimeString("sk-SK", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: "",
);

// ─── Helpers ────────────────────────────────────────────────────────────────
const showVolaneFollower = (data, event) => {
	if (hideTimeout) clearTimeout(hideTimeout);
	dataInFollower.value = Array.isArray(data) ? data : [];
	if (dataInFollower.value.length === 0) {
		dataInFollower.value = [{ meno: "Žiadni ľudia", priezvisko: "" }];
	}
	mouseX.value = event.clientX;
	mouseY.value = event.clientY;
	showFollower.value = true;
};

const hideFollower = () => {
	if (hideTimeout) clearTimeout(hideTimeout);
	hideTimeout = setTimeout(() => {
		if (!isHoveringFollower.value) {
			showFollower.value = false;
			dataInFollower.value = [];
		}
	}, 300);
};

const goToContact = (id) => {
	router.push(`/contact/${id}`);
};

// Plain left-click navigates in-app; Ctrl/Cmd/Shift-click and middle-click
// fall through to the browser so the contact opens in a new tab/window
const openContact = (event, id) => {
	if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0)
		return;
	event.preventDefault();
	goToContact(id);
};

const formatDateTime = (value) => {
	if (!value) return "—";
	const date = new Date(String(value).replace(" ", "T"));
	if (isNaN(date)) return value;
	return date.toLocaleString("sk-SK", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const STATUS_META = {
	check: { icon: "✓", label: "Dokončené", cls: "pill-check" },
	accepted: { icon: "👍", label: "Prijaté", cls: "pill-check" },
	discarded: { icon: "✕", label: "Zamietnuté", cls: "pill-discarded" },
	rejected: { icon: "👎", label: "Odmietnuté", cls: "pill-discarded" },
	questionmark: { icon: "?", label: "Otáznik", cls: "pill-question" },
};
const statusIcon = (s) => STATUS_META[s]?.icon ?? "•";
const statusLabel = (s) => STATUS_META[s]?.label ?? "Naplánované";
const statusClass = (s) => STATUS_META[s]?.cls ?? "pill-planned";

const showPohovoryFollower = (key, event) => {
	if (hideTimeout) clearTimeout(hideTimeout);
	if (
		!dataPohovory.value?.grouped_people?.[key] ||
		dataPohovory.value.grouped_people[key].length === 0
	) {
		dataInFollower.value = [{ meno: "Žiadni ľudia", priezvisko: "" }];
	} else {
		dataInFollower.value = dataPohovory.value.grouped_people[key];
	}
	mouseX.value = event.clientX;
	mouseY.value = event.clientY;
	showFollower.value = true;
};

// ─── Fetch ──────────────────────────────────────────────────────────────────
// Only the newest request may write its result (filters can change while loading)
let fetchSeq = 0;

const fetchData = async () => {
	const seq = ++fetchSeq;
	const requestKey = statsStore.filtersKey;
	loadingStateCalendar.value = true;
	const fromDate = new Date(dateRange.value.from);
	const toDate = new Date(dateRange.value.to);
	toDate.setDate(toDate.getDate() + 1);
	toDate.setHours(23, 59, 59, 999);

	const from_date = fromDate.toISOString().split("T")[0];
	const to_date = toDate.toISOString().split("T")[0];

	const userIdList = [
		...(includeMyStats.value ? [null] : []),
		...selectedUserIds.value,
	];

	if (userIdList.length === 0) {
		if (seq === fetchSeq) loadingStateCalendar.value = false;
		return;
	}

	try {
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

		// A newer request was started meanwhile -> drop this outdated result
		if (seq !== fetchSeq) return;

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
			rejected: 0,
			konfirmacny_servis: 0,
			konfirmacny_servis_all: 0,
		};
		const mergedPohovoryPeople = {
			called: [],
			reached: [],
			scheduled: [],
			realized: [],
			accepted: [],
			rejected: [],
			konfirmacny_servis: [],
			konfirmacny_servis_all: [],
		};

		allResults.forEach(([, r]) => {
			[
				"called",
				"reached",
				"scheduled",
				"realized",
				"accepted",
				"rejected",
				"konfirmacny_servis",
				"konfirmacny_servis_all",
			].forEach((k) => {
				sumPohovory[k] += r.data.statistics?.[k] || 0;
				if (r.data.grouped_people?.[k])
					mergedPohovoryPeople[k].push(...r.data.grouped_people[k]);
			});
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

		// 5. interview candidates — deduplicated by interview, because a shared
		// contact can come back both for me and for the colleague who owns it
		const mergedCandidates = new Map();
		allResults.forEach(([, , , , r]) => {
			(r.data.candidates || []).forEach((c) => {
				const existing = mergedCandidates.get(c.activity_id);
				// Prefer the owner's copy (is_shared = false) if both came back
				if (!existing || (existing.is_shared && !c.is_shared)) {
					mergedCandidates.set(c.activity_id, c);
				}
			});
		});
		zaujatiKandidati.value = [...mergedCandidates.values()];

		// Remember which filters this data belongs to
		statsStore.loadedKey = requestKey;
		statsStore.loadedAt = Date.now();
	} catch (error) {
		console.error(
			"Error fetching statistics:",
			error.response?.data || error.message,
		);
	} finally {
		if (seq === fetchSeq) loadingStateCalendar.value = false;
	}
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

onMounted(async () => {
	document.addEventListener("click", handleClickOutside);

	if (!dateRange.value.from || !dateRange.value.to) {
		// First visit: set dates from the selected period and load
		updateDateRange();
	} else if (!statsStore.isLoadedForFilters) {
		// Filters kept from the last visit, but data not loaded for them yet
		fetchData();
	}
	// Otherwise the stored data is shown as is; "Obnoviť" reloads it

	await userStore.fetchSharedUsersTree();

	// Drop kept selections of users whose calendar is no longer shared with me
	// (skipped if the list came back empty, e.g. the request failed)
	const availableIds = new Set(sharedUsers.value.map((u) => u.id));
	const stillShared = selectedUserIds.value.filter((id) =>
		availableIds.has(id),
	);
	if (
		availableIds.size > 0 &&
		stillShared.length !== selectedUserIds.value.length
	) {
		selectedUserIds.value = stillShared;
		fetchData();
	}
});

onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* ── Stat Cards ── */
.stat-card {
	background: white;
	border-radius: 12px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
	border: 1px solid #f1f5f9;
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card-icon {
	width: 48px;
	height: 48px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.stat-card-blue .stat-card-icon { background: linear-gradient(135deg, #6366f1, #818cf8); }
.stat-card-green .stat-card-icon { background: linear-gradient(135deg, #22c55e, #4ade80); }
.stat-card-purple .stat-card-icon { background: linear-gradient(135deg, #a855f7, #c084fc); }
.stat-card-amber .stat-card-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-card-orange .stat-card-icon { background: linear-gradient(135deg, #f97316, #fb923c); }
.stat-card-rose .stat-card-icon { background: linear-gradient(135deg, #f43f5e, #fb7185); }

/* ── Activity Cards ── */
.activity-card {
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
	border: 1px solid #f1f5f9;
	overflow: hidden;
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.activity-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.activity-card-header {
	padding: 14px 18px;
	background: #f8fafc;
	border-bottom: 1px solid #f1f5f9;
}

.activity-card-body {
	padding: 14px 18px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.activity-stat {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.activity-stat-label {
	font-size: 13px;
	color: #64748b !important;
}

/* ── Events after interview ── */
.event-pill {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 9px;
	border-radius: 999px;
	font-size: 12px;
	border: 1px solid;
	white-space: nowrap;
}
.pill-planned { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.pill-check { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.pill-discarded { background: #f9fafb; border-color: #e5e7eb; color: #6b7280; text-decoration: line-through; }
.pill-question { background: #fffbeb; border-color: #fde68a; color: #b45309; }

.activity-stat-value {
	font-size: 18px;
	font-weight: 700;
}
</style>
