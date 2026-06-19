<template>
	<div class="relative" ref="dropdownContainer">
		<!-- Blocking overlay when loading -->
		<div
			v-if="props.disabled"
			class="absolute inset-0 bg-white/60 z-10 rounded-lg cursor-not-allowed"
		/>

		<div
			class="font-[sans-serif] w-[180px] mx-auto transition-opacity duration-200"
			:class="{ 'opacity-50': props.disabled }"
		>
			<loadigcomponent v-if="loading" />

			<div
				v-if="loading"
				class="flex items-center gap-2 mb-1 text-xs text-gray-500"
			>
				<svg
					class="animate-spin h-3 w-3 text-blue-500"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8v8z"
					/>
				</svg>
				<span>Načítava...</span>
			</div>

			<!-- Button to toggle dropdown -->
			<button
				type="button"
				@click="toggleDropdown"
				class="px-4 py-2.5 rounded-[50px] text-white text-sm font-semibold border-none outline-none bg-blue-600 hover:bg-blue-700 active:bg-blue-600"
			>
				Zobraziť kalendár
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-3 fill-white inline ml-3"
					viewBox="0 0 24 24"
				>
					<path
						fill-rule="evenodd"
						d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
						clip-rule="evenodd"
						data-original="#000000"
					/>
				</svg>
			</button>

			<!-- Dropdown list of users -->
			<ul
				v-show="isDropdownOpen"
				class="shadow-2xl shadow-gray-400 bg-white py-2 px-2 z-[1000] min-w-full w-max rounded max-h-[500px] overflow-auto"
			>
				<!-- Search input -->
				<li class="mb-2">
					<input
						v-model="searchInput"
						placeholder="Search..."
						@input="debounceSearch"
						class="px-4 py-2.5 w-full rounded text-black text-sm border-none outline-blue-600 bg-gray-50 focus:bg-transparent"
					/>
				</li>
				<!-- User list with checkboxes -->
				<li
					v-for="user in filteredUsers"
					:key="user.id"
					class="py-2.5 px-4 hover:bg-blue-50 rounded text-black text-sm cursor-pointer"
				>
					<div class="flex items-center gap-2">
						<input
							v-model="user.checked"
							:id="'checkbox' + user.id"
							type="checkbox"
							class="peer w-5 h-5 cursor-pointer checkbox-custom"
							:disabled="props.disabled"
							:class="{ 'opacity-40 cursor-not-allowed': props.disabled }"
							@change="handleCheckboxChange(user, user.checked)"
						/>
						<label :for="'checkbox' + user.id" class="cursor-pointer flex-1">
							{{ user.first_name }} {{ user.last_name }}
							<span v-if="user.isTransitive" class="text-xs text-gray-400 ml-1"
								>(zdieľaný)</span
							>
						</label>
						<!-- Color square — only shown when user is checked and color is available -->
						<div
							v-if="user.checked"
							class="h-4 w-4 rounded shrink-0 transition-colors duration-300"
							:style="{ backgroundColor: getUserColor(user.id) }"
						/>
					</div>
				</li>
			</ul>

			<div
				v-if="!isDropdownOpen"
				class="text-black mt-3 flex flex-col items-center gap-2 text-base font-medium"
			>
				<!-- My own calendar row — always blue -->
				<div class="flex gap-3 items-center">
					<input
						v-model="myCalendar"
						type="checkbox"
						:disabled="props.disabled"
						:class="{ 'opacity-40 cursor-not-allowed': props.disabled }"
						@change="handleMyCalendarChange"
						class="peer w-5 h-5 cursor-pointer checkbox-custom"
					/>
					<div class="">
						{{ userStore.user?.first_name || "meno" }}
						{{ userStore.user?.last_name || "priezvisko" }}
					</div>
					<div
						class="h-5 w-5 rounded"
						style="background-color: rgb(37 99 235)"
					></div>
				</div>

				<!-- Checked shared users — color comes from calendarStore.userColors -->
				<div
					v-for="user in checkedUsers"
					:key="user.id"
					class="flex gap-3 items-center justify-between w-full"
				>
					<input
						v-model="user.checked"
						:id="'checkbox' + user.id"
						type="checkbox"
						class="peer w-5 h-5 cursor-pointer checkbox-custom"
						:disabled="props.disabled"
						:class="{ 'opacity-40 cursor-not-allowed': props.disabled }"
						@change="handleCheckboxChange(user, user.checked)"
					/>
					<div>
						{{ user.first_name }} {{ user.last_name }}
						<span v-if="user.isTransitive" class="text-xs text-gray-400"
							>(zdieľaný)</span
						>
					</div>
					<div
						class="h-5 w-5 rounded transition-colors duration-300"
						:style="{ backgroundColor: getUserColor(user.id) }"
					></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useCalendarstore } from "@/stores/calendarStore";
import { useUserStore } from "#imports";

const calendarStore = useCalendarstore();
const userStore = useUserStore();
const config = useRuntimeConfig();
const authStore = useAuthStore();

const props = defineProps({
	disabled: {
		type: Boolean,
		default: false,
	},
});

const myCalendar = ref(true);
const users = ref([]);
const searchInput = ref("");
const error = ref("");
const isDropdownOpen = ref(false);
const dropdownContainer = ref(null);
const loading = ref(false);

const pastelColors = [
	"#FFB3BA",
	"#FFDFBA",
	"#FFFFBA",
	"#BAFFC9",
	"#FFD7BA",
	"#FFB3E6",
	"#C9FFE5",
	"#FFE4BA",
	"#FFCCE5",
	"#D4F0C9",
	"#FFC6D9",
	"#FFEAA7",
];

// Read color from store — set by transformData in parent when activities load.
// Falls back to a pastel by list index if not yet set (e.g. user has no activities).
const getUserColor = (userId) => {
	return calendarStore.userColors[userId] ?? "#cbd5e1";
};

const emit = defineEmits([
	"deleteSharedEventsId",
	"addSharedEventsId",
	"toggleMyActivities",
]);

authStore.loadToken();

const handleMyCalendarChange = () => {
	emit("toggleMyActivities", myCalendar.value);
};

const handleSearch = async () => {
	loading.value = true;
	error.value = "";

	try {
		const response = await axios.get(`${config.public.apiUrl}get-users`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});

		users.value = (response.data.users || []).map((user) => ({
			...user,
			checked: false,
		}));

		const checkedUsers = users.value.filter((user) => user.checked);
		calendarStore.setCheckedUsers(checkedUsers);
	} catch (err) {
		console.error("Error in handleSearch:", err);
		error.value = err.message || "Error fetching users";
	} finally {
		loading.value = false;
	}
};

const filteredUsers = computed(() => {
	const directUsers = (userStore.sharedUsers || []).map((u) => ({
		...u,
		isTransitive: false,
	}));
	const transitiveUsers = (userStore.transitiveSharedUsers || []).map((u) => ({
		...u,
		isTransitive: true,
	}));

	const seen = new Set();
	const allUsers = [];

	for (const user of [...directUsers, ...transitiveUsers]) {
		if (!seen.has(user.id)) {
			seen.add(user.id);
			allUsers.push(user);
		}
	}

	if (!searchInput.value) return allUsers;

	const q = searchInput.value.toLowerCase();
	return allUsers.filter((u) =>
		`${u.first_name} ${u.last_name}`.toLowerCase().includes(q),
	);
});

onMounted(async () => {
	try {
		await userStore.fetchSharedUsersTree();
		await handleSearch();
	} catch (err) {
		console.error("Error during mount:", err);
	}
});

const handleCheckboxChange = async (user, isChecked) => {
	loading.value = true;
	try {
		if (isChecked) {
			emit("addSharedEventsId", user.id, user.isTransitive ?? false);
		} else {
			emit("deleteSharedEventsId", user.id);
		}
		user.checked = isChecked;
	} catch (error) {
		console.error("Error updating share ID:", error);
	} finally {
		loading.value = false;
	}
};

const toggleDropdown = () => {
	isDropdownOpen.value = !isDropdownOpen.value;
};

onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (event) => {
	if (
		dropdownContainer.value &&
		!dropdownContainer.value.contains(event.target)
	) {
		isDropdownOpen.value = false;
	}
};

onMounted(() => {
	document.addEventListener("click", handleClickOutside);
});

const checkedUsers = computed(() => {
	const seen = new Set();
	const result = [];

	for (const u of [
		...users.value,
		...(userStore.transitiveSharedUsers || []),
	]) {
		if (u.checked && !seen.has(u.id)) {
			seen.add(u.id);
			result.push(u);
		}
	}

	return result;
});
</script>

<style scoped>
.checkbox-custom {
	appearance: none;
	-webkit-appearance: none;
	background-color: white;
	border: 2px solid #cbd5e1;
	border-radius: 4px;
	width: 20px;
	height: 20px;
	display: inline-block;
	position: relative;
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease;
}

.checkbox-custom:checked {
	background-color: #2563eb;
	border-color: #2563eb;
}

.checkbox-custom:checked::before {
	content: "";
	position: absolute;
	top: 50%;
	left: 50%;
	width: 10px;
	height: 10px;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M20.292 5.292a1 1 0 011.416 1.416l-12 12a1 1 0 01-1.416 0l-6-6a1 1 0 111.416-1.416L9.999 16.585l10.293-10.293z'/%3E%3C/svg%3E");
	background-size: contain;
	background-repeat: no-repeat;
	transform: translate(-50%, -50%);
}
</style>
