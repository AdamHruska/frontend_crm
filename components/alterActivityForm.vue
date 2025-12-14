<script setup>
const config = useRuntimeConfig();
const router = useRouter();
import { Icon } from "@iconify/vue";
import axios from "axios";
const props = defineProps({
	activityID: String,
	user: Object,
});

import { useUserStore } from "#imports";
const userStore = useUserStore();

import { useCalendarstore } from "#imports";
const calendarStore = useCalendarstore();

import { useAuthStore } from "@/stores/authStore";
import AlterPersonForm from "./alterPersonForm.vue";
const authStore = useAuthStore();
authStore.loadToken();

import { useOfficeStore } from "#imports";
const officeStore = useOfficeStore();

import { useToast } from "vue-toastification";
const toast = useToast();

const contact = ref([]);

const kontakt = ref("");
const aktivita = ref("");
const ina_aktivita = ref("");
const importance = ref("normal");
const datum_cas = ref("");
const koniec = ref("");
const poznamka = ref("");
const volane = ref("");
const dovolane = ref("");
const dohodnute = ref(0);
const ineBool = ref(false);
const miesto_stretnutia = ref("");
const onlineMeeting = ref(false);
const activity_creator = ref("");

const officeAvailability = ref({});

const allOffices = computed(() => [
	...officeStore.offices,
	...officeStore.officesSharedWithMe,
]);

const checkOfficeAvailability = (officeId, newDatum, newKoniec) => {
	if (!newDatum || !newKoniec)
		return { isFree: true, overlappingActivity: null };

	const newStart = new Date(newDatum);
	const newEnd = new Date(newKoniec);

	const overlappingActivity = officeStore.allOfficeActivities.find(
		(activity) => {
			// Only check activities for this specific office
			if (activity.office_id !== officeId) return false;

			const activityStart = new Date(activity.datum_cas);
			const activityEnd = new Date(activity.koniec);

			// Check if time ranges overlap
			return newStart < activityEnd && activityStart < newEnd;
		}
	);

	if (overlappingActivity) {
		return {
			isFree: false,
			overlappingActivity: overlappingActivity,
		};
	} else {
		return {
			isFree: true,
			overlappingActivity: null,
		};
	}
};

watch(
	() => [datum_cas.value, koniec.value, officeStore.allOfficeActivities],
	([newDatum, newKoniec]) => {
		if (!newDatum || !newKoniec) {
			officeAvailability.value = {};
			return;
		}

		console.log("New datum_cas:", newDatum);
		console.log("New koniec:", newKoniec);

		// Check availability for all offices
		const availability = {};
		allOffices.value.forEach((office) => {
			availability[office.id] = checkOfficeAvailability(
				office.id,
				newDatum,
				newKoniec
			);
		});

		officeAvailability.value = availability;
		console.log("Office availability:", availability);
	},
	{ deep: true }
);

const emailBool = ref(false);
const email = ref("");

const showAlterButtons = ref(false);
const originalOnlineMeetingValue = ref(false);

const officeActivity = ref(null);

const showVDD = ref(false);

watch(aktivita, (newValue) => {
	if (newValue === "ine") {
		ineBool.value = true;
	} else {
		ineBool.value = false;
	}

	if (newValue === "Telefonát klient" || newValue === "Telefonát nábor") {
		showVDD.value = true;
	} else {
		showVDD.value = false;
	}
});

const officeActivityId = ref(null);

const active = ref([]);

onMounted(async () => {
	officeStore.fetchOffices();
	officeStore.fetchOfficesSharedWithMe();
	userStore.fetchUser();

	officeStore.getallOfficeActivites();

	console.log("Mounted AlterActivityForm with activityID:", props.activityID);
	const response = await axios.get(
		`${config.public.apiUrl}activities/${props.activityID}`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	console.log("Response:", response.data.activity.send_notification);

	if (response.data.activity.send_notification_15) {
		active.value.push(15);
	}
	if (response.data.activity.send_notification_30) {
		active.value.push(30);
	}
	if (response.data.activity.send_notification_60) {
		active.value.push(60);
	}
	console.log("Active notifications:", active.value);
	activity_creator.value = response.data.activity.created_id;
	aktivita.value = response.data.activity.aktivita;
	ina_aktivita.value = response.data.activity.aktivita;
	datum_cas.value = response.data.activity.datumCas;
	koniec.value = response.data.activity.koniec;
	poznamka.value = response.data.activity.poznamka;
	volane.value = response.data.activity.volane;
	dovolane.value = response.data.activity.dovolane;
	if (response.data.activity.dohodnute === 1) {
		dohodnute.value = true;
	} else {
		dohodnute.value = false;
	}

	ineBool.value = response.data.activity.ineBool;
	miesto_stretnutia.value = response.data.activity.miesto_stretnutia;
	onlineMeeting.value = response.data.activity.onlineMeeting;
	originalOnlineMeetingValue.value = response.data.activity.onlineMeeting;

	const responseContact = await axios.get(
		`${config.public.apiUrl}contact/${response.data.activity.contact_id}`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	contact.value = responseContact.data.contact;

	if (contact.value.email === null) {
		emailBool.value = false;
	} else {
		email.value = contact.value.email;
		emailBool.value = true;
	}

	const result = await officeStore.findActivityId({
		datum_cas: datum_cas.value,
		koniec: koniec.value,
		owner_id: userStore.user.id,
	});

	if (!result || !result.activity) {
		// No activity found
		officeActivityId.value = null;
		officeActivity.value = null;
		return;
	}

	// Activity found
	officeActivityId.value = result;
	officeActivity.value = result.activity;
	//miesto_stretnutia.value = officeActivityId.office.value;
	console.log("Office activity ID:", officeActivityId.value.office.name);
	console.log("Office activity:", officeActivity.value);
	if (officeActivityId.value.office.name) {
		miesto_stretnutia.value = officeActivityId.value.office.name;
		selectedOffice.value = officeActivityId.value.office;
	}
	//console.log("skuska id:", extractMicrosoftEventId(miesto_stretnutia.value));
});

const emit = defineEmits(["cancelAddActivity", "activityAdded", "alterEvents"]);

const cancelActivity = () => {
	emit("cancelAddActivity");
};

function getIdFromString(str) {
	const words = str.split(" ");
	return words[words.length - 1];
}

const updateActivity = async () => {
	changeLoading();
	event.preventDefault();

	// Validate email if online meeting is checked and contact doesn't have an email
	if (onlineMeeting.value && !emailBool.value && !email.value) {
		alert("Pre online stretnutie je potrebné zadať email kontaktu");
		changeLoading();
		return;
	}

	try {
		const response = await axios.put(
			`${config.public.apiUrl}update-activities/${props.activityID}`,
			{
				contact_id: contact.value.id,
				aktivita:
					aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
				datumCas: datum_cas.value,
				koniec: koniec.value,
				poznamka: poznamka.value,
				volane: volane.value,
				dovolane: dovolane.value,
				dohodnute: dohodnute.value ? 1 : 0,
				miesto_stretnutia: miesto_stretnutia.value,
				online_meeting: onlineMeeting.value,
				send_notification_15: active.value?.includes(15) || false,
				send_notification_30: active.value?.includes(30) || false,
				send_notification_60: active.value?.includes(60) || false,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		// Update email if necessary - only if onlineMeeting is checked and there's a new email to add
		if (onlineMeeting.value && !emailBool.value && email.value) {
			console.log("Adding email to contact:", email.value);
			await axios.patch(
				`${config.public.apiUrl}contact/${contact.value.id}/email`,
				{
					email: email.value,
				},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
		}

		// Handle Teams meeting creation/update
		if (onlineMeeting.value && !originalOnlineMeetingValue.value) {
			// Only create a new Teams meeting if it wasn't an online meeting before
			try {
				const teamsResponse = await axios.post(
					`${config.public.apiUrl}create-teams-meeting`,
					{
						activityId: props.activityID,
						importance: importance.value,
						user_id: userStore.user.id,
					},
					{ headers: { Authorization: `Bearer ${authStore.token}` } }
				);

				console.log("Teams meeting created:", teamsResponse.data);

				// Update the activity with the meeting URL if needed
				if (teamsResponse.data.joinUrl) {
					response.data.activity.miesto_stretnutia = teamsResponse.data.joinUrl;
					// Update the activity again with the meeting URL
					await axios.put(
						`${config.public.apiUrl}update-activities/${props.activityID}`,
						{
							...response.data.activity,
							miesto_stretnutia: teamsResponse.data.joinUrl,
						},
						{
							headers: {
								Authorization: `Bearer ${authStore.token}`,
							},
						}
					);
				}

				const newActivity = {
					aktivita:
						aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
					datum_cas: datumCasDate.toISOString(),
					koniec: koniecDate.toISOString(),
					poznamka: poznamka.value,
					office_id: officeStore.setOfficeID,
					owner_number: userStore.user.vizitka_phone_num,
				};

				await officeStore.updateActivity(newActivity);

				toast.success("Online stretnutie bolo úspešne vytvorené", {
					position: "top-right",
					timeout: 5000,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					draggablePercent: 60,
					showCloseButtonOnHover: false,
					hideProgressBar: false,
				});
			} catch (error) {
				console.error(
					"Error creating Teams meeting:",
					error.response?.data || error.message
				);
				toast.error("Chyba pri vytváraní online stretnutia", {
					position: "top-right",
					timeout: 5000,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					draggablePercent: 60,
					showCloseButtonOnHover: false,
					hideProgressBar: false,
				});
			}
		}

		if (updateOfficeActivity.value && officeActivity.value) {
			await axios.put(
				`${config.public.apiUrl}update-office-activity/${officeActivity.value.id}`,
				{
					aktivita: aktivita.value,
					datum_cas: datum_cas.value,
					koniec: koniec.value,
					poznamka: poznamka.value,
					office_id: selectedOffice.value.id,
				},
				{ headers: { Authorization: `Bearer ${authStore.token}` } }
			);
		}

		// Display success message
		toast.success("Aktivita bola úspešne aktualizovaná", {
			position: "top-right",
			timeout: 5000,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			draggablePercent: 60,
			showCloseButtonOnHover: false,
			hideProgressBar: false,
		});

		const activityIndex = calendarStore.activities.findIndex(
			(activity) => activity.id === response.data.activity.id
		);

		// If the activity is found, replace it with the updated activity
		if (activityIndex !== -1) {
			calendarStore.activities.splice(activityIndex, 1, response.data.activity);
		}

		emit("activityAdded", response.data.activity);
		emit("alterEvents", response.data.activity);

		//emit("cancelAddActivity");
		changeLoading();
		cancelActivity();
	} catch (error) {
		console.error("Error updating activity:", error);
		toast.error(
			"Nastala chyba pri aktualizácii aktivity: " +
				(error.response?.data?.error || error.message),
			{
				position: "top-right",
				timeout: 5000,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				draggablePercent: 60,
				showCloseButtonOnHover: false,
				hideProgressBar: false,
			}
		);
		changeLoading();
	}
};

const deleteActivity = async () => {
	event.preventDefault();
	await officeStore.deleteActivity(officeActivityId.value);

	await calendarStore.deleteActivity(props.activityID);
	emit("cancelAddActivity");
	emit("alterEvents", null);
};

function extractMicrosoftEventId(teamsLink) {
	if (!teamsLink) return null;

	// Decode the URL-encoded string
	const decodedLink = decodeURIComponent(teamsLink);

	// Extract the meeting ID part
	const match = decodedLink.match(/meetup-join\/(.+?)\//);
	if (!match) return null;

	const fullMeetingId = match[1];

	// The actual event ID is the Base64 part between "meeting_" and "@thread"
	const base64IdMatch = fullMeetingId.match(/meeting_(.+?)@thread/);
	if (!base64IdMatch) return null;

	return base64IdMatch[1]; // Returns "NjA4NDJhYmMtODgyOS00N2VkLThmMGItYjEwMTVjNGYzMTJk"
}
const redirectToContact = () => {
	router.push(`/contact/${contact.value.id}`);
};

const loading = ref(false);

const changeLoading = () => {
	loading.value = !loading.value;
};

watch(dovolane, (newValue) => {
	if (newValue) {
		volane.value = true;
	}
});

watch(dohodnute, (newValue) => {
	if (newValue) {
		volane.value = true;
		dovolane.value = true;
	}
});

const isValidUrl = (url) => {
	try {
		new URL(url);
		console.log("true");
		return true;
	} catch (_) {
		console.log("false");
		return false;
	}
};

const showOffices = ref(false);
const selectedOffice = ref({ id: null, name: "Kancelárie" });
const updateOfficeActivity = ref(false);

const toggleOffices = () => {
	showOffices.value = !showOffices.value;
};

const selectOffice = (office) => {
	officeStore.setOfficeID = office.id;
	selectedOffice.value = office;
	showOffices.value = false;
	updateOfficeActivity.value = true;
};

const setActive = (n) => {
	if (active.value.includes(n)) {
		active.value = active.value.filter((item) => item !== n);
	} else {
		active.value.push(n);
	}

	console.log(active.value);
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<loadigcomponent v-if="loading" />
		<form
			class="relative bg-white bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-10max-h-[100%] overflow-y-auto"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>
			<div>
				<div
					class="flex gap-3 my-4 cursor-pointer hover:bg-gray-200 p-2 border-b-2 border-black"
					v-if="contact.meno || contact.priezvisko"
					@click="redirectToContact"
				>
					<div>Kontakt:</div>
					<div>{{ contact.meno }}</div>
					<div>{{ contact.priezvisko }}</div>
				</div>

				<div v-if="onlineMeeting">
					<label
						class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						{{ emailBool ? "Email kontaktu:" : "Pridať email ku kontaktu:" }}
					</label>
					<input
						v-model="email"
						type="email"
						class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500 !text-black"
						placeholder="Zadajte email ..."
						required
					/>
				</div>
			</div>
			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita</label
				>
				<select
					v-model="aktivita"
					id="floating_aktivita"
					class="w-full bg-gray-200 text-white rounded-lg p-1 py-2 mt-1 !text-black"
				>
					<option value="Telefonát klient">Telefonát klient</option>
					<option value="Telefonát nábor">Telefonát nábor</option>
					<option value="Pohovor">Pohovor</option>
					<option value="Prvé stretnutie">Prvé stretnutie</option>
					<option value="Analýza osobných financí">
						Analýza osobných financí
					</option>
					<option value="Servisná analýza">Servisná analýza</option>
					<option value="poradenstvo nové">Poradenstvo nové</option>
					<option value="servisné poradenstvo">Servisné poradenstvo</option>
					<option value="realizácia">realizácia</option>
					<option value="konfirmačný servis">konfirmačný servis</option>
					<option value="servis">servis</option>
					<option value="bringer bonus">bringer bonus</option>
					<option value="káva">káva</option>
					<option value="stretnutie na zistenie stavu">
						stretnutie na zistenie stavu
					</option>
					<option value="súkromné">súkromné</option>
					<option value="lekár">lekár</option>
					<option value="ine">Iné vypíšem sám</option>
				</select>
				<input
					v-model="ina_aktivita"
					type="text"
					v-if="ineBool"
					class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500 !text-black"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<div
				class="relative z-0 w-full mb-5 mt-2 group"
				v-if="onlineMeeting == true"
			>
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Dôležitosť</label
				>
				<select
					v-model="importance"
					id="floating_aktivita"
					class="w-full bg-gray-200 text-white rounded-lg p-1 py-2 mt-1 !text-black"
				>
					<option value="low">Nízka</option>
					<option value="normal">Normálna</option>
					<option value="high">Vysoká</option>
				</select>
				<input
					v-model="ina_aktivita"
					type="text"
					v-if="ineBool"
					class="w-full mt-3 p-1 bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<div class="relative z-0 w-full mb-6 group">
				<input
					v-model="onlineMeeting"
					type="checkbox"
					class="bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500 mr-4"
					value="true"
				/>
				<label
					class="!text-black text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Online Meeting</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<input
					v-model="datum_cas"
					type="datetime-local"
					step="900"
					name="datum_cas"
					id="floating_datum_cas"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
				<label
					for="floating_datum_cas"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Dátum a čas začatia</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<input
					v-model="koniec"
					type="datetime-local"
					step="900"
					name="datum_cas_koniec"
					id="floating_datum_cas_koniec"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
				<label
					for="floating_datum_cas_koniec"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Dátum a čas ukončenia</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<textarea
					v-model="poznamka"
					name="poznamka"
					id="floating_poznamka"
					rows="3"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				></textarea>
				<label
					for="floating_poznamka"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Poznámka k aktivite</label
				>
			</div>

			<!-- Miesto stretnutia section -->
			<div class="relative z-0 w-full mb-5 group" v-if="!onlineMeeting">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Miesto stretnutia</label
				>

				<div
					v-if="miesto_stretnutia && isValidUrl(miesto_stretnutia)"
					class="mt-3"
				>
					<a
						:href="miesto_stretnutia"
						target="_blank"
						class="text-blue-600 hover:underline block w-4/5 overflow-hidden whitespace-nowrap text-ellipsis"
						:title="miesto_stretnutia"
					>
						{{ miesto_stretnutia }}
					</a>
					<input
						v-model="miesto_stretnutia"
						type="text"
						class="!text-black w-full mt-1 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500"
						placeholder="Zadajte miesto stretnutia ..."
					/>
				</div>
				<input
					v-else
					v-model="miesto_stretnutia"
					type="text"
					class="!text-black w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte miesto stretnutia ..."
				/>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<!-- Dropdown button -->
				<div
					@click="toggleOffices"
					class="flex justify-between w-full cursor-pointer p-2 bg-gray-200 rounded-lg text-black"
				>
					<div>{{ selectedOffice.name }}</div>
					<svg
						class="-mr-1 h-5 w-5 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="currentColor"
						viewBox="0 0 20 20"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
						/>
					</svg>
				</div>

				<div
					v-if="showOffices"
					class="w-full bg-gray-200 rounded-lg !text-black flex flex-col mt-1 max-h-[150px] overflow-y-auto"
				>
					<ul class="m-0 p-0 list-none">
						<li
							v-for="office in allOffices"
							:key="office.id"
							@click="selectOffice(office)"
							:class="[
								'hover:bg-gray-300 my-0 p-2 rounded-sm',
								officeAvailability[office.id] &&
								!officeAvailability[office.id].isFree
									? 'border-2 border-red-500 bg-red-50'
									: '',
							]"
						>
							<div class="flex justify-between items-center">
								<span>{{ office.name }}</span>
								<span
									v-if="
										officeAvailability[office.id] &&
										!officeAvailability[office.id].isFree
									"
									class="text-xs text-red-600 ml-2"
								>
									(Obsadená)
								</span>
							</div>
						</li>
					</ul>
				</div>
			</div>

			<div class="flex justify-between px-12 pb-4" v-if="showVDD">
				<!-- VOLANE -->
				<label class="cursor-pointer flex flex-col items-center gap-4">
					<span
						class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 !text-black"
						>Volané</span
					>
					<input
						type="checkbox"
						value="1"
						class="sr-only peer"
						v-model="volane"
					/>
					<div
						class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
					></div>
				</label>

				<div>
					<!-- VOLANE -->
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 !text-black"
							>Dovolané</span
						>
						<input
							type="checkbox"
							value="1"
							class="sr-only peer"
							v-model="dovolane"
						/>
						<div
							class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
						></div>
					</label>
				</div>

				<div>
					<!-- VOLANE -->
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 !text-black !text-black"
							>Dohodnuté</span
						>
						<input
							type="checkbox"
							value="1"
							class="sr-only peer"
							v-model="dohodnute"
						/>
						<div
							class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
						></div>
					</label>
				</div>
			</div>

			<div class="relative z-0 w-full mb-2 group flex items-center">
				<label class="text-sm text-gray-500">Vytvoriť notifikáciu</label>
				<div class="flex justify-center items-center gap-4 ml-9">
					<span
						v-for="n in [15, 30, 60]"
						:key="n"
						@click="setActive(n)"
						class="bg-slate-200 px-2 py-1.5 rounded-lg border-2 cursor-pointer transition"
						:class="active.includes(n) ? 'border-blue-500 bg-blue-100' : ''"
						>{{ n }}</span
					>
				</div>
			</div>

			<div
				v-if="userStore.user.id == activity_creator"
				class="flex justify-center items-center mt-3 gap-6"
			>
				<button
					@click="updateActivity()"
					class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Update
				</button>
				<button
					@click="deleteActivity()"
					class="text-white bg-red-500 hover:bg-red-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-red-500 dark:hover:bg-red-60"
				>
					Delete
				</button>
			</div>
		</form>
	</div>
</template>

<style scoped>
* {
	text: black !important;
}
</style>
