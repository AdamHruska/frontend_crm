<template>
	<div class="ml-8 my-4 max-w-[350px]">
		<div class="flex justify-between">
			<h2 class="text-xl font-semibold mb-4">Zdieľanie kancelárií</h2>

			<div
				class="cursor-pointer ml-20 mt-1 hover:scale-105 transition-transform"
				@click="emit('openSharingForm')"
			>
				<Icon icon="fa6-solid:xmark" class="" />
			</div>
		</div>

		<div>
			<label for="officeSelect" class="block mb-2 text-slate-500 mt-2"
				>Vyberte kanceláriu:</label
			>
			<select
				v-model="selectedOfficeId"
				class="mb-4 w-full bg-white border rounded-md border-slate-200 p-2"
			>
				<option
					v-for="office in allOffices"
					:value="office.id"
					:key="office.id"
				>
					{{ office.name }}
				</option>
			</select>
		</div>

		<div class="shadow-lg rounded-md p-4 bg-white">
			<input
				placeholder="Vyhľadávanie ... "
				type="text"
				name=""
				id=""
				v-model="searchQuery"
				class="bg-white border rounded-md w-full border-slate-200 pl-2 mb-2"
			/>
			<ul class="max-h-[400px] overflow-y-auto p-0 w-full pl-2">
				<li
					class="hover:bg-slate-300 w-full m-0 my-2 py-1 rounded-sm cursor-pointer"
					:class="{ 'bg-gray-300': user.id === selectedUserId }"
					v-for="user in filteredUsers"
					:key="user.id"
					@click="selectUser(user.id)"
				>
					{{ user.first_name }} {{ user.last_name }}
				</li>
			</ul>

			<button
				@click="addUserToShare()"
				class="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors ml-auto block"
			>
				Zdielať kanceláriu
			</button>
		</div>
	</div>
</template>

<script setup>
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useOfficeStore } from "#imports";
const officeStore = useOfficeStore();

import { Icon } from "@iconify/vue";

const emit = defineEmits(["openSharingForm"]);

const searchQuery = ref("");

const allOffices = ref([]);

const selectedOfficeId = ref(null);
const selectedUserId = ref(null);

const selectUser = (userId) => {
	selectedUserId.value = userId;
};

onMounted(() => {
	allOffices.value = [
		...officeStore.officesSharedWithMe,
		...officeStore.offices,
	];

	console.log("All offices:", allOffices.value);
});

const filteredUsers = computed(() => {
	if (!searchQuery.value) {
		return userStore.allUsers;
	}
	return userStore.allUsers.filter((user) => {
		const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
		return fullName.includes(searchQuery.value.toLowerCase());
	});
});

const addUserToShare = () => {
	console.log("office id", selectedOfficeId.value);
	console.log("user id", selectedUserId.value);
	officeStore.addUserToOfficeShare(
		selectedUserId.value,
		selectedOfficeId.value
	);
	emit("openSharingForm");
};
</script>
