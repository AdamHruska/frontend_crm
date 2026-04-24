<script setup>
import { ref, watch } from "vue";
import { useRuntimeConfig } from "#imports";
import { useAuthStore } from "@/stores/authStore";

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
});

let timeout;
const debounceSearch = (func, delay) => {
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
};

const handleSearch = () => {
	if (searchInput.value === "") {
		searchResults.value = originalArray.value;
	} else {
		searchResults.value = props.call_lists.filter((item) =>
			item.name.toLowerCase().includes(searchInput.value.toLowerCase()),
		);
	}
	emit("updateResults", searchResults.value);
};

watch(searchInput, debounceSearch(handleSearch, 200));
</script>

<template>
	<div class="search-wrapper">
		<div class="search-icon">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
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
			placeholder="Hľadať zoznamy..."
			class="search-input"
		/>
	</div>
</template>

<style scoped>
.search-wrapper {
	position: relative;
	width: 100%;
}

.search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: none;
	display: flex;
	align-items: center;
}

.search-icon svg {
	width: 15px;
	height: 15px;
	color: #94a3b8;
}

.search-input {
	width: 100%;
	padding: 10px 14px 10px 38px;
	font-size: 0.8rem;
	font-family: "DM Sans", sans-serif;
	background: #f1f5f9;
	border: 1.5px solid transparent;
	border-radius: 10px;
	color: #1e293b;
	outline: none;
	transition:
		border-color 0.2s,
		background 0.2s,
		box-shadow 0.2s;
	box-sizing: border-box;
}

.search-input::placeholder {
	color: #94a3b8;
}

.search-input:focus {
	background: #ffffff;
	border-color: #6366f1;
	box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* Remove native search clear button */
.search-input::-webkit-search-cancel-button {
	-webkit-appearance: none;
}
</style>
