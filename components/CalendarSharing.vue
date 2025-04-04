<template>
	<div class="font-[sans-serif] w-[180px] mx-auto" ref="dropdownContainer">
		<loadigcomponent v-if="loading" />
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
				<div class="flex items-center">
					<input
						v-model="user.checked"
						:id="'checkbox' + user.id"
						type="checkbox"
						class="peer mr-3 w-5 h-5 cursor-pointer checkbox-custom"
						@change="handleCheckboxChange(user.id, user.checked)"
					/>
					<label :for="'checkbox' + user.id" class="cursor-pointer">
						{{ user.first_name }} {{ user.last_name }}
					</label>
				</div>
			</li>
		</ul>
		<div
			v-if="!isDropdownOpen"
			class="text-black mt-3 flex flex-col justify-center items-center gap-2 text-base font-medium"
		>
			<div
				v-for="(user, index) in checkedUsers"
				:key="user.id"
				class="flex gap-3 items-center content-center"
			>
				<input
					v-model="user.checked"
					:id="'checkbox' + user.id"
					type="checkbox"
					class="peer w-5 h-5 cursor-pointer checkbox-custom"
					@change="handleCheckboxChange(user.id, user.checked)"
				/>
				<div>{{ user.first_name }} {{ user.last_name }}</div>

				<input
					type="color"
					value="#FF0000"
					class="appearance-none w-[25px] h-[28px] bg-transparent border-0 cursor-pointer [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[5px] [&::-moz-color-swatch]:border-0"
				/>
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

const users = ref([]);
const searchInput = ref("");
const error = ref("");
const isDropdownOpen = ref(false);
const dropdownContainer = ref(null);
const loading = ref(false);

const emit = defineEmits(["deleteSharedEventsId", "addSharedEventsId"]);

// Initialize auth store
authStore.loadToken();

const handleSearch = async () => {
	console.log("Starting handleSearch");
	loading.value = true;
	error.value = "";

	try {
		console.log("Fetching current user...");
		const current_user = await axios.get(`${config.public.apiUrl}get-user`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		console.log("Current user data:", current_user.data);

		let numbers = [];
		const shareIDs = current_user.data.user.share_user_id;
		console.log("ShareIDs:", shareIDs);

		if (shareIDs) {
			try {
				numbers = Array.isArray(shareIDs)
					? shareIDs.map(Number)
					: JSON.parse(shareIDs).map(Number);
				console.log("Parsed numbers:", numbers);
			} catch (parseError) {
				console.error("Error parsing share_user_id:", parseError);
			}
		}

		console.log("Fetching all users...");
		const response = await axios.get(`${config.public.apiUrl}get-users`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		console.log("All users response:", response.data);

		users.value = (response.data.users || []).map((user) => ({
			...user,
			checked: numbers.includes(user.id),
		}));
		console.log("Updated users:", users.value);

		const checkedUsers = users.value.filter((user) => user.checked);
		calendarStore.setCheckedUsers(checkedUsers);
		console.log("Updated checked users in store:", checkedUsers);
	} catch (err) {
		console.error("Error in handleSearch:", err);
		error.value = err.message || "Error fetching users";
	} finally {
		loading.value = false;
		console.log("HandleSearch completed. Users:", users.value);
	}
};

// const filteredUsers = computed(() => {
// 	console.log("Computing filtered users:", users.value);
// 	if (!searchInput.value) return users.value;
// 	const normalizedSearchInput = searchInput.value.toLowerCase();
// 	return users.value.filter((user) => {
// 		const userFullName = `${user.first_name} ${user.last_name}`.toLowerCase();
// 		return userFullName.includes(normalizedSearchInput);
// 	});
// });

const filteredUsers = computed(() => {
	const confirmedIds = Object.values(
		userStore.user.confirmed_share_user_id || {}
	).map(String);

	if (!searchInput.value) {
		return users.value.filter((user) => confirmedIds.includes(String(user.id)));
	}

	const normalizedSearchInput = searchInput.value.toLowerCase();
	return users.value.filter((user) => {
		const userFullName = `${user.first_name} ${user.last_name}`.toLowerCase();
		return (
			userFullName.includes(normalizedSearchInput) &&
			confirmedIds.includes(String(user.id))
		);
	});
});

onMounted(async () => {
	console.log("Component mounted");
	try {
		await handleSearch();
		console.log("Initial search completed");
	} catch (err) {
		console.error("Error during mount:", err);
	}
});

const handleCheckboxChange = async (userId, isChecked) => {
	console.log("Checkbox changed for user:", userId, isChecked);
	loading.value = true;

	try {
		if (isChecked) {
			emit("addSharedEventsId", userId);
			await axios.post(
				`${config.public.apiUrl}add-share-id/${userId}`,
				{},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
		} else {
			emit("deleteSharedEventsId", userId);
			await axios.post(
				`${config.public.apiUrl}null-share-id/${userId}`,
				{},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
		}

		// Refresh users after change
		await handleSearch();
	} catch (error) {
		console.error("Error updating share ID:", error);
	} finally {
		loading.value = false;
	}
};

const toggleDropdown = () => {
	isDropdownOpen.value = !isDropdownOpen.value;
	console.log("Dropdown toggled:", isDropdownOpen.value);
};

// Cleanup
onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside);
});

// Click outside handler
const handleClickOutside = (event) => {
	if (
		dropdownContainer.value &&
		!dropdownContainer.value.contains(event.target)
	) {
		isDropdownOpen.value = false;
	}
};

// Add click outside listener after mount
onMounted(() => {
	document.addEventListener("click", handleClickOutside);
});

const checkedUsers = computed(() => {
	return users.value.filter((user) => user.checked);
});
</script>

<style scoped>
/* Hide default checkbox appearance */
.checkbox-custom {
	appearance: none;
	-webkit-appearance: none;
	background-color: white;
	border: 2px solid #cbd5e1; /* light-gray border */
	border-radius: 4px;
	width: 20px;
	height: 20px;
	display: inline-block;
	position: relative;
	transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* Style checkbox when checked */
.checkbox-custom:checked {
	background-color: #2563eb; /* blue color */
	border-color: #2563eb; /* change border color when checked */
}

/* Custom checkmark SVG when checked */
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
