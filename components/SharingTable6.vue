<script setup>
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "#imports";
import { useRequestStore } from "#imports";
import { useToast } from "vue-toastification";

const userStore = useUserStore();
const requestStore = useRequestStore();
const toast = useToast();

const seesMyCalendar = computed(() => requestStore.seesMyCalendar);

const getInitials = (username) => {
	if (!username) return "?";
	const parts = username.trim().split(" ");
	return parts.length >= 2
		? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
		: username.slice(0, 2).toUpperCase();
};

// Stable color from string hash
const hashStr = (str) => {
	let h = 0;
	for (let c of str || "") h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
	return Math.abs(h);
};
const avatarBgs = ["#eff6ff", "#ecfdf5", "#fefce8", "#fdf4ff", "#fff7ed"];
const avatarColors = ["#2563eb", "#059669", "#ca8a04", "#9333ea", "#ea580c"];
const getAvatarBg = (name) => avatarBgs[hashStr(name) % avatarBgs.length];
const getAvatarColor = (name) =>
	avatarColors[hashStr(name) % avatarColors.length];

onMounted(async () => {
	await requestStore.WhoSeesMyCal();
});

const deleteSeesMine = async (id) => {
	await requestStore.deleteRequestSeesMyCal(id);
	toast.success("Zdieľanie kalendára bolo úspešne zrušené.");
};
</script>

<template>
	<div class="share-card">
		<!-- Empty state -->
		<div
			v-if="!seesMyCalendar || seesMyCalendar.length === 0"
			class="empty-state"
		>
			<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="20" cy="20" r="18" stroke="#dbeafe" stroke-width="1.5" />
				<path
					d="M12 27s4-6 8-6 8 6 8 6"
					stroke="#93c5fd"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
				<circle cx="20" cy="16" r="4" stroke="#93c5fd" stroke-width="1.5" />
				<path
					d="M28 12l4-4M28 8l4 4"
					stroke="#93c5fd"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
			<p>Váš kalendár nik nevidí</p>
		</div>

		<!-- User list -->
		<div v-else class="user-list">
			<div v-for="row in seesMyCalendar" :key="row.id" class="user-row">
				<div
					class="avatar"
					:style="{
						background: getAvatarBg(row.username),
						color: getAvatarColor(row.username),
					}"
				>
					{{ getInitials(row.username) }}
				</div>

				<div class="user-info">
					<div class="user-name">{{ row.username }}</div>
				</div>

				<div class="user-actions">
					<div v-if="row.isLoading" class="spinner"></div>
					<button
						v-else
						class="btn-remove"
						@click="deleteSeesMine(row.id)"
						title="Zrušiť zdieľanie"
					>
						<svg
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M6 6l8 8M14 6l-8 8"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.share-card {
	background: #fff;
	border: 1px solid #dbeafe;
	border-radius: 12px;
	overflow: hidden;
	min-height: 80px;
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

.user-list {
	padding: 0.25rem 0;
}

.user-row {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid #eff6ff;
	transition: background 0.12s;
}
.user-row:last-child {
	border-bottom: none;
}
.user-row:hover {
	background: #f8faff;
}

.avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
	flex-shrink: 0;
}
.user-info {
	flex: 1;
	min-width: 0;
}
.user-name {
	font-size: 0.875rem;
	font-weight: 600;
	color: #1e293b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.user-actions {
	flex-shrink: 0;
}

.btn-remove {
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border: 1px solid #fecaca;
	border-radius: 7px;
	color: #ef4444;
	cursor: pointer;
	transition:
		background 0.12s,
		border-color 0.12s;
}
.btn-remove svg {
	width: 14px;
	height: 14px;
}
.btn-remove:hover {
	background: #fef2f2;
	border-color: #fca5a5;
}

.spinner {
	width: 20px;
	height: 20px;
	border: 2px solid #dbeafe;
	border-top-color: #2563eb;
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}
@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
