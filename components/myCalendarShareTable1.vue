<script setup>
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "#imports";
import { useToast } from "vue-toastification";
import eventBus from "@/eventBus";

const userStore = useUserStore();
const toast = useToast();

const sharedUsers = computed(() => userStore.sharedUsers);

const getInitials = (firstName, lastName) => {
	return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase();
};

const avatarBgs = ["#eff6ff", "#ecfdf5", "#fefce8", "#fdf4ff", "#fff7ed"];
const avatarColors = ["#2563eb", "#059669", "#ca8a04", "#9333ea", "#ea580c"];
const getAvatarBg = (id) => avatarBgs[id % avatarBgs.length];
const getAvatarColor = (id) => avatarColors[id % avatarColors.length];

const deleteSharedUser = async (id) => {
	const user = userStore.sharedUsers.find((u) => u.id === id);
	if (!user) return;

	user.isLoading = true;
	try {
		eventBus.emit("deleteSharedEvents", { userId: id });
		await userStore.deleteSharedUser(id);

		const calendarStore = useCalendarstore();
		await calendarStore.removeSharedActivitiesByUser(id);

		userStore.sharedUsers = userStore.sharedUsers.filter((u) => u.id !== id);
		toast.success("Používateľ bol úspešne odstránený");
	} catch (error) {
		console.error("Error deleting user:", error);
		toast.error("Nastala chyba pri odstraňovaní používateľa");
	} finally {
		user.isLoading = false;
	}
};

onMounted(async () => {
	try {
		await userStore.fetchUser();
		await userStore.fetchSharedUsersTree();
	} catch (error) {
		console.error("Error initializing shared users:", error);
	}
});
</script>

<template>
	<div class="share-card">
		<!-- Empty state -->
		<div v-if="!sharedUsers || sharedUsers.length === 0" class="empty-state">
			<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="20" cy="20" r="18" stroke="#dbeafe" stroke-width="1.5" />
				<path
					d="M14 24a6 6 0 0112 0"
					stroke="#93c5fd"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
				<circle cx="20" cy="16" r="4" stroke="#93c5fd" stroke-width="1.5" />
			</svg>
			<p>Nevidíte žiadny cudzí kalendár</p>
		</div>

		<!-- User list -->
		<div v-else class="user-list">
			<div v-for="user in sharedUsers" :key="user.id" class="user-row">
				<div
					class="avatar"
					:style="{
						background: getAvatarBg(user.id),
						color: getAvatarColor(user.id),
					}"
				>
					{{ getInitials(user.first_name, user.last_name) }}
				</div>

				<div class="user-info">
					<div class="user-name">
						{{ user.first_name }} {{ user.last_name }}
					</div>
					<!-- Transitive users -->
					<div
						v-if="user.transitive_users && user.transitive_users.length"
						class="transitive-list"
					>
						<NuxtLink
							v-for="tu in user.transitive_users"
							:key="tu.id"
							:to="`/contact/${tu.id}`"
							class="transitive-tag"
						>
							{{ tu.first_name }} {{ tu.last_name }}
						</NuxtLink>
					</div>
				</div>

				<div class="user-actions">
					<div v-if="user.isLoading" class="spinner"></div>
					<button
						v-else
						class="btn-remove"
						@click="deleteSharedUser(user.id)"
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
.transitive-list {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	margin-top: 4px;
}
.transitive-tag {
	display: inline-block;
	font-size: 0.7rem;
	padding: 2px 8px;
	background: #eff6ff;
	color: #2563eb;
	border: 1px solid #bfdbfe;
	border-radius: 20px;
	text-decoration: none;
	font-weight: 500;
	transition: background 0.12s;
}
.transitive-tag:hover {
	background: #dbeafe;
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
