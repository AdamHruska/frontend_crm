<template>
	<!--Month select-->
	<AlterActivityForm
		v-if="showActivityForm"
		:activityID="selectedActivityID"
		@cancelAddActivity="changeshowActivityForm(null)"
	/>
	<div class="px-8 pt-6 pb-4">
		<select
			@change="fetchData"
			v-model="selectedMonth"
			name=""
			id=""
			class="w-full md:w-64 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer hover:border-gray-400 transition-colors"
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
			class="p-6 bg-white rounded-lg shadow-lg max-w-[450px]"
			v-if="!loading && dbActivities.length > 0"
		>
			<div class="font-semibold mb-4 text-lg">{{ event.aktivita }}</div>
			<div class="flex flex-col gap-2 mb-3">
				<div>
					<span class=""
						><span class="font-semibold">Začiatok:</span>&nbsp;
						{{ formatDate(event.datumCas) }}</span
					>
				</div>

				<div>
					<span class=""
						><span class="font-semibold">Koniec:</span>&nbsp;
						{{ formatDate(event.koniec) }}</span
					>
				</div>
			</div>
			<div
				class="max-h-[200px] overflow-y-auto border-y-2 py-4 hover:bg-slate-100 cursor-pointer"
				@click="goToContact(event.contact_id)"
			>
				<span class="font-semibold">Meno klienta: </span> {{ event.meno }}
				{{ event.priezvisko }}
			</div>

			<div>
				<span class="font-semibold">Poznámka: </span
				>{{ event.poznamka || "Poznámka nie je vyplnená" }}
			</div>

			<div
				class="bg-blue-500 px-2 py-1 w-fit rounded-md mt-4 hover:bg-blue-300 hover:scale-105 cursor-pointer float-right"
				@click="changeshowActivityForm(event.id)"
			>
				Obnoviť aktivitu
			</div>
		</div>

		<div>
			<p v-if="!loading && dbActivities.length === 0" class="text-gray-500">
				Žiadne aktivity v databáze za vybraný mesiac.
			</p>
		</div>
	</div>
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

const router = useRouter();

const declinedEvents = ref([]);
const loading = ref(false);
const selectedMonth = ref(new Date().getMonth() + 1);

const dbActivities = ref([]);

const showActivityForm = ref(false);

const selectedActivityID = ref(null);

function goToContact(contactId) {
	router.push("/contact/" + contactId);
}

const formatMonthForAPI = (month) => {
	const year = new Date().getFullYear();
	const formattedMonth = String(month).padStart(2, "0"); // 👈 ensures 01–12
	return `${year}-${formattedMonth}`;
};

const changeshowActivityForm = (activityID) => {
	console.log("Activity ID to edit:", activityID);
	selectedActivityID.value = activityID;
	showActivityForm.value = !showActivityForm.value;
};

onMounted(async () => {
	await userStore.fetchUser();
	try {
		loading.value = true;

		const responseMyActivities = await axios.get(
			`${config.public.apiUrl}get-uncompleted-activities`,
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
				params: { month: formatMonthForAPI(selectedMonth.value) },
			}
		);
		console.log(
			"My Activities Response on Mounted:",
			responseMyActivities.data.activities
		);
		dbActivities.value = responseMyActivities.data.activities;

		const response = await axios.post(
			`${config.public.apiUrl}microsoft/declined-events/${userStore.user.id}`,
			{
				user_id: userStore.user.id,
				month: formatMonthForAPI(selectedMonth.value),
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } }
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
	console.log("Selected Month:", selectedMonth.value);
	try {
		loading.value = true;

		const responseMyActivities = await axios.get(
			`${config.public.apiUrl}get-uncompleted-activities`,
			{
				headers: { Authorization: `Bearer ${authStore.token}` },
				params: { month: selectedMonth.value },
			}
		);
		console.log(
			"My Activities Response on Mounted:",
			responseMyActivities.data.activities
		);
		dbActivities.value = responseMyActivities.data.activities;

		const response = await axios.post(
			`${config.public.apiUrl}microsoft/declined-events/${userStore.user.id}`,
			{
				user_id: userStore.user.id,
				month: formatMonthForAPI(selectedMonth.value),
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } }
		);
		declinedEvents.value = response.data.value;
		console.log("Declined Events Response:", declinedEvents.value);
	} catch (error) {
		console.error("Error fetching declined events:", error);
	} finally {
		loading.value = false;
	}
};
</script>
