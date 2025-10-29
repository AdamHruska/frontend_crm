<template>
	<DeleteUserModal
		v-if="showDeleteUserModal"
		@close-delete-modal="changeDeleteUserModal"
		:oldUserID="IDtoDelete"
	/>

	<PasswordResetForm
		:userID="userID"
		v-if="PasswordResetBool"
		@closeForm="ShowPasswordResetForm"
	/>

	<!-- tu dat podmienku pre zobrazenie stranky -->
	<div v-if="isAdmin" class="mt-8">
		<div class="max-w-sm ml-8 mt-8 mb-2 w-[400px]">
			<SearchBarUsers @updateResults="handleSearchResults" />
		</div>

		<button
			@click="toggleDeletedUsers"
			class="px-4 py-2 bg-blue-500 rounded-md absolute right-6 hover:bg-blue-400 text-white cursor-pointer hover:scale-105 transition-transform"
		>
			{{ showDeletedOnly ? "Vsetci používatelia" : "Vymazaný používatelia" }}
		</button>

		<div class="relative">
			<Icon
				icon="material-symbols:chat-info-outline"
				class="absolute top-[-40px] right-12 scale-[2] hover:scale-[2.5] cursor-pointer transition-transform"
				@mouseenter="showDisclaimer = true"
				@mouseleave="showDisclaimer = false"
			/>
			<div
				class="bg-white rounded-md shadow-md w-[300px] h-[250px] absolute right-8 top-[-10px] z-[50] py-3 px-4"
				id="disclaimer"
				v-if="showDisclaimer"
			>
				<!-- Colour -->
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-gray-300"></div>
					<div>- Používateľ bol odstránený</div>
				</div>
				<div class="flex items-center space-x-2 mb-2">
					<div class="w-[32px] h-[32px] bg-red-400"></div>
					<div>- Random Text</div>
				</div>
			</div>
		</div>

		<!-- Disclaimer element -->

		<UTable
			:rows="people"
			:columns="columns"
			class="mx-6 table-container shadow-md rounded-md mt-8"
			:row-class="(row) => row.class"
		>
			<template #actions-data="{ row }">
				<div class="flex justify-between">
					<div class="flex space-x-4">
						<UButton
							@click.left="ShowPasswordResetForm(row.id)"
							@auxclick.prevent="onAuxClick($event, row.id)"
							@mousedown="handleMouseDown"
							class="bg-blue-500 text-white shadow-xl hover:scale-110 transition-transform"
							label="Reset Password"
						/>

						<!-- <UButton
							@click="findPerson(row.id)"
							icon="i-heroicons-pencil-square-20-solid"
							variant="ghost"
							class="shadow-xl hover:bg-gray-300"
						/> -->

						<UTooltip
							text="Vymyzať používateľa"
							:ui="{ background: '!bg-white', color: '' }"
							class=""
						>
							<UButton
								@click="deletePerson(row.id)"
								icon="i-heroicons-trash-20-solid"
								color="ffffff"
								class="shadow-xl text-red-500 hover:bg-gray-100 hover:scale-110 transition-transform"
							/>
						</UTooltip>

						<UTooltip
							text="Obnoviť používateľa"
							:ui="{
								base: '!bg-white !text-gray-900',
								background: '!bg-white',

								ring: '',
								shadow: 'shadow-lg',
							}"
							v-if="row.hidden === 1"
						>
							<UButton
								@click="restoreUser(row.id)"
								icon="typcn:media-play-reverse-outline"
								color="ffffff"
								class="shadow-xl hover:bg-gray-100 hover:scale-110 transition-transform"
							/>
						</UTooltip>
					</div>
					<!-- <input
						type="checkbox"
						@change="toggleCheckbox(row.id)"
						:checked="isSelected(row.id)"
					/> -->
				</div>
			</template>

			<template #poznamka-data="{ row }">
				<div v-if="row.poznamka" class="group relative">
					<div class="truncate max-w-[200px]">
						{{ row.poznamka }}
					</div>
					<div
						class="absolute hidden group-hover:block z-10 w-[300px] p-2 bg-white border border-gray-200 rounded shadow-lg"
					>
						<div class="text-sm text-gray-700 whitespace-normal">
							{{ row.poznamka }}
						</div>
					</div>
				</div>
			</template>
		</UTable>
	</div>
	<div
		v-else
		class="text-2xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2"
	>
		Prístup má len administrátor
	</div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();

const showDeletedOnly = ref(false);

const people = computed(() => {
	const users = userStore.allUsersAdmin ?? [];
	return users
		.filter((user) => !showDeletedOnly.value || user.hidden === 1)
		.map((user) => ({
			...user,
			class: user.hidden === 1 ? "bg-gray-300" : "",
		}));
});

const userID = ref(null);
const PasswordResetBool = ref(false);

const showDeleteUserModal = ref(false);

const columns = [
	{
		key: "first_name",
		label: "Meno",
	},
	{
		key: "last_name",
		label: "Priezvisko",
	},
	{
		key: "vizitka_phone_num",
		label: "tel. číslo",
	},
	{
		key: "email",
		label: "Email",
	},
	{
		key: "vizitka_position",
		label: "Pozícia",
	},

	{
		key: "actions",
	},
	{
		key: "checkbox",
		label: "",
		type: "checkbox",
	},
];

onBeforeMount(() => {});

onMounted(async () => {
	await userStore.fetchAllUsersAdmin();
	console.log("All Users Admin:", userStore.allUsersAdmin);
});

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

const handleSearchResults = (results) => {
	// If results is an array (search results), update people
	if (Array.isArray(results)) {
		userStore.allUsersAdmin = results;
	}
};

const ShowPasswordResetForm = (userId) => {
	if (userId) {
		userID.value = userId;
		PasswordResetBool.value = true;
	} else {
		PasswordResetBool.value = false;
	}
};

const changeDeleteUserModal = () => {
	showDeleteUserModal.value = !showDeleteUserModal.value;
};
const IDtoDelete = ref(null);

const deletePerson = async (id) => {
	//await userStore.deleteUserAdmin(id);
	IDtoDelete.value = id;
	changeDeleteUserModal();
};

const showDisclaimer = ref(false);

const toggleDeletedUsers = () => {
	showDeletedOnly.value = !showDeletedOnly.value;
};

const restoreUser = async (id) => {
	await userStore.restoreUserAdmin(id);
	console.log("Restoring user with ID:", id);
};
</script>

<style></style>
