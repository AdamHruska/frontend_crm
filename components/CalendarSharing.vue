<template>
	<div class="font-[sans-serif] w-max mx-auto">
		<!-- Button to toggle dropdown -->
		<button
			type="button"
			@click="toggleDropdown"
			class="px-10 py-2.5 rounded text-white text-sm font-semibold border-none outline-none bg-blue-600 hover:bg-blue-700 active:bg-blue-600"
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
			class="absolute shadow-2xl shadow-gray-400 bg-white py-2 px-2 z-[1000] min-w-full w-max rounded max-h-96 overflow-auto"
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
	</div>
</template>

<script setup>
const config = useRuntimeConfig();
import axios from "axios";
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
authStore.loadToken();

const users = ref([]);
const searchInput = ref("");
const error = ref("");

let timeout;
const debounce = (func, delay) => {
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), delay);
	};
};

// Fetch users on component mount
const handleSearch = async () => {
	error.value = ""; // Reset error before making the request
	try {
		const response = await axios.get(`${config.public.apiUrl}get-users`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		// Map users and set the `checked` property based on whether share_user_id is not null
		users.value = (response.data.users || []).map((user) => ({
			...user,
			checked: user.share_user_id !== null, // Set checked to true if share_user_id is not null
		}));
	} catch (err) {
		console.error("Error fetching users:", err);
		error.value = "Error fetching users";
	}
	console.log(users.value);
};

// Normalize string to ignore diacritics
const normalizeString = (str) => {
	return str
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
};

// Computed property to filter users
const filteredUsers = computed(() => {
	if (!searchInput.value) {
		return users.value; // Return all users if search input is empty
	}
	const normalizedSearchInput = normalizeString(searchInput.value);
	return users.value.filter((user) => {
		const userFullName = `${user.first_name} ${user.last_name}`;
		return normalizeString(userFullName).includes(normalizedSearchInput);
	});
});

// Watch for input changes and debounce the search
const debounceSearch = debounce(handleSearch, 200);

// Handle checkbox change
const handleCheckboxChange = async (userId, isChecked) => {
	console.log(`User ID: ${userId}, Checked: ${isChecked}`);
	if (isChecked) {
		try {
			const response = await axios.post(
				`${config.public.apiUrl}add-share-id/${userId}`,
				{}, // Sending an empty body (if your API does not require one)
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
			// Handle response if necessary
			console.log(response.data);
		} catch (error) {
			console.error("Error adding share ID:", error);
			error.value = "Error adding share ID"; // Set error message for user feedback
		}
	} else {
		try {
			const response = await axios.post(
				`${config.public.apiUrl}null-share-id`,
				{}, // Sending an empty body (if your API does not require one)
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
			// Handle response if necessary
			console.log(response.data);
		} catch (error) {
			console.error("Error removing share ID:", error);
			error.value = "Error removing share ID"; // Set error message for user feedback
		}
	}
};

// Fetch users on component mount
onMounted(() => {
	handleSearch();
});

// Dropdown state management
const isDropdownOpen = ref(false);
const toggleDropdown = () => {
	isDropdownOpen.value = !isDropdownOpen.value;
};
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
	background-size: 100%;
	background-repeat: no-repeat;
	background-position: center;
	transform: translate(-50%, -50%);
}
</style>
