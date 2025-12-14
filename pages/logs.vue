<template>
	<div class="min-h-screen bg-slate-50 p-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-slate-800">Prihlasovacie logy</h1>
			<p class="text-slate-500 mt-1">
				Prehľad prihlásení a registrácií používateľov
			</p>
		</div>

		<!-- Filters -->
		<div
			class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8"
		>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<input placeholder="Používateľ" class="input" />
				<input placeholder="IP adresa" class="input" />

				<select class="input">
					<option value="">Všetky akcie</option>
					<option value="login">Prihlásenie</option>
					<option value="register">Registrácia</option>
				</select>

				<button
					@click="applyFilters"
					class="bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
				>
					Filtrovať
				</button>
			</div>
		</div>

		<!-- Table -->
		<div
			class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
		>
			<table class="min-w-full">
				<thead class="bg-blue-50">
					<tr>
						<th class="th">#</th>
						<th class="th">Používateľ</th>
						<th class="th">IP</th>
						<th class="th">Akcia</th>
						<th class="th">Čas</th>
					</tr>
				</thead>

				<tbody>
					<!-- <tr
						v-for="(log, index) in logs"
						:key="log.id"
						class="hover:bg-slate-50"
					>
						<td class="td text-slate-400">
							{{
								index + 1 + (pagination.current_page - 1) * pagination.per_page
							}}
						</td>

						<td class="td font-medium text-slate-800">
							{{ log.username }}
						</td>

						<td class="td text-slate-600">
							{{ log.ip_address }}
						</td>

						<td class="td">
							<span
								:class="
									log.action === 'login' ? 'badge-login' : 'badge-register'
								"
							>
								{{ log.action === "login" ? "Prihlásenie" : "Registrácia" }}
							</span>
						</td>

						<td class="td text-slate-500">
							{{ formatDate(log.logged_at) }}
						</td>
					</tr> -->
				</tbody>
			</table>

			<!-- Pagination -->
			<!-- <div class="flex justify-between items-center px-6 py-4 border-t">
				<span class="text-sm text-slate-500">
					Strana {{ pagination.current_page }} z {{ pagination.last_page }}
				</span>

				<div class="flex gap-2">
					<button
						@click="changePage(pagination.current_page - 1)"
						:disabled="pagination.current_page === 1"
						class="page-btn"
					>
						‹
					</button>

					<button
						@click="changePage(pagination.current_page + 1)"
						:disabled="pagination.current_page === pagination.last_page"
						class="page-btn"
					>
						›
					</button>
				</div>
			</div> -->
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "~/stores/authStore";

const logs = ref([]);
const authStore = useAuthStore();

const config = useRuntimeConfig(); // Make sure apiUrl is defined in nuxt.config

const fetchLogs = async () => {
	try {
		const response = await axios.post(`${config.public.apiUrl}admin/logs`, {
			headers: { Authorization: `Bearer ${authStore.token}` },
		});

		// For Laravel pagination, logs are in response.data.logs.data
		logs.value = response.data.logs.data || [];
		pagination.value = response.data.logs; // store pagination info if needed
	} catch (error) {
		console.error("Error fetching logs:", error);
	}
};

const formatDate = (date) => new Date(date).toLocaleString("sk-SK");

onMounted(() => fetchLogs());
</script>
<style scoped>
.input {
	@apply w-full border border-slate-300 rounded-xl px-4 py-2
	focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.th {
	@apply px-6 py-4 text-left text-sm font-semibold text-blue-800;
}

.td {
	@apply px-6 py-4 text-sm;
}

.badge-login {
	@apply bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold;
}

.badge-register {
	@apply bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-semibold;
}

.page-btn {
	@apply px-3 py-1 rounded-lg border text-slate-600
	hover:bg-slate-100 disabled:opacity-50;
}
</style>
