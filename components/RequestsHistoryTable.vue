<script setup>
import { computed, onMounted } from "vue";
import { useRequestStore } from "#imports";

const requestStore = useRequestStore();
const historyRequests = computed(() => requestStore.history);

onMounted(async () => {
	await requestStore.getHistory();
});

const formatDate = (dateString) => {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `${day}.${month}.${year} – ${hours}:${minutes}`;
};
</script>

<template>
	<div class="history-wrap">
		<!-- Empty state -->
		<div
			v-if="!historyRequests || historyRequests.length === 0"
			class="empty-state"
		>
			<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="20" cy="20" r="18" stroke="#dbeafe" stroke-width="1.5" />
				<path
					d="M20 12v8l5 3"
					stroke="#93c5fd"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<p>Žiadna história žiadostí</p>
		</div>

		<!-- Table -->
		<div v-else class="table-scroll">
			<table class="hist-table">
				<thead>
					<tr>
						<th>Autor</th>
						<th>Adresát</th>
						<th>Typ žiadosti</th>
						<th>Stav</th>
						<th>Dátum</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="request in historyRequests" :key="request.id">
						<td>
							<div class="name-cell">
								<div class="mini-avatar">
									{{ (request.requester_name || "?")[0].toUpperCase() }}
								</div>
								{{ request.requester_name }}
							</div>
						</td>
						<td>
							<div class="name-cell">
								<div class="mini-avatar secondary">
									{{ (request.target_user_name || "?")[0].toUpperCase() }}
								</div>
								{{ request.target_user_name }}
							</div>
						</td>
						<td>
							<span
								class="type-badge"
								:class="
									request.type === 'view_their_calendar'
										? 'type-view'
										: 'type-share'
								"
							>
								{{
									request.type === "view_their_calendar"
										? "Vidieť ich kalendár"
										: "Zobraziť môj kalendár"
								}}
							</span>
						</td>
						<td>
							<span
								class="status-badge"
								:class="
									request.status === 'pending'
										? 'status-pending'
										: 'status-accepted'
								"
							>
								{{ request.status === "pending" ? "Prebieha" : "Prijaté" }}
							</span>
						</td>
						<td class="date-cell">{{ formatDate(request.created_at) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
.history-wrap {
	width: 100%;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 2rem 1rem;
	text-align: center;
}
.empty-state svg {
	width: 40px;
	height: 40px;
}
.empty-state p {
	font-size: 0.825rem;
	color: #94a3b8;
}

.table-scroll {
	overflow-x: auto;
}

.hist-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.85rem;
	white-space: nowrap;
}
.hist-table th {
	text-align: left;
	font-size: 0.7rem;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	padding: 0.5rem 0.875rem;
	border-bottom: 1px solid #dbeafe;
	background: #f8faff;
}
.hist-table td {
	padding: 0.625rem 0.875rem;
	border-bottom: 1px solid #eff6ff;
	color: #1e293b;
	vertical-align: middle;
}
.hist-table tr:last-child td {
	border-bottom: none;
}
.hist-table tbody tr:hover {
	background: #f8faff;
}

.name-cell {
	display: flex;
	align-items: center;
	gap: 8px;
}
.mini-avatar {
	width: 26px;
	height: 26px;
	border-radius: 50%;
	background: #eff6ff;
	color: #2563eb;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.7rem;
	font-weight: 700;
	flex-shrink: 0;
}
.mini-avatar.secondary {
	background: #ecfdf5;
	color: #059669;
}

/* Type badge */
.type-badge {
	display: inline-block;
	font-size: 0.75rem;
	padding: 3px 10px;
	border-radius: 20px;
	font-weight: 500;
	white-space: nowrap;
}
.type-view {
	background: #f8faff;
	color: #2563eb;
	border: 1px solid #bfdbfe;
}
.type-share {
	background: #f0fdf4;
	color: #059669;
	border: 1px solid #bbf7d0;
}

/* Status badge */
.status-badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 0.75rem;
	padding: 3px 10px;
	border-radius: 20px;
	font-weight: 600;
	white-space: nowrap;
}
.status-badge::before {
	content: "";
	width: 6px;
	height: 6px;
	border-radius: 50%;
	flex-shrink: 0;
}
.status-pending {
	background: #fefce8;
	color: #ca8a04;
	border: 1px solid #fde68a;
}
.status-pending::before {
	background: #ca8a04;
}

.status-accepted {
	background: #f0fdf4;
	color: #16a34a;
	border: 1px solid #bbf7d0;
}
.status-accepted::before {
	background: #16a34a;
}

.date-cell {
	color: #64748b;
	font-size: 0.8rem;
}
</style>
