<template>
	<div class="ml-8 my-4 max-w-[350px]">
		<h2 class="text-xl font-semibold mb-4">Zdieľanie kancelárií</h2>
		<div class="mb-2">Vyberte človeka, ktorý uvidí vaše kancelárie:</div>
		<ul class="max-h-[400px] overflow-y-auto p-0 w-3/4">
			<li
				class="hover:bg-slate-300 w-full m-0 my-2 py-1 rounded-sm cursor-pointer"
				v-for="user in userStore.allUsers"
				:key="user.id"
				@click="addUserToShare(user.id)"
			>
				{{ user.first_name }} {{ user.last_name }}
			</li>
		</ul>
	</div>
</template>

<script setup>
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useOfficeStore } from "#imports";
const officeStore = useOfficeStore();

const emit = defineEmits(["openSharingForm"]);

const addUserToShare = (userId) => {
	console.log("User ID to share with:", userId);
	officeStore.addUserToOfficeShare(userId);
	emit("openSharingForm");
	// Tu môžete pridať logiku na zdieľanie kancelárie s vybraným používateľom
};
</script>
