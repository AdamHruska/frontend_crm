<script setup>
import { ref, watch } from "vue";

const searchInput = ref("");
const emit = defineEmits(["update-search"]);

watch(searchInput, (newValue) => {
	emit("update-search", newValue);
});

const handleKeydown = (e) => {
	if (e.key === "Enter") {
		e.preventDefault(); // Prevent form submission on Enter
	}
};
</script>

<template>
	<div class="">
		<input
			v-model="searchInput"
			type="text"
			placeholder="Search ..."
			@keydown="handleKeydown"
			class="border-none bg-white focus:border-solid focus:border-black focus:ring-1 focus:ring-gray-300 focus:outline-none rounded-lg p-2 w-full"
		/>
	</div>
</template>
