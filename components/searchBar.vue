<script setup>
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();
const searchInput = ref("");
const searchResults = ref([]);
import axios from "axios";
const error = ref("");

const emit = defineEmits(["updateResults"]);

const handleSearch = async () => {
	error.value = ""; // Reset error before making the request
	try {
		const response = await axios.get(
			"http://localhost:8000/api/search-contacts",
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
</script>

<template>
	<div class="relative" @keydown.enter="handleSearch">
		<div
			class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
		>
			<svg
				class="w-4 h-4 text-gray-500 dark:text-gray-400"
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
			class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
			placeholder="Hľadať ..."
			required
		/>
		<button
			@click="handleSearch"
			type="submit"
			class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
		>
			Hľadať
		</button>
	</div>
</template>
