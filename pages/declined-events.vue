<template>
	<!--Month select-->
	<AlterActivityForm
		v-if="showActivityForm"
		:activityID="selectedActivityID"
		@cancelAddActivity="changeshowActivityForm(null)"
	/>

	<CallListAdd
		v-if="showCallListForm"
		:callListNames="callListNames"
		:selected="selectedCallListContacts"
		:user_id="userStore.user.id"
		@cancleCallListForm="showCallListForm = false"
		@uncheckAll="selectedActivities.clear()"
		@refreshCallLists="fetchCallLists"
	/>

	<div class="px-8 pt-6 pb-4 flex gap-2 items-center">
		<select
			@change="fetchData"
			v-model="selectedMonth"
			name=""
			id=""
			class="w-32 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer hover:border-gray-400 transition-colors"
		>
			<option value="1">Januar</option>
			<option value="2">Februar</option>
			<option value="3">Marec</option>
			<option value="4">Apríl</option>
			<option value="5">Máj</option>
			<option value="6">Jún</option>
			<option value="7">Júl</option>
			<option value="8">August</option>
			<option value="9">September</option>
			<option value="10">Október</option>
			<option value="11">November</option>
			<option value="12">December</option>
		</select>
		<select
			v-model="selectedYear"
			@change="fetchData"
			class="w-28 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer hover:border-gray-400 transition-colors"
		>
			<option v-for="year in years" :key="year" :value="year">
				{{ year }}
			</option>
		</select>

		<div class="font-semibold">Selekty:</div>
		<select
			@change="fetchSelect"
			v-model="selectedSelect"
			name=""
			id=""
			class="w-full md:w-64 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer hover:border-gray-400 transition-colors"
		>
			<option value="1">Kontakty so zlým telefónnym číslom</option>
		</select>
	</div>

	<div
		v-if="invalidPhoneContacts.length > 0"
		class="px-8 pb-10 overflow-x-auto"
	>
		<div class="bg-white shadow-lg rounded-xl overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-sm font-semibold text-gray-600">
							Meno
						</th>
						<th class="px-6 py-3 text-left text-sm font-semibold text-gray-600">
							Pôvodné číslo
						</th>
						<th class="px-6 py-3 text-left text-sm font-semibold text-gray-600">
							Opravené číslo
						</th>
						<th class="px-6 py-3"></th>
					</tr>
				</thead>

				<tbody class="divide-y divide-gray-100">
					<tr
						v-for="contact in invalidPhoneContacts"
						:key="contact.id"
						class="hover:bg-gray-50 transition"
					>
						<td class="px-6 py-3 font-medium">
							{{ contact.meno }} {{ contact.priezvisko }}
						</td>

						<td class="px-6 py-3 text-red-500 font-semibold">
							{{ contact.cislo }}
						</td>

						<td class="px-6 py-3">
							<input
								v-model="contact.corrected_phone"
								type="text"
								placeholder="Nové číslo"
								class="px-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-slate-100"
							/>
						</td>

						<td class="px-6 py-3">
							<button
								@click="saveCorrectedPhone(contact)"
								class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
							>
								Uložiť
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<div
		class="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6 md:gap-y-12 max-w-screen px-8 pb-12 pt-6"
	>
		<!--Card-->

		<loadigcomponent v-if="loading" />
		<div
			v-for="event in declinedEvents"
			class="p-6 bg-white rounded-lg shadow-lg max-w-[450px]"
			v-if="!loading && declinedEvents.length > 0"
		>
			<div class="font-semibold mb-3">{{ event.subject }}</div>
			<div class="flex flex-col gap-2 mb-3">
				<div>
					<span class="font-semibold">Začiatok:&nbsp;</span>
					{{ formatDate(event.start.dateTime) }}
				</div>

				<div>
					<span class="font-semibold">Koniec:&nbsp;</span>
					{{ formatDate(event.end.dateTime) }}
				</div>
			</div>
			<div class="max-h-[200px] overflow-y-auto border-y-2 py-4">
				<div
					class="flex items-center justify-between py-1 hover:bg-gray-100 rounded-md"
					v-for="attendee in event.attendees"
					:key="attendee.email"
				>
					<div>
						{{ attendee.emailAddress.name }}:
						<a
							:href="`mailto:${attendee.emailAddress.address}`"
							class="text-blue-500 underline"
							>{{ attendee.emailAddress.address }}</a
						>
					</div>
					<UTooltip
						text="Pozvánka bola akceptovaná"
						:ui="{ background: '!bg-white', color: '' }"
						class=""
						v-if="attendee.status.response == 'accepted'"
					>
						<span class="p-1 w-auto bg-green-500 rounded-md"
							><Icon
								icon="ic:baseline-done"
								class="transition-transform duration-300"
						/></span>
					</UTooltip>

					<UTooltip
						text="Pozvánka bola odmietnutá"
						:ui="{ background: '!bg-white', color: '' }"
						class=""
						v-if="attendee.status.response == 'declined'"
					>
						<span class="p-1 w-auto bg-red-500 rounded-md"
							><Icon
								icon="ic:round-close"
								class="transition-transform duration-300"
						/></span>
					</UTooltip>

					<UTooltip
						text="Pozvánka čaká na odpoveď"
						:ui="{ background: '!bg-white', color: '' }"
						class=""
						v-if="
							attendee.status.response == 'none' ||
							attendee.status.response == 'notResponded'
						"
					>
						<span class="p-1 w-auto bg-gray-400 rounded-md"
							><Icon
								icon="ic:baseline-question-mark"
								class="transition-transform duration-300"
						/></span>
					</UTooltip>
				</div>
			</div>
			<div
				class="bg-blue-500 px-2 py-1 w-fit rounded-md mt-4 hover:bg-blue-300 hover:scale-105 cursor-pointer float-right"
				@click="changeshowActivityForm(event.id)"
			>
				Obnoviť aktivitu
			</div>
		</div>

		<div>
			<p v-if="!loading && declinedEvents.length === 0" class="text-gray-500">
				Žiadne odmietnuté udalosti za vybraný mesiac.
			</p>
		</div>
	</div>

	<h1 class="font-semibold ml-10">Aktivity z databázy</h1>
	<div
		class="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6 md:gap-y-12 max-w-screen px-8 pb-12 pt-6"
	>
		<!--Card-->

		<div
			v-for="event in dbActivities"
			:key="event.id"
			class="relative p-6 bg-white rounded-lg shadow-lg max-w-[450px]"
			v-if="!loading && dbActivities.length > 0"
		>
			<!-- Checkbox top-right -->
			<input
				type="checkbox"
				class="absolute top-4 right-4 w-5 h-5 cursor-pointer"
				:value="event.id"
				v-model="selectedActivitiesArray"
			/>

			<div class="font-semibold mb-4 text-lg">{{ event.aktivita }}</div>
			<div class="flex flex-col gap-2 mb-3">
				<div>
					<span class="font-semibold">Začiatok:</span>
					{{ formatDate(event.datumCas) }}
				</div>
				<div>
					<span class="font-semibold">Koniec:</span>
					{{ formatDate(event.koniec) }}
				</div>
			</div>

			<div
				class="max-h-[200px] overflow-y-auto border-y-2 py-4 hover:bg-slate-100 cursor-pointer"
				@click="goToContact(event.contact_id)"
			>
				<span class="font-semibold">Meno klienta:</span>
				{{ event.meno }} {{ event.priezvisko }}
			</div>

			<div>
				<span class="font-semibold">Poznámka:</span>
				{{ event.poznamka || "Poznámka nie je vyplnená" }}
			</div>

			<div
				class="bg-blue-500 px-2 py-1 w-fit rounded-md mt-4 hover:bg-blue-300 hover:scale-105 cursor-pointer float-right"
				@click="changeshowActivityForm(event.id)"
			>
				Obnoviť aktivitu
			</div>
		</div>

		<div v-if="!loading && dbActivities.length === 0" class="text-gray-500">
			Žiadne aktivity v databáze za vybraný mesiac.
		</div>
	</div>

	<div>
		<p v-if="!loading && dbActivities.length === 0" class="text-gray-500">
			Žiadne aktivity v databáze za vybraný mesiac.
		</p>
	</div>

	<div
		v-if="selectedContacts.length > 0"
		class="fixed bottom-6 right-6 max-w-xs w-full bg-white shadow-xl rounded-xl p-4 border border-gray-200 overflow-y-auto max-h-96"
	>
		<div class="flex gap-2 items-center justify-center mb-6">
			<h2 class="font-bold text-lg">Vybrané kontakty</h2>
			<button
				@click="showCallListForm = !showCallListForm"
				class="px-2 py-1 bg-green-500 hover:bg-green-400 rounded"
			>
				Vytvoriť call list
			</button>
		</div>
		<ul class="divide-y divide-gray-200">
			<li
				v-for="contact in selectedContacts"
				:key="contact.contact_id"
				class="py-2 flex justify-between items-center hover:bg-gray-50 px-2 rounded-md"
			>
				<span>{{ contact.meno }} {{ contact.priezvisko }}</span>
				<a
					:href="`mailto:${contact.email || ''}`"
					class="text-blue-500 underline text-sm"
					>{{ contact.email || "Bez emailu" }}</a
				>
			</li>
		</ul>
	</div>

	<!-- <CallListAdd
		v-if="showCallListForm"
		:callListNames="callListNames"
		:selected="selected"
		:user_id="user_id"
		@cancleCallListForm="cancleCallListForm"
		@uncheckAll="uncheckAll"
		@refreshCallLists="fetchCallLists"
	/> -->
</template>

<script setup>
import axios from "axios";
const config = useRuntimeConfig();
import { useAuthStore } from "#imports";
const authStore = useAuthStore();
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
const toast = useToast();
import { useDeleteActivities } from "#imports";
const deleteActivitiesStore = useDeleteActivities();

const router = useRouter();

const showCallListForm = ref(false);

const declinedEvents = ref([]);
const loading = ref(false);

const selectedMonth = ref(
	deleteActivitiesStore.selectedMonth ?? new Date().getMonth() + 1,
);
const selectedYear = ref(
	deleteActivitiesStore.selectedYear ?? new Date().getFullYear(),
);

const dbActivities = ref([]);
const selectedActivities = ref(new Set());

const callListNames = ref([]);

const years = ref([
	new Date().getFullYear(),
	new Date().getFullYear() - 1,
	new Date().getFullYear() - 2,
	new Date().getFullYear() - 3,
	new Date().getFullYear() - 4,
	new Date().getFullYear() - 5,
	new Date().getFullYear() - 6,
]);

// Convert Set to array for v-model binding
const selectedActivitiesArray = computed({
	get: () => Array.from(selectedActivities.value),
	set: (val) => {
		selectedActivities.value = new Set(val);
	},
});

const selectedContacts = computed(() => {
	return dbActivities.value.filter((a) => selectedActivities.value.has(a.id));
});

const selectedCallListContacts = computed(() => {
	return dbActivities.value
		.filter((a) => selectedActivities.value.has(a.id))
		.map((c) => ({
			id: c.contact_id, // 👈 THIS IS THE KEY FIX
			contact_id: c.contact_id,
			meno: c.meno,
			priezvisko: c.priezvisko,
			email: c.email,
		}));
});
watch(selectedCallListContacts, (val) => {
	console.log("PASSED TO CALLLIST:", val);
});
const selectedSelect = ref("Kontakty so zlým telefónnym číslom");

const invalidPhoneContacts = ref([]);

const showActivityForm = ref(false);

const selectedActivityID = ref(null);

function goToContact(contactId) {
	router.push("/contact/" + contactId);
}

const formatMonthForAPI = (month, year) => {
	const formattedMonth = String(month).padStart(2, "0"); // 01–12
	return `${year}-${formattedMonth}`;
};

const changeshowActivityForm = (activityID) => {
	console.log("Activity ID to edit:", activityID);
	selectedActivityID.value = activityID;
	showActivityForm.value = !showActivityForm.value;
};

watch(selectedMonth, (newSelectedMonth) => {
	deleteActivitiesStore.selectedMonth = newSelectedMonth;
});

watch(selectedYear, (newSelectedYear) => {
	deleteActivitiesStore.selectedYear = newSelectedYear;
});

const fetchCallLists = async () => {
	try {
		const response = await axios.get(`${config.public.apiUrl}call-lists`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});
		callListNames.value = response.data;
	} catch (error) {
		console.error("Error fetching call lists:", error);
	}
};

onMounted(async () => {
	await userStore.fetchUser();
	callListNames.value = await axios.get(`${config.public.apiUrl}call-lists`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});

	callListNames.value = callListNames.value.data;

	const responseInvalidPhoneNumber = await axios.get(
		`${config.public.apiUrl}contacts-invalid-phone`,

		{ headers: { Authorization: `Bearer ${authStore.token}` } },
	);

	console.log("responseInvalidPhoneNumber", responseInvalidPhoneNumber);

	try {
		loading.value = true;
		deleteActivitiesStore.selectedMonth = selectedMonth.value;
		deleteActivitiesStore.selectedYear = selectedYear.value;

		if (deleteActivitiesStore.selectedMonth != null) {
			selectedMonth.value = deleteActivitiesStore.selectedMonth;
		}

		if (deleteActivitiesStore.selectedYear != null) {
			selectedYear.value = deleteActivitiesStore.selectedYear;
		}

		const responseMyActivities = await axios.get(
			`${config.public.apiUrl}get-uncompleted-activities`,
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
				params: {
					month: selectedMonth.value,
					year: selectedYear.value,
				},
			},
		);

		dbActivities.value = responseMyActivities.data.activities;

		const response = await axios.post(
			`${config.public.apiUrl}microsoft/declined-events/${userStore.user.id}`,
			{
				user_id: userStore.user.id,
				month: formatMonthForAPI(selectedMonth.value),
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		declinedEvents.value = response.data.value;
		console.log("Declined Events Response:", declinedEvents.value);
	} catch (error) {
		console.error("Error fetching declined events:", error);
	} finally {
		loading.value = false;
	}
});

const formatDate = (dateString) => {
	const date = new Date(dateString);
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const fetchData = async () => {
	console.log(
		"Selected Month & Year:",
		selectedMonth.value,
		selectedYear.value,
	);
	try {
		loading.value = true;

		const responseMyActivities = await axios.get(
			`${config.public.apiUrl}get-uncompleted-activities`,
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
				params: {
					month: selectedMonth.value,
					year: selectedYear.value,
				},
			},
		);
		dbActivities.value = responseMyActivities.data.activities;

		const response = await axios.post(
			`${config.public.apiUrl}microsoft/declined-events/${userStore.user.id}`,
			{
				user_id: userStore.user.id,
				month: selectedMonth.value,
				year: selectedYear.value,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
		declinedEvents.value = response.data.value;
	} catch (error) {
		console.error("Error fetching declined events:", error);
	} finally {
		loading.value = false;
	}
};

const fetchSelect = async () => {
	console.log("Selected query:", selectedSelect.value);
	try {
		loading.value = true;

		const responseInvalidPhoneNum = await axios.get(
			`${config.public.apiUrl}contacts-invalid-phone`,
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
			},
		);

		invalidPhoneContacts.value = responseInvalidPhoneNum.data.contacts.map(
			(c) => ({
				...c,
				corrected_phone: "",
			}),
		);

		toast.success("kontakty boli získané uspešne", {
			position: "top-right",
			timeout: 5000,
		});
	} catch (error) {
		toast.error("Error pri zobrazovaní kontaktov", {
			position: "top-right",
			timeout: 5000,
		});
		console.error(error);
	} finally {
		loading.value = false;
	}
};

const saveCorrectedPhone = async (contact) => {
	if (!contact.corrected_phone) {
		toast.error("Zadaj nové telefónne číslo");
		return;
	}

	try {
		await axios.post(
			`${config.public.apiUrl}update-contact-phone`,
			{
				contact_id: contact.id,
				phone: contact.corrected_phone,
			},
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
			},
		);

		toast.success("Telefónne číslo bolo uložené");

		invalidPhoneContacts.value = invalidPhoneContacts.value.filter(
			(c) => c.id !== contact.id,
		);
	} catch (err) {
		console.error(err);
		toast.error("Nepodarilo sa uložiť číslo");
	}
	console.log("funguje", contact);
};
</script>

<style scoped>
/* Optional: smooth scrollbar for floating panel */
::-webkit-scrollbar {
	width: 6px;
}
::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.2);
	border-radius: 10px;
}
</style>
