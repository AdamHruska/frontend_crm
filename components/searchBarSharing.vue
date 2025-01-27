<script setup>
import { ref, watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "#imports";
import { useRequestStore } from "~/stores/requestStore";

const userStore = useUserStore();
const authStore = useAuthStore();
const requestStore = useRequestStore();
authStore.loadToken();

const searchInput = ref("");
const dropdownVisible = ref(false);
const filteredUsers = ref([]);
const isLoading = ref(true); // Add loading state

// Fetch all users on component mount
onMounted(async () => {
	try {
		isLoading.value = true;
		await userStore.fetchUsers(); // Assuming this is the method to fetch users
		filteredUsers.value = userStore.allUsers;
	} finally {
		isLoading.value = false;
	}
});

const showDropdown = () => {
	dropdownVisible.value = true;
	filteredUsers.value = userStore.allUsers;
};

watch(searchInput, (newValue) => {
	const searchText = newValue.toLowerCase();
	filteredUsers.value = userStore.allUsers.filter((user) =>
		`${user.first_name} ${user.last_name}`.toLowerCase().includes(searchText)
	);
	console.log("Filtered users:", filteredUsers.value);
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

document.addEventListener("click", handleClickOutside);

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
});

const createRequestSeeTheirCal = async (userId, first_name, last_name) => {
	await requestStore.requestToSeeTheirCalendar(userId, first_name, last_name);
};

const createRequestSeeMyCal = async (userId, first_name, last_name) => {
	await requestStore.requestToShowMyCalendar(userId, first_name, last_name);
};
</script>

<template>
	<div ref="dropdownContainer" class="relative w-full">
		<!-- Search Input -->
		<div class="relative">
			<div
				class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
			>
				<svg
					class="w-4 h-4 text-gray-700"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 20 20"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
					/>
				</svg>
			</div>
			<input
				v-model="searchInput"
				type="search"
				@focus="showDropdown"
				class="block w-full p-4 ps-10 text-sm text-black border border-gray-400 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
				placeholder="Hľadať ..."
			/>
		</div>

		<!-- Dropdown with loading state and filtered users -->
		<ul
			v-if="dropdownVisible"
			class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
		>
			<!-- Loading state -->
			<li v-if="isLoading" class="p-4 text-gray-500 text-center">
				<div class="flex items-center justify-center">
					<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
							fill="none"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Searching for users...
				</div>
			</li>

			<!-- User list -->
			<template v-else>
				<li
					v-for="user in filteredUsers"
					:key="user.id"
					class="p-2 hover:bg-gray-100 cursor-pointer text-black mr-4 flex justify-between items-center my-3"
				>
					{{ user.first_name }} {{ user.last_name }}
					<div class="">
						<button
							@click="
								createRequestSeeMyCal(user.id, user.first_name, user.last_name)
							"
							class="mr-1 bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 shadow"
						>
							vidieť môj
						</button>
						<button
							@click="
								createRequestSeeTheirCal(
									user.id,
									user.first_name,
									user.last_name
								)
							"
							class="ml-1 bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 shadow"
						>
							vidieť ich
						</button>
					</div>
				</li>
				<li v-if="filteredUsers.length === 0" class="p-2 text-gray-500">
					No users found
				</li>
			</template>
		</ul>
	</div>
</template>

<style scoped>
/* Add custom styles if needed */
</style>
