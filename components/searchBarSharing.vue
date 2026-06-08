<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "#imports";
import { useRequestStore } from "~/stores/requestStore";
import { useToast } from "vue-toastification";

const toast = useToast();
const userStore = useUserStore();
const authStore = useAuthStore();
const requestStore = useRequestStore();
authStore.loadToken();

const searchInput = ref("");
const dropdownVisible = ref(false);
const filteredUsers = ref([]);
const isLoading = ref(true);

// Refs for positioning
const inputRef = ref(null);
const dropdownStyle = ref({});

const calcDropdownPos = () => {
	if (!inputRef.value) return;
	const rect = inputRef.value.getBoundingClientRect();
	dropdownStyle.value = {
		position: "fixed",
		top: `${rect.bottom + 6}px`,
		left: `${rect.left}px`,
		width: `${rect.width}px`,
		zIndex: 9999,
	};
};

onMounted(async () => {
	try {
		isLoading.value = true;
		if (!userStore.allUsers.length) {
			await userStore.fetchUsers();
		}
		filteredUsers.value = userStore.allUsers;
	} finally {
		isLoading.value = false;
	}
});

const showDropdown = async () => {
	filteredUsers.value = userStore.allUsers;
	await nextTick();
	calcDropdownPos();
	dropdownVisible.value = true;
};

watch(searchInput, (newValue) => {
	const searchText = newValue.toLowerCase();
	filteredUsers.value = userStore.allUsers.filter((user) =>
		`${user.first_name} ${user.last_name}`.toLowerCase().includes(searchText),
	);
});

const dropdownContainer = ref(null);
const handleClickOutside = (event) => {
	if (
		dropdownContainer.value &&
		!dropdownContainer.value.contains(event.target)
	) {
		dropdownVisible.value = false;
	}
};
const handleScroll = () => {
	if (dropdownVisible.value) calcDropdownPos();
};
const handleResize = () => {
	if (dropdownVisible.value) calcDropdownPos();
};

document.addEventListener("click", handleClickOutside);
window.addEventListener("scroll", handleScroll, true);
window.addEventListener("resize", handleResize);

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
	window.removeEventListener("scroll", handleScroll, true);
	window.removeEventListener("resize", handleResize);
});

const getInitials = (firstName, lastName) => {
	return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase();
};

const avatarBgs = ["#eff6ff", "#ecfdf5", "#fefce8", "#fdf4ff", "#fff7ed"];
const avatarTextColors = [
	"#2563eb",
	"#059669",
	"#ca8a04",
	"#9333ea",
	"#ea580c",
];
const getAvatarBg = (id) => avatarBgs[id % avatarBgs.length];
const getAvatarTextColor = (id) =>
	avatarTextColors[id % avatarTextColors.length];

const createRequestSeeMyCal = async (userId, first_name, last_name) => {
	await requestStore.requestToShowMyCalendar(userId, first_name, last_name);
	dropdownVisible.value = false;
	searchInput.value = "";
};
</script>

<template>
	<div ref="dropdownContainer" class="search-container">
		<!-- Search input -->
		<div class="search-input-wrap" ref="inputRef">
			<svg
				class="search-icon"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M17 17l-4-4m0-4a6 6 0 11-12 0 6 6 0 0112 0z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
			<input
				v-model="searchInput"
				type="text"
				@focus="showDropdown"
				class="search-input"
				placeholder="Hľadať používateľa..."
				autocomplete="off"
			/>
			<button
				v-if="searchInput"
				class="clear-btn"
				@click="
					searchInput = '';
					dropdownVisible = false;
				"
			>
				<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M6 6l8 8M14 6l-8 8"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>

		<!-- Dropdown — teleported to body to escape any overflow clipping -->
		<Teleport to="body">
			<div v-if="dropdownVisible" class="dropdown" :style="dropdownStyle">
				<!-- Loading -->
				<div v-if="isLoading" class="dropdown-loading">
					<div class="spinner"></div>
					<span>Načítavam používateľov…</span>
				</div>

				<template v-else>
					<!-- User items -->
					<div
						v-for="user in filteredUsers"
						:key="user.id"
						class="dropdown-item"
					>
						<div
							class="user-avatar"
							:style="{
								background: getAvatarBg(user.id),
								color: getAvatarTextColor(user.id),
							}"
						>
							{{ getInitials(user.first_name, user.last_name) }}
						</div>
						<span class="user-name"
							>{{ user.first_name }} {{ user.last_name }}</span
						>
						<button
							class="share-btn"
							@click="
								createRequestSeeMyCal(user.id, user.first_name, user.last_name)
							"
						>
							<svg
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M15 8a3 3 0 100-6 3 3 0 000 6zM5 12a3 3 0 100-6 3 3 0 000 6zM15 18a3 3 0 100-6 3 3 0 000 6z"
									stroke="currentColor"
									stroke-width="1.5"
								/>
								<path
									d="M7.5 10.5l5-3M7.5 9.5l5 3"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
							Zdieľať môj kalendár
						</button>
					</div>

					<!-- Empty -->
					<div v-if="filteredUsers.length === 0" class="dropdown-empty">
						<svg
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								cx="10"
								cy="10"
								r="8"
								stroke="currentColor"
								stroke-width="1.5"
							/>
							<path
								d="M7 13c.5-2 5.5-2 6 0"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								opacity=".5"
							/>
							<circle cx="8" cy="8" r="1" fill="currentColor" opacity=".5" />
							<circle cx="12" cy="8" r="1" fill="currentColor" opacity=".5" />
						</svg>
						Žiadni používatelia nenájdení
					</div>
				</template>
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.search-container {
	position: relative;
	width: 100%;
}

.search-input-wrap {
	position: relative;
	display: flex;
	align-items: center;
}
.search-icon {
	position: absolute;
	left: 12px;
	width: 18px;
	height: 18px;
	color: #94a3b8;
	pointer-events: none;
	flex-shrink: 0;
}
.search-input {
	width: 100%;
	padding: 0.625rem 2.5rem 0.625rem 2.5rem;
	border: 1px solid #bfdbfe;
	border-radius: 10px;
	background: #f8faff;
	font-size: 0.875rem;
	color: #1e293b;
	outline: none;
	font-family: inherit;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
}
.search-input:focus {
	border-color: #3b82f6;
	background: #fff;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.search-input::placeholder {
	color: #94a3b8;
}

.clear-btn {
	position: absolute;
	right: 10px;
	width: 20px;
	height: 20px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
	color: #94a3b8;
	display: flex;
	align-items: center;
	justify-content: center;
}
.clear-btn svg {
	width: 16px;
	height: 16px;
}
.clear-btn:hover {
	color: #64748b;
}
</style>

<!-- Global styles for the teleported dropdown (not scoped) -->
<style>
.dropdown {
	background: #fff;
	border: 1px solid #dbeafe;
	border-radius: 12px;
	box-shadow:
		0 8px 24px rgba(37, 99, 235, 0.12),
		0 2px 8px rgba(0, 0, 0, 0.07);
	max-height: 300px;
	overflow-y: auto;
}

.dropdown-loading {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 1rem;
	color: #64748b;
	font-size: 0.85rem;
}
.dropdown .spinner {
	width: 18px;
	height: 18px;
	border: 2px solid #dbeafe;
	border-top-color: #2563eb;
	border-radius: 50%;
	animation: dropdown-spin 0.7s linear infinite;
	flex-shrink: 0;
}
@keyframes dropdown-spin {
	to {
		transform: rotate(360deg);
	}
}

.dropdown-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 0.625rem 1rem;
	border-bottom: 1px solid #eff6ff;
	transition: background 0.12s;
	cursor: default;
}
.dropdown-item:last-child {
	border-bottom: none;
}
.dropdown-item:hover {
	background: #f8faff;
}

.dropdown .user-avatar {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
	flex-shrink: 0;
}
.dropdown .user-name {
	flex: 1;
	font-size: 0.875rem;
	font-weight: 500;
	color: #1e293b;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.share-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0.375rem 0.875rem;
	background: #eff6ff;
	color: #1d4ed8;
	border: 1px solid #bfdbfe;
	border-radius: 20px;
	font-size: 0.78rem;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	transition:
		background 0.12s,
		border-color 0.12s;
	font-family: inherit;
}
.share-btn svg {
	width: 14px;
	height: 14px;
}
.share-btn:hover {
	background: #dbeafe;
	border-color: #93c5fd;
}

.dropdown-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 2rem 1rem;
	color: #94a3b8;
	font-size: 0.85rem;
	text-align: center;
}
.dropdown-empty svg {
	width: 28px;
	height: 28px;
}
</style>
