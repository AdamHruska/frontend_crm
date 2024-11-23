<script setup>
import { ref, watch } from "vue";
import { useRuntimeConfig } from "#imports";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

const config = useRuntimeConfig();
const authStore = useAuthStore();
authStore.loadToken();

const searchInput = ref("");
const searchResults = ref([]);
const error = ref("");

const originalArray = ref([]);

const emit = defineEmits(["updateResults"]);

const props = defineProps({
	call_lists: Array,
});

onMounted(() => {
	originalArray.value = [...props.call_lists];
	console.log("Original array:", originalArray.value);
});

// Debounce logic
let timeout;
const debounceSearch = (func, delay) => {
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
};

// emit("updateResults", searchResults.value);

// Handle search function
const handleSearch = () => {
	if (searchInput.value === "") {
		// If search input is empty, reset to the original array
		searchResults.value = originalArray.value;
	} else {
		// Otherwise, filter based on the search input
		searchResults.value = props.call_lists.filter((item) =>
			item.name.toLowerCase().includes(searchInput.value.toLowerCase())
		);
	}

	// Emit the results to the parent component
	emit("updateResults", searchResults.value);
};

// Watch for changes in the searchInput and trigger a debounced search
watch(searchInput, debounceSearch(handleSearch, 200));
</script>

<template>
	<div class="relative rounded-full">
		<div
			class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none rounded-full"
		>
			<svg
				class="w-4 h-4 text-gray-700"
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
			class="block w-full p-4 ps-10 text-sm text-black border border-gray-400 border-2 rounded-full bg-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
			placeholder="Hľadať ..."
			required
		/>
		<button
			@click="handleSearch"
			type="submit"
			class="text-white absolute end-2.5 bottom-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-4 py-2"
		>
			Hľadať
		</button>
	</div>
</template>
