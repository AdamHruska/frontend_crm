<template>
	<DiscardActivityModal
		v-if="showDiscardActivityModal"
		:activityData="currentActivity"
		@closeDiscardActivity="closeDiscardActivityModal"
		@activityUpdated="handleActivityUpdate"
	/>

	<NewNamesModal v-if="showNewNamesModal" @close="changeShowNewNamesModal" />

	<ConfirmEventModal
		v-if="showConfirmEvent"
		@close="changeConfirmEventModal"
		@confirm="handleConfirmEvent"
		@closeConfirm="handleCloseConfirmEvent"
	/>

	<Loadigcomponent v-if="todoStore.loadingState" />

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
		<h1 class="text-2xl font-semibold ml-10 mt-4">Detail (Admin)</h1>
	</div>

	<UTable
		:rows="people"
		:columns="columns_first_row"
		class="mx-10 table-container mt-10 shadow-md z-0 w-5/6"
	>
		<template #created_at-data="{ row }">
			<span>{{ formatDate(row.created_at) }}</span>
		</template>
		<template #rok_narodenia-data="{ row }">
			<span>{{ calculateAge(row.rok_narodenia) }}</span>
		</template>
		<template #actions-data="{ row }">
			<UDropdown :items="items(row)" theme="light" class="bg-white">
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
		<template #created_at-data="{ row }">
			<span>{{ formatDate(row.created_at) }}</span>
		</template>
		<template #rok_narodenia-data="{ row }">
			<span>{{ calculateAge(row.rok_narodenia) }}</span>
		</template>
		<template #actions-data="{ row }">
			<UDropdown :items="items(row)" theme="light">
				<UButton
					color="white"
					variant="ghost"
					icon="i-heroicons-ellipsis-horizontal-20-solid"
				/>
			</UDropdown>
		</template>
	</UTable>

	<div class="ml-10 mt-4 shadow-md flex gap-8 flex-col max-w-[83.5%]">
		<div class="max-w-[450px]" v-if="people[0]?.current_advisor">
			<div class="bg-gray-200 text-black text-xl font-semibold p-2">
				Aktuálny poradca
			</div>
			<div class="border border-x-0 border-b-0 break-words p-2 max-w-[85%]">
				{{ people[0]?.current_advisor }}
			</div>
		</div>
		<div v-if="people[0]?.poznamka">
			<div class="bg-gray-200 text-black text-xl font-semibold p-2">
				Poznamka
			</div>
			<div class="border border-x-0 border-b-0 break-words p-2">
				{{ people[0]?.poznamka }}
			</div>
		</div>
	</div>

	<div class="relative">
		<div class="mt-[60px] mx-8 shadow-md !text-black">
			<h1 class="text-black text-2xl text-center mb-6">ToDo Zoznam</h1>
			<div class="overflow-x-auto max-w-full">
				<UTable :rows="activities_todo" :columns="columns_todo" class="w-full">
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

			<h1 class="text-black text-2xl text-center mb-6">Aktivity</h1>
			<div class="overflow-x-auto max-w-full">
				<UTable :rows="activities" :columns="columns_activity" class="w-full">
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
							>Link na meeting</a
						><a v-else class="break-all">{{ row.miesto_stretnutia }}</a>
					</template>

					<template #poznamka-data="{ row }">
						<div
							class="max-w-full truncate cursor-pointer"
							:title="row.poznamka"
						>
							{{ row.poznamka }}
						</div>
					</template>

					<template #volane-data="{ row }">
						<span
							v-if="row.volane !== null"
							:class="row.volane ? 'text-green-600' : 'text-red-500'"
						>
							{{ row.volane ? "✔" : "✖" }}
						</span>
					</template>

					<template #dovolane-data="{ row }">
						<span
							v-if="row.dovolane !== null"
							:class="row.dovolane ? 'text-green-600' : 'text-red-500'"
						>
							{{ row.dovolane ? "✔" : "✖" }}
						</span>
					</template>

					<template #dohodnute-data="{ row }">
						<span
							v-if="row.dohodnute !== null"
							:class="row.dohodnute ? 'text-green-600' : 'text-red-500'"
						>
							{{ row.dohodnute ? "✔" : "✖" }}
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
									:class="
										row.activity_status === 'questionmark'
											? 'text-red-600'
											: 'text-black'
									"
									size="20"
								/>
							</span>
							<span
								class="cursor-pointer"
								@click.stop="changeActivityStatus(row, 'check')"
							>
								<Icon
									name="fa6-solid:check"
									:class="
										row.activity_status === 'check' ||
										row.activity_status === 'accepted'
											? 'text-green-600'
											: 'text-black'
									"
									size="20"
								/>
							</span>
							<span
								class="cursor-pointer"
								@click.stop="changeActivityStatus(row, 'discarded')"
							>
								<Icon
									name="material-symbols:close"
									:class="
										row.activity_status === 'discarded'
											? 'text-red-600'
											: 'text-black'
									"
									size="20"
								/>
							</span>
							<template v-if="row.aktivita === 'Pohovor'">
								<span
									class="cursor-pointer"
									@click.stop="changeActivityStatus(row, 'accepted')"
								>
									<Icon
										name="fa6-solid:thumbs-up"
										:class="
											row.activity_status === 'accepted'
												? 'text-blue-600'
												: 'text-black'
										"
										size="20"
									/>
								</span>
								<span
									class="cursor-pointer"
									@click.stop="changeActivityStatus(row, 'rejected')"
								>
									<Icon
										name="fa6-solid:thumbs-down"
										:class="
											row.activity_status === 'rejected'
												? 'text-orange-600'
												: 'text-black'
										"
										size="20"
									/>
								</span>
							</template>
						</div>
					</template>

					<template #actions-data="{ row }">
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

			<button
				@click="changeAddActivityBool"
				class="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg absolute right-10 top-2 font-semibold shadow-md"
			>
				Pridať udalosť
			</button>
			<button
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

<script setup>
const config = useRuntimeConfig();
import { useContactsStore } from "#imports";
const contactsStore = useContactsStore();
import { useUserStore } from "#imports";
const userStore = useUserStore();
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
	{ deep: true, immediate: true },
);

onBeforeMount(async () => {
	await findPerson(id);
	await findActivities(id);
	//tieto dve prerobit na admin
	try {
		const response = await axios.get(`${config.public.apiUrl}todos/admin`, {
			params: {
				contact_id: id,
			},
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		todoStore.todos = response.data.data;
	} catch (error) {
		console.error("Error fetching todos by contact:", error.response || error);

		toast.error("Nepodarilo sa načítať úlohy pre vybraný kontakt");
	}
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
	const user = await getUser();
	user_id.value = user.id;
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(
			`${config.public.apiUrl}contact/${id}/admin`,
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
			},
		);
		if (response.data?.contact) {
			people.value = [response.data.contact];
		}
		author_id.value = response.data.contact.author_id;
	} catch (error) {
		console.error("Error fetching contact:", error);
	}
};

const findActivities = async (id) => {
	const response = await axios.get(
		`${config.public.apiUrl}contacts/${id}/activities/admin`,
		{ headers: { Authorization: `Bearer ${authStore.token}` } },
	);
	activities.value = response.data.activities;
};

const getUser = async () => {
	const response = await axios.get(`${config.public.apiUrl}get-user`, {
		headers: { Authorization: `Bearer ${authStore.token}` },
	});
	return response.data.user;
};

const actityFormBool = ref(false);
const activityID = ref(null);

const alterActivity = (id) => {
	activityID.value = id;
	actityFormBool.value = !actityFormBool.value;
};

const addActivityToList = (activity) => {
	activities.value.push(activity);
};

const columns_first_row = [
	{ key: "meno", label: "Meno", class: "bg-gray-200" },
	{ key: "priezvisko", label: "Priezvisko", class: "bg-gray-200" },
	{ key: "cislo", label: "tel. číslo", class: "bg-gray-200" },
	{ key: "email", label: "Email", class: "bg-gray-200" },
	{ key: "odporucitel", label: "Odporucitel", class: "bg-gray-200" },
];

const columns_second_row = [
	{ key: "created_at", label: "Dátum pridania", class: "bg-gray-200" },
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
			click: () => contactsStore.deleteContact(row.id).then(navigateTo("/")),
		},
	],
];

const columns_activity = ref([
	{ key: "aktivita", label: "Aktivita", class: "bg-gray-200" },
	{ key: "datumCas", label: "Začiatok", class: "bg-gray-200" },
	{ key: "koniec", label: "Koniec", class: "bg-gray-200" },
	{ key: "poznamka", label: "Poznámka k aktivite", class: "bg-gray-200" },
	{ key: "volane", label: "Volané", class: "bg-gray-200" },
	{ key: "dovolane", label: "Dovolané", class: "bg-gray-200" },
	{ key: "dohodnute", label: "Dohodnuté", class: "bg-gray-200" },
	{ key: "letters", label: "Vyhodnotenie stretnutia", class: "bg-gray-200" },
	{ key: "created_at", label: "Vytvorené", class: "bg-gray-200" },
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
						headers: { Authorization: `Bearer ${authStore.token}` },
					})
					.then(() => {
						activities.value = activities.value.filter((a) => a.id !== row.id);
					}),
		},
	],
];

const columns_todo = [
	{ key: "dueDate", label: "Termín dokončenia" },
	{ key: "activity", label: "Aktivita" },
	{ key: "completed", label: "Dokončené" },
	{ key: "updated_at", label: "Dokončené" },
	{ key: "actions", class: "bg-gray-200" },
];

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
	todoToUpdate.value = row;
};

const showAlterPesonForm = ref(false);
const showAlterPersonForm = () => {
	showAlterPesonForm.value = !showAlterPesonForm.value;
};

const updatePerson = async (updatedContact) => {
	people.value = [{ ...people.value[0], ...updatedContact }];
	showAlterPesonForm.value = false;
	try {
		await contactsStore.updatePerson({ ...people.value[0] });
	} catch (e) {
		console.warn("Failed to update in store:", e);
	}
};

const pendingFirstMeetingRow = ref(null);
const currentActivity = ref(null);
const showConfirmEvent = ref(false);
const changeConfirmEventModal = () => {
	showConfirmEvent.value = !showConfirmEvent.value;
};
const showDiscardActivityModal = ref(false);
const changeDiscardActivityModal = () => {
	showDiscardActivityModal.value = !showDiscardActivityModal.value;
};
const showNewNamesModal = ref(false);
const changeShowNewNamesModal = () => {
	showNewNamesModal.value = !showNewNamesModal.value;
};

const changeActivityStatus = async (row, status) => {
	try {
		if (row.aktivita === "Prvé stretnutie" && status === "check") {
			changeConfirmEventModal();
			pendingFirstMeetingRow.value = row;
			return;
		}
		if (status === "discarded") {
			currentActivity.value = row;
			changeDiscardActivityModal();
		}
		if (
			(row.aktivita === "Analýza osobných financí" && status === "check") ||
			(row.aktivita === "Servisná analýza" && status === "check")
		) {
			changeShowNewNamesModal();
		}
		const originalStatus = row.activity_status;
		row.activity_status = status;
		await axios.patch(
			`${config.public.apiUrl}activities/${row.id}/status`,
			{ activity_status: status },
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
	} catch (error) {
		row.activity_status = originalStatus;
		console.error("Error updating activity status:", error);
	}
};

const handleConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			pendingFirstMeetingRow.value.activity_status = "check";
			await addFinancialAnalysisActivity(
				pendingFirstMeetingRow.value.contact_id,
				pendingFirstMeetingRow.value.koniec,
			);
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{ activity_status: "check" },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			await findActivities(id);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
	} finally {
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

const handleCloseConfirmEvent = async () => {
	try {
		if (pendingFirstMeetingRow.value) {
			pendingFirstMeetingRow.value.activity_status = "check";
			await axios.patch(
				`${config.public.apiUrl}activities/${pendingFirstMeetingRow.value.id}/status`,
				{ activity_status: "check" },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			await findActivities(id);
		}
	} catch (error) {
		console.error("Error handling confirmation:", error);
	} finally {
		changeConfirmEventModal();
		pendingFirstMeetingRow.value = null;
	}
};

async function addFinancialAnalysisActivity(contactId, dateTimeStart) {
	const startTime = new Date(dateTimeStart);
	const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
	const dateTimeEnd = endTime.toISOString().replace("T", " ").substring(0, 19);
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
		{ headers: { Authorization: `Bearer ${authStore.token}` } },
	);
	activities.value.push(response.data.activity);
	return response.data;
}

const handleActivityUpdate = (updatedActivity) => {
	const index = activities.value.findIndex((a) => a.id === updatedActivity.id);
	if (index !== -1) {
		activities.value[index] = {
			...activities.value[index],
			...updatedActivity,
		};
	}
	showDiscardActivityModal.value = false;
};

const closeDiscardActivityModal = () => {
	showDiscardActivityModal.value = false;
};

const formatDate = (d) => format(new Date(d), "dd-MM-yyyy");
const formatDateTime = (d) => format(new Date(d), "dd-MM-yyyy HH:mm");

function calculateAge(yearOfBirth) {
	const age = new Date().getFullYear() - yearOfBirth;
	return age === 0 || age === 2026 ? "N/A" : age;
}

function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch {
		return false;
	}
}
</script>
