<template>
	<div class="flex" @keydown.enter="handleSearch">
		<div class="relative">
			<Icon
				icon="fa6-solid:magnifying-glass"
				class="absolute top-5 left-3 text-gray-400"
			/>
			<input
				v-bind="meno"
				type="search"
				id="search-first"
				class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg rounded-r-none bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				placeholder="Meno ..."
				required
			/>
		</div>
		<div class="relative">
			<Icon
				icon="fa6-solid:magnifying-glass"
				class="absolute top-5 left-3 text-gray-400"
			/>
			<input
				v-model="priezvisko"
				type="search"
				id="search-first"
				class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg rounded-l-none bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				placeholder="Priezvisko ..."
				required
			/>
		</div>
	</div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
const meno = ref("");
const priezvisko = ref("");

const handleSearch = () => {
	const search = { meno: meno.value, priezvisko: priezvisko.value };
	console.log(search);
};
</script>

<style scoped>
/* Your styles here */
</style>
