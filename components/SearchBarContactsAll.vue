<template>
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
			id="default-search"
			class="block w-full p-4 ps-10 text-sm text-black border border-gray-400 border-2 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
			placeholder="Hľadať ..."
			required
		/>
		<button
			@click="handleSearch"
			type="submit"
			class="text-white absolute end-2.5 bottom-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
		>
			Hľadať
		</button>
	</div>
</template>

<script setup>
const config = useRuntimeConfig();

import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { useContactsStore } from "@/stores/contactsStore";
const authStore = useAuthStore();
authStore.loadToken();

const contactsStore = useContactsStore();
const searchInput = ref("");
const searchResults = ref([]);
const error = ref("");

const emit = defineEmits(["updateResults"]);

// Debounce logic: Creates a delay before calling handleSearch to avoid too many API calls
let timeout;
const debounceSearch = (func, delay) => {
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), delay);
	};
};

// Handle search function
const handleSearch = async () => {
	error.value = ""; // Reset error before making the request
	try {
		const response = await axios.get(
			`${config.public.apiUrl}search-contacts-admin`,
			{
				params: {
					query: searchInput.value,
				},
				headers: {
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			}
		);

		// Check if response.data contains contacts
		if (response.data && response.data.contacts) {
			searchResults.value = response.data.contacts;
			contactsStore.searchQueryAdmin = searchInput.value;
			emit("updateResults", searchResults.value);
		} else {
			console.error("Unexpected response structure:", response.data);
			error.value = "Unexpected response structure";
		}
	} catch (err) {
		console.error("Error fetching search results:", err);
		error.value = "Error fetching search results";
	}
	console.log(searchResults.value);
};

// Watch for changes in the searchInput and trigger a debounced search
watch(searchInput, debounceSearch(handleSearch, 200));

onMounted(() => {
	if (contactsStore.searchQueryAdmin) {
		searchInput.value = contactsStore.searchQueryAdmin;
		//handleSearch();
	}
});
</script>
