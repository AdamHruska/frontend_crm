<script setup>
const config = useRuntimeConfig();
const router = useRouter();
import { Icon } from "@iconify/vue";
import axios from "axios";
const props = defineProps({
	activityID: String,
	user: Object,
	people: Object,
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

import { add, parseISO, format } from "date-fns";

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
const activity_status = ref("");

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
			if (activity.office_id !== officeId) return false;
			const activityStart = new Date(activity.datum_cas);
			const activityEnd = new Date(activity.koniec);
			return newStart < activityEnd && activityStart < newEnd;
		},
	);

	if (overlappingActivity) {
		return { isFree: false, overlappingActivity };
	} else {
		return { isFree: true, overlappingActivity: null };
	}
};

watch(
	() => [datum_cas.value, koniec.value, officeStore.allOfficeActivities],
	([newDatum, newKoniec]) => {
		if (!newDatum || !newKoniec) {
			officeAvailability.value = {};
			return;
		}
		const availability = {};
		allOffices.value.forEach((office) => {
			availability[office.id] = checkOfficeAvailability(
				office.id,
				newDatum,
				newKoniec,
			);
		});
		officeAvailability.value = availability;
	},
	{ deep: true },
);

const emailBool = ref(false);
const email = ref("");

const showAlterButtons = ref(false);
const originalOnlineMeetingValue = ref(false);

const officeActivity = ref(null);
const officeActivityId = ref(null);

const showVDD = ref(false);

watch(aktivita, (newValue) => {
	ineBool.value = newValue === "ine";

	if (
		(newValue === "Telefonát klient" || newValue === "Telefonát nábor") &&
		datum_cas.value
	) {
		showVDD.value = true;
		const newEndTime = add(parseISO(datum_cas.value), { minutes: 5 });
		koniec.value = format(newEndTime, "yyyy-MM-dd'T'HH:mm");
	} else {
		showVDD.value = false;
	}
});

watch([aktivita, datum_cas], ([newAktivita, newDatumCas]) => {
	if (!newAktivita || !newDatumCas) return;

	const val = newAktivita.toLowerCase().trim();

	if (val.startsWith("telefonát")) {
		const newEndTime = add(parseISO(newDatumCas), { minutes: 5 });
		koniec.value = format(newEndTime, "yyyy-MM-dd'T'HH:mm");
	} else {
		const newEndTime = add(parseISO(newDatumCas), { hours: 1 });
		koniec.value = format(newEndTime, "yyyy-MM-dd'T'HH:mm");
	}
});

const active = ref([]);

// ── Auto-release office when activity is discarded (future only) ──
watch(activity_status, async (newStatus) => {
	if (newStatus !== "discarded") return;
	if (!officeActivity.value) return;

	const activityDate = new Date(datum_cas.value);
	if (activityDate <= new Date()) return;

	deletingOfficeActivity.value = true;
	try {
		await axios.delete(
			`${config.public.apiUrl}office-activities/${officeActivity.value.id}`,
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		officeActivity.value = null;
		officeActivityId.value = null;
		selectedOffice.value = { id: null, name: "Kancelárie" };
		miesto_stretnutia.value = "";

		toast.info("Kancelária bola automaticky uvoľnená");
	} catch (error) {
		console.error("Error auto-releasing office:", error);
		toast.error("Chyba pri automatickom uvoľňovaní kancelárie");
	} finally {
		deletingOfficeActivity.value = false;
	}
});

onMounted(async () => {
	officeStore.fetchOffices();
	officeStore.fetchOfficesSharedWithMe();
	await userStore.fetchUser();

	officeStore.getallOfficeActivites();

	const response = await axios.get(
		`${config.public.apiUrl}activities/${props.activityID}`,
		{ headers: { Authorization: `Bearer ${authStore.token}` } },
	);

	if (response.data.activity.send_notification_15) active.value.push(15);
	if (response.data.activity.send_notification_30) active.value.push(30);
	if (response.data.activity.send_notification_60) active.value.push(60);

	activity_creator.value = response.data.activity.created_id;
	aktivita.value = response.data.activity.aktivita;
	ina_aktivita.value = response.data.activity.aktivita;
	datum_cas.value = response.data.activity.datumCas;
	koniec.value = response.data.activity.koniec;
	poznamka.value = response.data.activity.poznamka;
	volane.value = response.data.activity.volane;
	dovolane.value = response.data.activity.dovolane;
	dohodnute.value = response.data.activity.dohodnute === 1 ? true : false;
	activity_status.value = response.data.activity.activity_status;
	ineBool.value = response.data.activity.ineBool;
	miesto_stretnutia.value = response.data.activity.miesto_stretnutia;
	onlineMeeting.value = response.data.activity.online_meeting == 1;
	originalOnlineMeetingValue.value = response.data.activity.online_meeting == 1;

	const responseContact = await axios.get(
		`${config.public.apiUrl}contact/${response.data.activity.contact_id}`,
		{ headers: { Authorization: `Bearer ${authStore.token}` } },
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
		officeActivityId.value = null;
		officeActivity.value = null;
		return;
	}

	officeActivityId.value = result;
	officeActivity.value = result.activity;

	if (officeActivityId.value.office?.name) {
		miesto_stretnutia.value = officeActivityId.value.office.name;
		selectedOffice.value = officeActivityId.value.office;
	}
});

const emit = defineEmits(["cancelAddActivity", "activityAdded", "alterEvents"]);

const cancelActivity = () => {
	emit("cancelAddActivity");
};

function getIdFromString(str) {
	const words = str.split(" ");
	return words[words.length - 1];
}

const runUpdateActivity = async () => {
	changeLoading();
	try {
		// ── Cancel Teams meeting if online meeting was just disabled ──
		if (originalOnlineMeetingValue.value && !onlineMeeting.value) {
			try {
				miesto_stretnutia.value = "";
				await axios.post(
					`${config.public.apiUrl}cancel-teams-meeting`,
					{
						activityId: props.activityID,
						user_id: userStore.user.id,
					},
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);
				toast.success(
					"Online stretnutie bolo zrušené a kontakt bol notifikovaný",
				);
			} catch (error) {
				console.error("Error cancelling Teams meeting:", error);
				toast.error("Chyba pri rušení online stretnutia");
			}
		}

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
				activity_status: activity_status.value,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		// Sync office activity status
		try {
			await axios.post(
				`${config.public.apiUrl}office-activities/sync-status`,
				{
					datum_cas: datum_cas.value,
					koniec: koniec.value,
					owner_id: userStore.user.id,
					activity_status: activity_status.value,
				},
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
		} catch (syncError) {
			console.warn("Could not sync office activity status:", syncError.message);
		}

		// Update email if needed
		if (onlineMeeting.value && !emailBool.value && email.value) {
			await axios.patch(
				`${config.public.apiUrl}contact/${contact.value.id}/email`,
				{ email: email.value },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
		}

		// Teams meeting - create if newly enabled, update if already existed
		if (onlineMeeting.value) {
			try {
				let teamsResponse;

				if (!originalOnlineMeetingValue.value) {
					teamsResponse = await axios.post(
						`${config.public.apiUrl}create-teams-meeting`,
						{
							activityId: props.activityID,
							user_id: userStore.user.id,
							importance: importance.value,
						},
						{ headers: { Authorization: `Bearer ${authStore.token}` } },
					);
					toast.success("Online stretnutie bolo úspešne vytvorené");
				} else {
					teamsResponse = await axios.post(
						`${config.public.apiUrl}update-teams-meeting`,
						{ activityId: props.activityID },
						{ headers: { Authorization: `Bearer ${authStore.token}` } },
					);
					toast.success("Online stretnutie bolo úspešne aktualizované");
				}

				if (teamsResponse.data.joinUrl) {
					response.data.activity.miesto_stretnutia = teamsResponse.data.joinUrl;
					miesto_stretnutia.value = teamsResponse.data.joinUrl;
				}
			} catch (error) {
				console.error(
					"Error with Teams meeting:",
					error.response?.data || error.message,
				);
				toast.error(
					"Chyba pri vytváraní alebo aktualizovaní online stretnutia",
				);
			}
		}

		// Create or update office activity
		if (updateOfficeActivity.value && selectedOffice.value.id) {
			const toUtc = (localStr) => {
				const d = new Date(localStr);
				d.setHours(d.getHours() - 0);
				return d.toISOString().slice(0, 19).replace("T", " ");
			};

			if (officeActivity.value) {
				await axios.put(
					`${config.public.apiUrl}update-office-activity/${officeActivity.value.id}`,
					{
						aktivita: aktivita.value,
						datum_cas: toUtc(datum_cas.value),
						koniec: toUtc(koniec.value),
						poznamka: poznamka.value,
						office_id: selectedOffice.value.id,
					},
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);
			} else {
				await axios.post(
					`${config.public.apiUrl}create-office-activity`,
					{
						aktivita: aktivita.value,
						datum_cas: toUtc(datum_cas.value),
						koniec: toUtc(koniec.value),
						poznamka: poznamka.value,
						office_id: selectedOffice.value.id,
						owner_number: userStore.user.vizitka_phone_num,
					},
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);
			}
		}

		if (!onlineMeeting.value) {
			toast.success("Aktivita bola úspešne aktualizovaná");
		}

		const activityIndex = calendarStore.activities.findIndex(
			(a) => a.id === response.data.activity.id,
		);
		if (activityIndex !== -1) {
			calendarStore.activities.splice(activityIndex, 1, response.data.activity);
		}

		emit("activityAdded", response.data.activity);
		emit("alterEvents", response.data.activity);

		// Update so re-editing in same session doesn't re-trigger cancellation
		originalOnlineMeetingValue.value = onlineMeeting.value;

		setTimeout(() => {
			changeLoading();
			cancelActivity();
		}, 400);
	} catch (error) {
		console.error("Error updating activity:", error);
		toast.error(
			"Nastala chyba pri aktualizácii aktivity: " +
				(error.response?.data?.error || error.message),
		);
		changeLoading();
	}
};

const updateActivity = async () => {
	event.preventDefault();

	if (onlineMeeting.value && !emailBool.value && !email.value) {
		alert("Pre online stretnutie je potrebné zadať email kontaktu");
		return;
	}

	// Guard: NewNamesModal
	if (
		(aktivita.value === "Analýza osobných financí" ||
			aktivita.value === "Servisná analýza") &&
		activity_status.value === "check" &&
		!showNewNamesModal.value
	) {
		showNewNamesModal.value = true;
		return;
	}

	// Guard: ConfirmEventModal
	if (
		aktivita.value === "Prvé stretnutie" &&
		activity_status.value === "check"
	) {
		showConfirmEventModal.value = true;
		return;
	}

	await runUpdateActivity();
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
	const decodedLink = decodeURIComponent(teamsLink);
	const match = decodedLink.match(/meetup-join\/(.+?)\//);
	if (!match) return null;
	const fullMeetingId = match[1];
	const base64IdMatch = fullMeetingId.match(/meeting_(.+?)@thread/);
	if (!base64IdMatch) return null;
	return base64IdMatch[1];
}

const redirectToContact = () => {
	router.push(`/contact/${contact.value.id}`);
};

const loading = ref(false);
const changeLoading = () => {
	loading.value = !loading.value;
};

watch(dovolane, (newValue) => {
	if (newValue) volane.value = true;
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
		return true;
	} catch (_) {
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
};

const deletingOfficeActivity = ref(false);

const freeOffice = async () => {
	if (!officeActivity.value) {
		toast.error("Žiadna kancelárska aktivita sa nenašla");
		return;
	}
	if (!confirm("Naozaj chcete uvoľniť kanceláriu?")) return;

	deletingOfficeActivity.value = true;
	try {
		await axios.delete(
			`${config.public.apiUrl}office-activities/${officeActivity.value.id}`,
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		await axios.put(
			`${config.public.apiUrl}update-activities/${props.activityID}`,
			{ miesto_stretnutia: "" },
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		officeActivity.value = null;
		officeActivityId.value = null;
		selectedOffice.value = { id: null, name: "Kancelárie" };
		miesto_stretnutia.value = "";

		toast.success("Kancelária bola úspešne uvoľnená");
	} catch (error) {
		console.error("Error freeing office:", error);
		toast.error("Chyba pri uvoľňovaní kancelárie");
	} finally {
		deletingOfficeActivity.value = false;
	}
};

const showNewNamesModal = ref(false);
const selectedActivityId = ref(null);
const currentActivityType = ref("");

const changeShowNewNamesModal = () => {
	showNewNamesModal.value = !showNewNamesModal.value;
};

const showConfirmEventModal = ref(false);
const pendingActivityData = ref(null);

const changeConfirmEventModal = () => {
	showConfirmEventModal.value = !showConfirmEventModal.value;
};

const handleConfirmEvent = async () => {
	showConfirmEventModal.value = false;

	try {
		const startTime = new Date(datum_cas.value);
		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
		const dateTimeEnd = endTime
			.toISOString()
			.replace("T", " ")
			.substring(0, 19);

		await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: contact.value.id,
				aktivita: "Analýza osobných financí",
				datumCas: datum_cas.value,
				koniec: dateTimeEnd,
				volane: null,
				dovozene: null,
				dohodnute: null,
				online_meeting: false,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);
	} catch (error) {
		console.error("Error creating financial analysis:", error);
		toast.error("Chyba pri vytváraní analýzy");
	}

	await runUpdateActivity();
};

const handleCloseConfirmEvent = async () => {
	showConfirmEventModal.value = false;
	await runUpdateActivity();
};
</script>

<template>
	<ConfirmEventModal
		v-if="showConfirmEventModal"
		@close="changeConfirmEventModal"
		@confirm="handleConfirmEvent"
		@closeConfirm="handleCloseConfirmEvent"
	/>

	<NewNamesModal
		v-if="showNewNamesModal"
		@close="changeShowNewNamesModal"
		@submitted="updateActivity"
		:activityId="props.activityID"
	/>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<loadigcomponent v-if="loading" />
		<form
			class="relative bg-white bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-10 max-h-[100%] overflow-y-auto"
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
					class="w-full bg-gray-200 text-white rounded-lg p-1 py-2 mt-1 !text-black"
				>
					<option value="Telefonát klient">Telefonát klient</option>
					<option value="Telefonát nábor">Telefonát nábor</option>
					<option value="Telefonát">Telefonát</option>
					<option value="Pohovor">Pohovor</option>
					<option value="Prvé stretnutie">Prvé stretnutie</option>
					<option value="Analýza osobných financí">
						Analýza osobných financí
					</option>
					<option value="Servisná analýza">Analýza servisná</option>
					<option value="poradenstvo nové">Poradenstvo nové</option>
					<option value="servisné poradenstvo">Poradenstvo servisné</option>
					<option value="realizácia nová">Realizácia nová</option>
					<option value="realizácia servisná">Realizácia servisná</option>
					<option value="konfirmačný servis">Konfirmačný servis</option>
					<option value="servis">Servis</option>
					<option value="bringer bonus">Bringer bonus</option>
					<option value="porada">Porada</option>
					<option value="vzdelávanie">Vzdelávanie</option>
					<option value="káva">Káva</option>
					<option value="stretnutie na zistenie stavu">
						Stretnutie na zistenie stavu
					</option>
					<option value="súkromné">Súkromné</option>
					<option value="lekár">Lekár</option>
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
				/>
				<label
					class="!text-black text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Online Meeting</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 mt-6 group">
				<input
					v-model="datum_cas"
					type="datetime-local"
					step="900"
					name="datum_cas"
					id="floating_datum_cas"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-10"
					placeholder=" "
				/>
				<span
					class="absolute right-9 top-1/2 transform -translate-y-1/2 pointer-events-none"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-black"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</span>
				<label
					for="floating_datum_cas"
					class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
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
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-10"
					placeholder=" "
				/>
				<span
					class="absolute right-9 top-1/2 transform -translate-y-1/2 pointer-events-none"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-black"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</span>
				<label
					for="floating_datum_cas_koniec"
					class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Dátum a čas ukončenia</label
				>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<textarea
					v-model="poznamka"
					name="poznamka"
					rows="3"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				></textarea>
				<label
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Poznámka k aktivite
				</label>
			</div>

			<div
				v-if="
					onlineMeeting && miesto_stretnutia && isValidUrl(miesto_stretnutia)
				"
				class="mb-4"
			>
				<label class="text-sm text-gray-500">Link na online stretnutie:</label>
				<a
					:href="miesto_stretnutia"
					target="_blank"
					class="block mt-1 text-blue-600 hover:underline text-sm overflow-hidden whitespace-nowrap text-ellipsis"
					:title="miesto_stretnutia"
				>
					Otvoriť Teams stretnutie
				</a>
			</div>

			<div class="relative z-0 w-full mb-5 group" v-if="!onlineMeeting">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Miesto stretnutia
				</label>
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

			<div class="flex justify-end mt-1" v-if="officeActivity">
				<button
					type="button"
					@click="freeOffice"
					:disabled="deletingOfficeActivity"
					class="free-office-btn"
				>
					<Icon icon="material-symbols:lock-open" width="14" height="14" />
					<span v-if="deletingOfficeActivity">Uvoľňujem...</span>
					<span v-else>Uvoľniť kanceláriu</span>
				</button>
			</div>

			<div class="flex justify-between px-12 pb-4" v-if="showVDD">
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
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 !text-black"
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

			<div class="flex justify-center gap-4 mb-6">
				<button
					class="status-btn"
					:class="{ active: activity_status === 'questionmark' }"
					title="Otáznik"
					@click.prevent="activity_status = 'questionmark'"
				>
					<Icon icon="pepicons-pencil:question" width="18" />
				</button>
				<button
					class="status-btn status-btn-green"
					:class="{
						active:
							activity_status === 'check' || activity_status === 'accepted',
					}"
					title="Dokončené"
					@click.prevent="activity_status = 'check'"
				>
					<Icon icon="fa6-solid:check" width="14" />
				</button>
				<button
					class="status-btn status-btn-red"
					:class="{ active: activity_status === 'discarded' }"
					title="Zamietnuté"
					@click.prevent="activity_status = 'discarded'"
				>
					<Icon icon="material-symbols:close" width="18" />
				</button>
				<template v-if="aktivita === 'Pohovor'">
					<button
						class="status-btn status-btn-blue"
						:class="{ active: activity_status === 'accepted' }"
						title="Prijaté"
						@click.prevent="activity_status = 'accepted'"
					>
						<Icon icon="fa6-solid:thumbs-up" width="14" />
					</button>
					<button
						class="status-btn status-btn-orange"
						:class="{ active: activity_status === 'rejected' }"
						title="Odmietnuté"
						@click.prevent="activity_status = 'rejected'"
					>
						<Icon icon="fa6-solid:thumbs-down" width="14" />
					</button>
				</template>
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
				v-if="
					userStore.user.id == activity_creator ||
					(people &&
						people.length > 0 &&
						people[0].shared_author == userStore.user.id)
				"
				class="flex justify-center items-center mt-3 gap-6"
			>
				<button
					type="button"
					@click="updateActivity()"
					class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Upraviť
				</button>
				<button
					type="button"
					@click="deleteActivity()"
					class="text-white bg-red-500 hover:bg-red-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-red-500 dark:hover:bg-red-60"
				>
					Vymazať
				</button>
			</div>
		</form>
	</div>
</template>

<style scoped>
* {
	text: black !important;
}
.status-btn {
	padding: 8px;
	border-radius: 6px;
	background: #eee;
}
.status-btn.active {
	background: #dbeafe;
}
.status-btn-green.active {
	background: #bbf7d0;
}
.status-btn-red.active {
	background: #fecaca;
}
.status-btn-blue.active {
	background: #bfdbfe;
}
.status-btn-orange.active {
	background: #fed7aa;
}
.free-office-btn {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	transition: all 0.2s ease;
	padding: 8px 12px;
	border-radius: 8px;
	background-color: #cecbcb;
	margin-bottom: 16px;
}
.free-office-btn:hover {
	background-color: #b3b0b0;
}
</style>
