<template>
	<!-- tu dat podmienku pre zobrazenie stranky -->
	<div v-if="isAdmin">skuska</div>
	<div
		v-else
		class="text-2xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2"
	>
		Prístup má len administrátor
	</div>
</template>

<script setup>
import { useUserStore } from "#imports";
const userStore = useUserStore();

onBeforeMount(() => {});

const isAdmin = computed(() => {
	if (
		userStore.user &&
		userStore.user.first_name === "admin" &&
		userStore.user.last_name === "admin" &&
		userStore.user.email === "admin@admin.com"
	) {
		return true;
	} else {
		return false;
	}
});
</script>
