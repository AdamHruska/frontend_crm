<script setup>
const config = useRuntimeConfig();

import { useContactsStore } from "#imports";
const contactsStore = useContactsStore();

import axios from "axios";
import { format } from "date-fns";

import { useRoute } from "vue-router";

import { useTodosStore } from "../stores/todoStore";
const todoStore = useTodosStore();

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

const { id } = useRoute().params;
const people = ref([]);
const AddActivityBool = ref(false);

const activities = ref([]);

const author_id = ref(null);
const user_id = ref(null);

const changeAddActivityBool = () => {
	AddActivityBool.value = !AddActivityBool.value;
};

const activities_todo = ref([]);

watch(
	() => todoStore.todos,
	(newTodos) => {
		// Filter todos by contact_id matching current `id`, just like in onBeforeMount
		activities_todo.value = newTodos
			.filter((todo) => todo.contact_id == id)
			.map((todo, index) => ({
				id: todo.id || index,
				activity: todo.activity_name,
				dueDate: todo.due_date.split("+")[0].replace("T", " ").slice(0, -3),
				updated_at: todo.is_completed
					? todo.updated_at.split("+")[0].replace("T", " ").slice(0, -3)
					: null,
				completed: todo.is_completed,
			}));
	},
	{ deep: true, immediate: true }
);

const callListNames = ref([]);

onBeforeMount(async () => {
	contactsStore.lastShowenDetails = id;
	await findPerson(id);
	await findActivities(id);
	await todoStore.fetchTodos();
	activities_todo.value = todoStore.todos
		.filter((todo) => todo.contact_id == id)
		.map((todo) => ({
			id: todo.id,
			activity: todo.activity_name,
			dueDate: todo.due_date.split("+")[0].replace("T", " ").slice(0, -3),
			updated_at: todo.is_completed
				? todo.updated_at.split("+")[0].replace("T", " ").slice(0, -3)
				: null,
			completed: todo.is_completed,
		}));
	// activities_todo.value = todoStore.todos.map((todo) => ({
	// 	activity: todo.activity_name,
	// 	dueDate: todo.due_date.split("T")[0], // get only the date part
	// 	// use a fallback if not present
	// 	completed: todo.is_completed,
	// }));
	console.log("Activities todo:", activities_todo.value);
	console.log("id test:", id);
	const user = await getUser();
	user_id.value = user.id;
	console.log("User ID:", user_id.value);
	console.log("Contact uthor ID:", author_id.value);

	callListNames.value = await axios.get(`${config.public.apiUrl}call-lists`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});

	callListNames.value = callListNames.value.data;
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		if (response.data && response.data.contact) {
			people.value = [response.data.contact];
		}
		author_id.value = response.data.contact.author_id;
		console.log("people value:", people.value);
	} catch (error) {
		console.error("Error fetching contact:", error);
	}
};

const findActivities = async (id) => {
	const response = await axios.get(
		`${config.public.apiUrl}contacts/${id}/activities`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	activities.value = response.data.activities;
	// activities = activities.map((item) => ({
	// 	...item,
	// 	selectedLetter: null,
	// }));
	console.log("Activities test:", activities.value);
};

const getUser = async (id) => {
	const response = await axios.get(`${config.public.apiUrl}get-user`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	return response.data.user;
};

const actityFormBool = ref(false);
const activityID = ref(null);

const alterActivity = (id) => {
	activityID.value = id;
	actityFormBool.value = !actityFormBool.value;
	console.log("alterActivity", actityFormBool.value);
};

const addActivityToList = (activity) => {
	console.log("Activity added to list:", activity);
	activities.value.push(activity);
};

// const columns = [
// 	{ key: "meno", label: "Meno", class: "bg-gray-200" },
// 	{ key: "priezvisko", label: "Priezvisko", class: "bg-gray-200" },
// 	{ key: "cislo", label: "tel. číslo", class: "bg-gray-200" },
// 	{ key: "email", label: "Email", class: "bg-gray-200" },
// 	{ key: "odporucitel", label: "Odporucitel", class: "bg-gray-200" },
// 	{
// 		key: "created_at",
// 		label: "Dátum pridania",
// 		class: "bg-gray-200",
// 	},
// 	{ key: "adresa", label: "Adresa", class: "bg-gray-200" },
// 	{ key: "rok_narodenia", label: "Vek", class: "bg-gray-200" },
// 	{ key: "zamestanie", label: "Zamestnanie", class: "bg-gray-200" },
// 	// {
// 	// 	key: "Investicny_dotaznik",
// 	// 	label: "Investicny dotazník vyplenený",
// 	// 	class: "bg-gray-200",
// 	// },
// 	{ key: "actions", class: "bg-gray-200" },
// ];

// const editPerson = async (id) => {
// 	try {
// 		// First, try to find the contact in the local store
// 		const contactFromStore = contactsStore.contacts.data.find(
// 			(contact) => contact.id === id
// 		);

// 		if (contactFromStore) {
// 			// Use contact from store if found
// 			single_contact.value = { ...contactFromStore };
// 		} else {
// 			// Fetch contact from API if not in store
// 			const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
// 				headers: {
// 					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
// 				},
// 			});
// 			single_contact.value = response.data.contact;
// 		}

// 		// Open the alter person form
// 		alterPerson();
// 	} catch (error) {
// 		console.error("Error finding person:", error);
// 		alert("Could not find contact details");
// 	}
// };

const deleteContact = async (id) => {
	contactsStore.deleteContact(id);
};

const columns_first_row = [
	{ key: "meno", label: "Meno", class: "bg-gray-200" },
	{ key: "priezvisko", label: "Priezvisko", class: "bg-gray-200" },
	{ key: "cislo", label: "tel. číslo", class: "bg-gray-200" },
	{ key: "email", label: "Email", class: "bg-gray-200" },
	{ key: "odporucitel", label: "Odporucitel", class: "bg-gray-200" },
];

const columns_second_row = [
	{
		key: "created_at",
		label: "Dátum pridania",
		class: "bg-gray-200",
	},
	{ key: "adresa", label: "Adresa", class: "bg-gray-200" },
	{ key: "rok_narodenia", label: "Vek", class: "bg-gray-200" },
	{ key: "zamestanie", label: "Zamestnanie", class: "bg-gray-200" },
	{ key: "actions", class: "bg-gray-200" },
];

const items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => showAlterPersonForm(),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () => deleteContact(row.id).then(navigateTo("/")),
		},
	],
];

const columns_activity = ref([
	{
		key: "aktivita",
		label: "Aktivita",
		class: "bg-gray-200 w-10",
	},
	{ key: "datumCas", label: "Začiatok", class: "bg-gray-200 w-10" },
	{ key: "koniec", label: "Koniec", class: "bg-gray-200 w-10" },
	{
		key: "poznamka",
		label: "Poznámka k aktivite",
		class: "bg-gray-200 w-[800px]",
	},
	{ key: "volane", label: "Volané", class: "bg-gray-200 w-10" },
	{
		key: "dovolane",
		label: "Dovolané",
		class: "bg-gray-200 w-10",
	},
	{
		key: "dohodnute",
		label: "Dohodnuté",
		class: "bg-gray-200 w-10",
	},
	{
		key: "letters",
		label: "Vyhodnotenie stretnutia",
		class: "bg-gray-200 w-10",
	},
	{ key: "created_at", label: "Vytvorené", class: "bg-gray-200 w-10" },
	{
		key: "miesto_stretnutia",
		label: "Miesto stretnutia",
		class: "bg-gray-200",
	},
	{ key: "actions", class: "bg-gray-200" },
]);

const activity_items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => alterActivity(row.id),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () =>
				axios
					.delete(`${config.public.apiUrl}delete-activities/${row.id}`, {
						headers: {
							Authorization: `Bearer ${authStore.token}`,
						},
					})
					.then(() => {
						activities.value = activities.value.filter(
							(activity) => activity.id !== row.id
						);
					}),
		},
	],
];

const handleActivityRowClick = (row) => {
	console.log("Activity row clicked:", row);
};

const formatDate = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy");
};

const formatDateTime = (dateToFormat) => {
	const date = new Date(dateToFormat);
	return format(date, "dd-MM-yyyy HH:mm");
};

function calculateAge(yearOfBirth) {
	const currentYear = new Date().getFullYear();
	const age = currentYear - yearOfBirth;
	return age;
}

const showAlterPesonForm = ref(false);

const showAlterPersonForm = () => {
	showAlterPesonForm.value = !showAlterPesonForm.value;
};

const updatePerson = async (updatedContact) => {
	try {
		// Update the local people array first
		if (people.value.length > 0) {
			// Preserve all existing properties and merge with updated ones
			people.value = [{ ...people.value[0], ...updatedContact }];
		} else {
			people.value = [updatedContact];
		}

		// Close the form
		showAlterPesonForm.value = false;

		// Update the contact in the store
		try {
			// Make sure we pass the complete contact object with all properties
			const completeContact = { ...people.value[0] };
			await contactsStore.updatePerson(completeContact);
			console.log("Contact updated in store successfully");
		} catch (storeError) {
			console.warn("Failed to update contact in store:", storeError);
			// We've already updated the UI, so we can continue
		}

		console.log("Contact updated successfully", people.value[0]);
	} catch (error) {
		console.error("Error updating contact:", error);
		alert(`Failed to update contact: ${error.message}`);
	}
};

const columns_todo = [
	{
		key: "dueDate",
		label: "Termín dokončenia",
	},
	{
		key: "activity",
		label: "Aktivita",
	},
	{
		key: "completed",
		label: "Dokončené",
	},
	{
		key: "updated_at",
		label: "Dokončené",
	},
	{ key: "actions", class: "bg-gray-200" },
];
// const activities_todo = ref([
// 	{
// 		activity: "Zavolať klientovi",
// 		dueDate: "2023-10-01",

// 		completed: false,
// 	},
// 	{
// 		activity: "Poslať email",
// 		dueDate: "2023-10-02",

// 		completed: true,
// 	},
// ]);

const todo_items = (row) => [
	[
		{
			label: "Edit",
			icon: "i-heroicons-pencil-square-20-solid",
			click: () => changeupdateTodoBool(row),
		},
	],
	[
		{
			label: "Delete",
			icon: "i-heroicons-trash-20-solid",
			click: () => todoStore.deleteTodo(row.id),
		},
	],
];
const todoBool = ref(false);

const changeToDoBool = () => {
	todoBool.value = !todoBool.value;
};
const updateTodoBool = ref(false);
const todoToUpdate = ref({});

const changeupdateTodoBool = (row) => {
	updateTodoBool.value = !updateTodoBool.value;
	console.log("UpdateToDoForm", updateTodoBool.value);
	todoToUpdate.value = row;
};

function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}
const callListBool = ref(false);

const changeCallListBool = () => {
	callListBool.value = !callListBool.value;
};

const pendingFirstMeetingRow = ref(null);

const currentActivity = ref(null);

const changeActivityStatus = async (row, status) => {
	try {
		if (row.aktivita === "Prvé stretnutie" && status === "check") {
			// Show confirmation modal instead of directly creating the activity
			changeConfirmEventModal();
			// Store the row data for later use
			pendingFirstMeetingRow.value = row;
			return;
		}

		if (status === "discarded") {
			currentActivity.value = row;
			changeDiscardActivityModal();
		}

		// Update local state immediately for better UX
		const originalStatus = row.activity_status;
		row.activity_status = status;

		await axios.patch(
			`${config.public.apiUrl}activities/${row.id}/status`,
			{
				activity_status: status,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		console.log(`Activity ${row.id} status updated to: ${status}`);
	} catch (error) {
		// Revert local state if API call fails
		row.activity_status = originalStatus;
		console.error("Error updating activity status:", error);
	}
};

const handleConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			// Update local state immediately for better UX
			pendingFirstMeetingRow.value.activity_status = "check";

			// Create the financial analysis activity
			await addFinancialAnalysisActivity(
				pendingFirstMeetingRow.value.contact_id,
				pendingFirstMeetingRow.value.koniec
			);

			// Now update the status of the original meeting in the backend
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{
					activity_status: "check",
				},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);

			// Refresh activities to show the new one
			await findActivities(id);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
		// Optionally show error message to user
	} finally {
		// Close the modal and clear the pending row
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

async function addFinancialAnalysisActivity(contactId, dateTimeStart) {
	try {
		// Convert the start time string to a Date object
		const startTime = new Date(dateTimeStart);

		// Add one hour to create the end time
		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

		// Format the end time back to the same string format
		const dateTimeEnd = endTime
			.toISOString()
			.replace("T", " ")
			.substring(0, 19);

		const response = await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: contactId,
				aktivita: "Analýza osobných financí",
				datumCas: dateTimeStart,
				koniec: dateTimeEnd,
				volane: null,
				dovozene: null,
				dohodnute: null,
				online_meeting: false,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		// Add the new activity to the local state
		activities.value.push(response.data.activity);

		console.log("Activity created:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error creating activity:",
			error.response?.data || error.message
		);
		throw error;
	}
}

const showConfirmEvent = ref(false);

const changeConfirmEventModal = () => {
	showConfirmEvent.value = !showConfirmEvent.value;
};

const showDiscardActivityModal = ref(false);

const changeDiscardActivityModal = () => {
	showDiscardActivityModal.value = !showDiscardActivityModal.value;
};

// const handleConfirmDiscardActivity = (discardMessage) => {
// 	changeDiscardActivityModal();
// 	console.log(discardMessage);
// };
</script>

<template>
	<DiscardActivityModal
		v-if="showDiscardActivityModal"
		:activityData="currentActivity"
		@closeDiscardActivity="changeDiscardActivityModal"
		@confirmDiscardActivity="changeDiscardActivityModal"
	/>

	<ConfirmEventModal
		v-if="showConfirmEvent"
		@close="changeConfirmEventModal"
		@confirm="handleConfirmEvent"
	/>
	<Loadigcomponent v-if="todoStore.loadingState" />

	<CallListAdd
		v-if="callListBool"
		:callListNames="callListNames"
		:user_id="id"
		:selected="id"
		@cancleCallListForm="changeCallListBool"
	/>

	<UpdateToDoForm
		:item="todoToUpdate"
		v-if="updateTodoBool"
		@cancelToDoActivity="changeupdateTodoBool"
	/>

	<addToDoForm
		v-if="todoBool"
		@cancelToDoActivity="changeToDoBool"
		:contact_id="id"
		:contact="people"
	/>

	<AlterPersonForm
		v-if="showAlterPesonForm"
		@cancelAlter="showAlterPersonForm()"
		:single_contact="people[0]"
		@alterPerson="updatePerson"
	/>

	<div class="flex justify-between items-center bg-gray-200 p-4">
		<h1 class="text-2xl font-semibold ml-10 mt-4">Detail</h1>
		<button
			class="bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg font-semibold shadow-md mr-10"
			@click="changeCallListBool"
		>
			Pridať do call listu
		</button>
	</div>
	<UTable
		:rows="people"
		:columns="columns_first_row"
		class="mx-10 table-container mt-10 shadow-md z-0 w-5/6"
	>
		<template #name-data="{ row }" @click="test">
			<span
				:class="[
					selected.find((person) => person.id === row.id) &&
						'text-primary-500 dark:text-primary-400 bg-white',
				]"
				class="truncate"
				>{{ row.name }}</span
			>
		</template>

		<template #created_at-data="{ row }">
			<span>{{ formatDate(row.created_at) }}</span>
		</template>

		<template #rok_narodenia-data="{ row }">
			<span>{{ calculateAge(row.rok_narodenia) }}</span>
		</template>

		<template #actions-data="{ row }">
			<UDropdown
				:items="items(row)"
				theme="light"
				class="bg-white border border-gray-300 rounded-md shadow-lg udropdown"
			>
				<UButton
					color="white"
					variant="ghost"
					icon="i-heroicons-ellipsis-horizontal-20-solid"
				/>
			</UDropdown>
		</template>
	</UTable>

	<UTable
		:rows="people"
		:columns="columns_second_row"
		class="mx-10 table-container mt-10 shadow-md z-0 w-5/6"
	>
		<template #name-data="{ row }" @click="test">
			<span
				:class="[
					selected.find((person) => person.id === row.id) &&
						'text-primary-500 dark:text-primary-400 bg-white',
				]"
				>{{ row.name }}</span
			>
		</template>

		<template #created_at-data="{ row }">
			<span>{{ formatDate(row.created_at) }}</span>
		</template>

		<template #rok_narodenia-data="{ row }">
			<span>{{ calculateAge(row.rok_narodenia) }}</span>
		</template>

		<template #actions-data="{ row }">
			<UDropdown
				:items="items(row)"
				theme="light"
				class="bg-white border border-gray-300 rounded-md shadow-lg udropdown"
			>
				<UButton
					color="white"
					variant="ghost"
					icon="i-heroicons-ellipsis-horizontal-20-solid"
				/>
			</UDropdown>
		</template>
	</UTable>

	<div class="ml-10 mt-4 shadow-md flex gap-8 flex-col max-w-[83.5%]">
		<div class="max-w-[450px]">
			<div class="bg-gray-200 text-black text-xl font-semibold p-2">
				Aktuálny poradca
			</div>

			<div class="border border-x-0 border-b-0 break-words p-2 max-w-[85%]">
				{{ people[0]?.current_advisor || "Poradca nebol vyplnený" }}
			</div>
		</div>

		<div class="">
			<div class="bg-gray-200 text-black text-xl font-semibold p-2">
				Poznamka
			</div>
			<div class="border border-x-0 border-b-0 break-words p-2">
				{{ people[0]?.poznamka || "Kontakt nemá žiadnu poznámku" }}
			</div>
		</div>
	</div>

	<div class="relative">
		<div class="mt-[60px] mx-8 shadow-md !text-black">
			<h1 class="text-black text-2xl text-center mb-6">ToDo Zoznam</h1>
			<div class="overflow-x-auto max-w-full">
				<UTable
					:rows="activities_todo"
					:columns="columns_todo"
					class="w-full"
					:ui="{
						wrapper: 'max-w-full overflow-x-auto',
						td: {
							white: 'whitespace-normal',
						},
					}"
				>
					<template #default="{ row }">
						<tr
							@click="handleActivityRowClick(row)"
							class="cursor-pointer hover:bg-gray-200"
						>
							<td
								v-for="col in columns_activity"
								:key="col.key"
								class="px-2 py-1 whitespace-normal"
							>
								{{ row[col.key] }}
							</td>
						</tr>
					</template>

					<template #created_at-data="{ row }">
						<span class="whitespace-nowrap">{{
							formatDateTime(row.created_at)
						}}</span>
					</template>

					<template #actions-data="{ row }">
						<UDropdown :items="todo_items(row)" theme="light">
							<UButton
								color="gray"
								variant="ghost"
								icon="i-heroicons-ellipsis-horizontal-20-solid"
							/>
						</UDropdown>
					</template>
				</UTable>
			</div>

			<!-- Activity table -->
			<h1 class="text-black text-2xl text-center mb-6">Aktivity</h1>
			<div class="overflow-x-auto max-w-full">
				<UTable
					:rows="activities"
					:columns="columns_activity"
					class="w-full"
					:ui="{
						wrapper: 'max-w-full overflow-x-auto',
						td: {
							white: 'whitespace-normal',
						},
					}"
				>
					<template #default="{ row }">
						<tr
							@click="handleActivityRowClick(row)"
							class="cursor-pointer hover:bg-gray-200"
						>
							<td
								v-for="col in columns_activity"
								:key="col.key"
								class="px-2 py-1 whitespace-normal"
							>
								{{ row[col.key] }}
							</td>
						</tr>
					</template>

					<template #created_at-data="{ row }">
						<span class="whitespace-nowrap">{{
							formatDateTime(row.created_at)
						}}</span>
					</template>

					<template #miesto_stretnutia-data="{ row }">
						<a
							v-if="isValidUrl(row.miesto_stretnutia)"
							:href="row.miesto_stretnutia"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 hover:text-blue-800 underline break-all"
						>
							{{ "Link na meeting" }}
						</a>
						<span v-else class="break-all">
							{{ row.miesto_stretnutia }}
						</span>
					</template>

					<template #letters-data="{ row }">
						<div class="flex gap-2">
							<span
								class="cursor-pointer"
								@click.stop="changeActivityStatus(row, 'questionmark')"
							>
								<Icon
									name="pepicons-pencil:question"
									:class="{
										'text-red-600': row.activity_status === 'questionmark',
										'text-black': row.activity_status !== 'questionmark',
									}"
									size="20"
								/>
							</span>
							<span
								class="cursor-pointer"
								@click.stop="changeActivityStatus(row, 'check')"
							>
								<Icon
									name="fa6-solid:check"
									:class="{
										'text-green-600':
											row.activity_status === 'check' ||
											row.activity_status === 'accepted',
										'text-black': row.activity_status !== 'check',
									}"
									size="20"
								/>
							</span>
							<span
								class="cursor-pointer"
								@click.stop="changeActivityStatus(row, 'discarded')"
							>
								<Icon
									name="material-symbols:close"
									:class="{
										'text-red-600': row.activity_status === 'discarded',
										'text-black': row.activity_status !== 'discarded',
									}"
									size="20"
								/>
							</span>

							<!-- Additional options for Pohovor activity -->
							<template v-if="row.aktivita === 'Pohovor'">
								<span
									class="cursor-pointer"
									@click.stop="changeActivityStatus(row, 'accepted')"
								>
									<Icon
										name="fa6-solid:thumbs-up"
										:class="{
											'text-blue-600': row.activity_status === 'accepted',
											'text-black': row.activity_status !== 'accepted',
										}"
										size="20"
									/>
								</span>
								<span
									class="cursor-pointer"
									@click.stop="changeActivityStatus(row, 'rejected')"
								>
									<Icon
										name="fa6-solid:thumbs-down"
										:class="{
											'text-orange-600': row.activity_status === 'rejected',
											'text-black': row.activity_status !== 'rejected',
										}"
										size="20"
									/>
								</span>
							</template>
						</div>
					</template>

					<template #actions-data="{ row }" v-if="author_id == user_id">
						<UDropdown :items="activity_items(row)" theme="light">
							<UButton
								color="gray"
								variant="ghost"
								icon="i-heroicons-ellipsis-horizontal-20-solid"
							/>
						</UDropdown>
					</template>
				</UTable>
			</div>

			<!-- <UTable :rows="activities" :columns="columnsActivitySecondRow">
				<template #default="{ row }">
					<tr
						@click="handleActivityRowClick(row)"
						class="cursor-pointer hover:bg-gray-200"
					>
						<td v-for="col in columns_activity" :key="col.key">
							{{ row[col.key] }}
						</td>
					</tr>
				</template>

				<template #created_at-data="{ row }">
					<span>{{ formatDateTime(row.created_at) }}</span>
				</template>

				<template #actions-data="{ row }" v-if="author_id == user_id">
					<UDropdown :items="activity_items(row)" theme="light">
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-ellipsis-horizontal-20-solid"
						/>
					</UDropdown>
				</template>
			</UTable> -->
			<button
				v-if="author_id == user_id"
				@click="changeAddActivityBool"
				class="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg absolute right-10 top-2 font-semibold shadow-md"
			>
				Pridať udalosť
			</button>

			<button
				v-if="author_id == user_id"
				@click="changeToDoBool"
				class="bg-green-500 hover:bg-green-600 p-2 rounded-lg absolute right-50 top-2 font-semibold shadow-md"
			>
				Pridať ToDo
			</button>
		</div>
	</div>

	<AddActivityForm
		:contact_id="id"
		v-if="AddActivityBool"
		@cancelAddActivity="changeAddActivityBool"
		@activityAdded="addActivityToList"
	/>

	<AlterActivityForm
		v-if="actityFormBool"
		:activityID="activityID"
		@cancelAddActivity="alterActivity"
	/>
</template>

<style scoped>
:root {
	--background-color: #f0f0f0;
	--text-color: #000000;
}

body {
	background-color: var(--background-color);
	color: var(--text-color);
}

.udropdown {
	background-color: white !important;
	border: 1px solid #d1d5db; /* gray-300 */
	border-radius: 0.375rem; /* md rounding */
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* lg shadow */
}

.udropdown {
	background-color: white !important;
	border: 1px solid #d1d5db !important; /* gray-300 */
	border-radius: 0.375rem !important; /* rounded-md */
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important; /* lg shadow */
	color: black !important; /* Ensure text is visible */
}

.overflow-x-auto {
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.max-w-full {
	max-width: 100%;
}

.whitespace-normal {
	white-space: normal;
}

.whitespace-nowrap {
	white-space: nowrap;
}

/* Ensure table cells wrap properly */
:deep(.truncate) {
	white-space: normal;
}

:deep(td) {
	word-break: break-word;
	max-width: 200px; /* Adjust as needed */
}
</style>
