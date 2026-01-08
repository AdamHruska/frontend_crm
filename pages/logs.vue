<template>
	<div v-if="isAdmin" class="min-h-screen bg-slate-50 p-8">
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
				<input
					v-model="filters.username"
					placeholder="Používateľ"
					class="input bg-gray-200"
				/>
				<input
					v-model="filters.ip"
					placeholder="IP adresa"
					class="input bg-gray-200"
				/>

				<select v-model="filters.action" class="input bg-gray-200">
					<option value="">Všetky akcie</option>
					<option value="login">Prihlásenie</option>
					<option value="register">Registrácia</option>
				</select>
			</div>
		</div>

		<!-- Table -->
		<div
			class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
		>
			<table class="min-w-full">
				<thead class="bg-blue-50">
					<tr>
						<th class="th">Používateľ</th>
						<th class="th">IP</th>
						<th class="th">Akcia</th>
						<th class="th">Prehliadač</th>
						<th class="th">Čas</th>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="(log, index) in filteredLogs"
						:key="log.id"
						class="hover:bg-slate-50"
					>
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

						<td class="td text-slate-600 max-w-[48px]">
							{{ log.user_agent }}
						</td>

						<td class="td text-slate-500">
							{{ formatDate(log.logged_at) }}
						</td>
					</tr>
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
	<div
		v-else
		class="text-2xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2"
	>
		Prístup má len administrátor
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "~/stores/authStore";
import { useUserStore } from "#imports";
const userStore = useUserStore();

const logs = ref([]);
const authStore = useAuthStore();

const config = useRuntimeConfig(); // Make sure apiUrl is defined in nuxt.config

const filters = ref({
	username: "",
	ip: "",
	action: "",
});

const isAdmin = computed(() => {
	if (
		userStore.user &&
		userStore.user.first_name === "admin" &&
		userStore.user.last_name === "admin" &&
		userStore.user.email === "admin@admin.com"
	) {
		return true;
	} else {
		return false;
	}
});

const fetchLogs = async () => {
	try {
		const response = await axios.post(`${config.public.apiUrl}admin/logs`, {
			headers: { Authorization: `Bearer ${authStore.token}` },
		});

		// For Laravel pagination, logs are in response.data.logs.data
		logs.value = response.data.logs || [];
		//pagination.value = response.data.logs; // store pagination info if needed
	} catch (error) {
		console.error("Error fetching logs:", error);
	}
};

const formatDate = (date) => new Date(date).toLocaleString("sk-SK");

onMounted(() => fetchLogs());

const filteredLogs = computed(() => {
	return logs.value.filter((log) => {
		const matchUsername =
			!filters.value.username ||
			log.username.toLowerCase().includes(filters.value.username.toLowerCase());

		const matchIp =
			!filters.value.ip || log.ip_address.includes(filters.value.ip);

		const matchAction =
			!filters.value.action || log.action === filters.value.action;

		return matchUsername && matchIp && matchAction;
	});
});
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
	@apply bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold;
}

.page-btn {
	@apply px-3 py-1 rounded-lg border text-slate-600
	hover:bg-slate-100 disabled:opacity-50;
}
</style>
