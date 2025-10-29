<template>
	<div
		class="absolute top-[10%] left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-lg shadow-lg w-[600px] z-50"
	>
		<div class="cursor-pointer" @click="cancelDelete()">
			<Icon
				icon="fa6-solid:xmark"
				class="absolute top-4 right-6 hover:scale-125"
			/>
		</div>

		<div class="mt-8">
			<div class="mb-4">
				Delegovať kontakty používateľa (Meno a priezvisko) na:
			</div>

			<!-- User list -->
			<div>
				<!--<UserList :users="filteredUsers" />-->
				<div>
					<input
						type="text"
						v-model="searchQuery"
						placeholder="Search users..."
						class="w-full p-2 border border-gray-300 bg-white rounded mb-4"
					/>
				</div>

				<!-- User list -->
				<div class="max-h-[700px] overflow-y-auto">
					<div class="border border-gray-300 rounded"></div>
					<div
						v-for="user in filteredUsers"
						:key="user.id"
						@click="selectUser(user)"
						class="px-2 py-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between rounded"
					>
						<div class="font-semibold">
							{{ user.first_name }} {{ user.last_name }}
						</div>
						<div>({{ user.email }})</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { Icon } from "@iconify/vue";

import { useToast } from "vue-toastification";
const toast = useToast();

import { useUserStore } from "#imports";
const userStore = useUserStore();

const searchQuery = ref("");

const emit = defineEmits(["close-delete-modal", "close-delete-modal-success"]);
const props = defineProps({
	oldUserID: {
		type: [Number, String],
		required: true,
	},
});

onMounted(() => {
	const filteredUsers = userStore.allUsersAdminALL;
});

const filteredUsers = computed(() => {
	return userStore.allUsersAdminALL.filter((user) => {
		const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
		return (
			fullName.includes(searchQuery.value.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
		);
	});
});

const selectUser = (user) => {
	const newUserId = user.id;
	const oldUserId = props.oldUserID;
	userStore.delegateUserContactsAdmin(oldUserId, newUserId);
	emit("close-delete-modal");
};

// onMounted(() => {
// 	console.log("old user id", props.oldUserID);
// });

const cancelDelete = () => {
	emit("close-delete-modal");
};
</script>
