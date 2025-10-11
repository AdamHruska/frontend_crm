<template>
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

		<UTable
			:rows="people"
			:columns="columns"
			class="mx-6 table-container shadow-md rounded-md"
			:row-class="(row) => row.class"
		>
			<template #actions-data="{ row }">
				<div class="flex justify-between">
					<div class="flex space-x-4">
						<UButton
							@click.left="ShowPasswordResetForm(row.id)"
							@auxclick.prevent="onAuxClick($event, row.id)"
							@mousedown="handleMouseDown"
							class="bg-blue-500 text-white shadow-xl"
							label="Reset Password"
						/>

						<!-- <UButton
							@click="findPerson(row.id)"
							icon="i-heroicons-pencil-square-20-solid"
							variant="ghost"
							class="shadow-xl hover:bg-gray-300"
						/> -->
						<UButton
							@click="deletePerson(row.id)"
							icon="i-heroicons-trash-20-solid"
							color="ffffff"
							class="shadow-xl text-red-500 hover:bg-gray-300"
						/>
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
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();

const people = computed(() => userStore.allUsersAdmin ?? []);
const userID = ref(null);
const PasswordResetBool = ref(false);

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

		// 	people.value = results.map((person) => {
		// 		let cssClass = "";
		// 		if (person.first_event === 0) {
		// 			cssClass += "bg-green-200 ";
		// 		}
		// 		if (person.only_called_never_answered === 1) {
		// 			cssClass += "bg-orange-200 ";
		// 		}
		// 		return {
		// 			...person,
		// 			class: cssClass.trim(),
		// 		};
		// 	});
		// }
		// // If results is paginated data (from store), use the data property
		// else if (results && results.data) {
		// 	people.value = results.data.map((person) => {
		// 		let cssClass = "";
		// 		if (person.first_event === 0) {
		// 			cssClass += "bg-green-200 ";
		// 		}
		// 		if (person.only_called_never_answered === 1) {
		// 			cssClass += "bg-orange-200 ";
		// 		}
		// 		return {
		// 			...person,
		// 			class: cssClass.trim(),
		// 		};
		// 	});
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

const deletePerson = async (id) => {
	await userStore.deleteUserAdmin(id);
};
</script>
