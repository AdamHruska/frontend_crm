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
const volane = ref(0);
const dovolane = ref(0);
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

	const parseLocal = (str) => {
		const normalized = str.replace(" ", "T").substring(0, 16);
		const [datePart, timePart] = normalized.split("T");
		const [year, month, day] = datePart.split("-").map(Number);
		const [hours, minutes] = timePart.split(":").map(Number);
		return new Date(year, month - 1, day, hours, minutes);
	};

	const newStart = parseLocal(newDatum);
	const newEnd = parseLocal(newKoniec);

	const overlappingActivity = officeStore.allOfficeActivities.find(
		(activity) => {
			if (activity.office_id !== officeId) return false;
			const activityStart = parseLocal(activity.datum_cas);
			const activityEnd = parseLocal(activity.koniec);
			return newStart < activityEnd && activityStart < newEnd;
		},
	);

	return overlappingActivity
		? { isFree: false, overlappingActivity }
		: { isFree: true, overlappingActivity: null };
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

// Auto-flag office activity for update when times change and one already exists
watch([datum_cas, koniec], () => {
	if (officeActivity.value) {
		updateOfficeActivity.value = true;
	}
});

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
	volane.value = !!response.data.activity.volane;
	dovolane.value = !!response.data.activity.dovolane;
	dohodnute.value = !!response.data.activity.dohodnute;
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
		if (originalOnlineMeetingValue.value && !onlineMeeting.value) {
			try {
				miesto_stretnutia.value = "";
				await axios.post(
					`${config.public.apiUrl}cancel-teams-meeting`,
					{ activityId: props.activityID, user_id: userStore.user.id },
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
				volane: volane.value ? 1 : 0,
				dovolane: dovolane.value ? 1 : 0,
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

		if (onlineMeeting.value && !emailBool.value && email.value) {
			await axios.patch(
				`${config.public.apiUrl}contact/${contact.value.id}/email`,
				{ email: email.value },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
		}

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

		if (updateOfficeActivity.value && selectedOffice.value.id) {
			const toLocalString = (localStr) => {
				if (!localStr) return localStr;
				if (localStr.includes(" ")) return localStr.substring(0, 19);
				return localStr.replace("T", " ") + ":00";
			};

			if (officeActivity.value) {
				await axios.put(
					`${config.public.apiUrl}update-office-activity/${officeActivity.value.id}`,
					{
						aktivita: aktivita.value,
						datum_cas: toLocalString(datum_cas.value),
						koniec: toLocalString(koniec.value),
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
						datum_cas: toLocalString(datum_cas.value),
						koniec: toLocalString(koniec.value),
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

	if (
		(aktivita.value === "Analýza osobných financí" ||
			aktivita.value === "Servisná analýza") &&
		activity_status.value === "check" &&
		!showNewNamesModal.value
	) {
		showNewNamesModal.value = true;
		return;
	}

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
	toast.success("Aktivita bola úspěšne smazaná");
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

watch(volane, (newValue) => {
	if (!newValue) {
		dovolane.value = false;
		dohodnute.value = false;
	}
});

watch(dovolane, (newValue) => {
	if (newValue) {
		volane.value = true;
	} else {
		dohodnute.value = false;
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
			class="relative bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full z-10 max-h-[100vh] overflow-y-auto"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<!-- Contact bar -->
			<div
				class="flex gap-3 my-4 cursor-pointer hover:bg-gray-200 p-2 border-b-2 border-black"
				v-if="contact.meno || contact.priezvisko"
				@click="redirectToContact"
			>
				<div>Kontakt:</div>
				<div>{{ contact.meno }}</div>
				<div>{{ contact.priezvisko }}</div>
			</div>

			<!-- Email for online meeting -->
			<div v-if="onlineMeeting" class="mb-4">
				<label class="text-sm text-gray-500">
					{{ emailBool ? "Email kontaktu:" : "Pridať email ku kontaktu:" }}
				</label>
				<input
					v-model="email"
					type="email"
					class="w-full mt-2 p-1 bg-gray-200 rounded-lg !text-black pl-2 focus:outline-blue-500"
					placeholder="Zadajte email ..."
					required
				/>
			</div>

			<!-- ═══ TWO-COLUMN GRID ═══ -->
			<div class="form-grid">
				<!-- col 1: Aktivita -->
				<div class="relative z-0 w-full group">
					<label class="text-sm text-gray-500">Aktivita</label>
					<select
						v-model="aktivita"
						class="w-full bg-gray-200 rounded-lg p-1 py-2 mt-1 !text-black"
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
						class="w-full mt-2 p-1 bg-gray-200 rounded-lg !text-black pl-2 focus:outline-blue-500"
						placeholder="Zadajte aktivitu ..."
					/>
				</div>

				<!-- col 2: Status buttons -->
				<div class="relative z-0 w-full group">
					<label class="text-sm text-gray-500 block mb-2">Stav aktivity</label>
					<div class="flex flex-wrap gap-2">
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
				</div>

				<!-- col 1: Importance (only when onlineMeeting) -->
				<div class="relative z-0 w-full group" v-if="onlineMeeting">
					<label class="text-sm text-gray-500">Dôležitosť</label>
					<select
						v-model="importance"
						class="w-full bg-gray-200 rounded-lg p-1 py-2 mt-1 !text-black"
					>
						<option value="low">Nízka</option>
						<option value="normal">Normálna</option>
						<option value="high">Vysoká</option>
					</select>
				</div>

				<!-- col 2 (or full): Online Meeting checkbox -->
				<div
					class="relative z-0 w-full group flex items-center"
					:class="{ 'span-2': !onlineMeeting }"
				>
					<input
						v-model="onlineMeeting"
						type="checkbox"
						class="bg-slate-700 rounded-lg text-white focus:outline-blue-500 mr-3"
					/>
					<label class="!text-black text-sm">Online Meeting</label>
				</div>

				<!-- col 1: Dátum začatia -->
				<div class="relative z-0 w-full group">
					<input
						v-model="datum_cas"
						type="datetime-local"
						step="900"
						class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
						placeholder=" "
					/>
					<label
						class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Dátum a čas začatia
					</label>
				</div>

				<!-- col 2: Dátum ukončenia -->
				<div class="relative z-0 w-full group">
					<input
						v-model="koniec"
						type="datetime-local"
						step="900"
						class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
						placeholder=" "
					/>
					<label
						class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Dátum a čas ukončenia
					</label>
				</div>

				<!-- full: Poznámka -->
				<div class="relative z-0 w-full group span-2">
					<textarea
						v-model="poznamka"
						name="poznamka"
						rows="2"
						class="!text-black block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
						placeholder=" "
					></textarea>
					<label
						class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Poznámka k aktivite
					</label>
				</div>

				<!-- full: Teams link -->
				<div
					v-if="
						onlineMeeting && miesto_stretnutia && isValidUrl(miesto_stretnutia)
					"
					class="span-2"
				>
					<label class="text-sm text-gray-500"
						>Link na online stretnutie:</label
					>
					<a
						:href="miesto_stretnutia"
						target="_blank"
						class="block mt-1 text-blue-600 hover:underline text-sm overflow-hidden whitespace-nowrap text-ellipsis"
						:title="miesto_stretnutia"
					>
						Otvoriť Teams stretnutie
					</a>
				</div>

				<!-- col 1: Miesto stretnutia -->
				<div class="relative z-0 w-full group" v-if="!onlineMeeting">
					<label class="text-sm text-gray-500">Miesto stretnutia</label>
					<div
						v-if="miesto_stretnutia && isValidUrl(miesto_stretnutia)"
						class="mt-2"
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
							class="!text-black w-full mt-1 p-1 bg-gray-200 rounded-lg pl-2 focus:outline-blue-500"
							placeholder="Zadajte miesto stretnutia ..."
						/>
					</div>
					<input
						v-else
						v-model="miesto_stretnutia"
						type="text"
						class="!text-black w-full mt-2 p-1 bg-gray-200 rounded-lg pl-2 focus:outline-blue-500"
						placeholder="Zadajte miesto stretnutia ..."
					/>
				</div>

				<!-- col 2: Kancelária -->
				<div class="relative z-0 w-full group">
					<label class="text-sm text-gray-500 block mb-1">Kancelária</label>
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
										>(Obsadená)</span
									>
								</div>
							</li>
						</ul>
					</div>
				</div>

				<!-- full: Free office button -->
				<div class="flex justify-end span-2" v-if="officeActivity">
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

				<!-- col 1: VDD toggles -->
				<div class="relative z-0 w-full group" v-if="showVDD">
					<label class="text-sm text-gray-500 block mb-2"
						>Volané / Dovolané / Dohodnuté</label
					>
					<div class="flex justify-between px-2">
						<label class="cursor-pointer flex flex-col items-center gap-3">
							<span class="text-sm font-medium !text-black">Volané</span>
							<input
								type="checkbox"
								value="1"
								class="sr-only peer"
								v-model="volane"
							/>
							<div
								class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
							></div>
						</label>
						<label class="cursor-pointer flex flex-col items-center gap-3">
							<span class="text-sm font-medium !text-black">Dovolané</span>
							<input
								type="checkbox"
								value="1"
								class="sr-only peer"
								v-model="dovolane"
							/>
							<div
								class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
							></div>
						</label>
						<label class="cursor-pointer flex flex-col items-center gap-3">
							<span class="text-sm font-medium !text-black">Dohodnuté</span>
							<input
								type="checkbox"
								value="1"
								class="sr-only peer"
								v-model="dohodnute"
							/>
							<div
								class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
							></div>
						</label>
					</div>
				</div>

				<!-- col 2 (or full if no VDD): Notifications -->
				<div
					class="relative z-0 w-full group flex flex-col justify-center"
					:class="{ 'span-2': !showVDD }"
				>
					<label class="text-sm text-gray-500 mb-2">Vytvoriť notifikáciu</label>
					<div class="flex items-center gap-3">
						<span
							v-for="n in [15, 30, 60]"
							:key="n"
							@click="setActive(n)"
							class="bg-slate-200 px-3 py-1.5 rounded-lg border-2 cursor-pointer transition"
							:class="active.includes(n) ? 'border-blue-500 bg-blue-100' : ''"
							>{{ n }}</span
						>
					</div>
				</div>

				<!-- full: Action buttons -->
				<div
					v-if="
						userStore.user.id == activity_creator ||
						(people &&
							people.length > 0 &&
							people[0].shared_author == userStore.user.id)
					"
					class="flex justify-center items-center gap-6 span-2 mt-2"
				>
					<button
						type="button"
						@click="updateActivity()"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center"
					>
						Upraviť
					</button>
					<button
						type="button"
						@click="deleteActivity()"
						class="text-white bg-red-500 hover:bg-red-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center"
					>
						Vymazať
					</button>
				</div>
			</div>
			<!-- ═══ END GRID ═══ -->
		</form>
	</div>
</template>

<style scoped>
* {
	text: black !important;
}
.form-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 14px 24px;
	align-items: start;
}
.form-grid .span-2 {
	grid-column: 1 / -1;
}
@media (max-width: 520px) {
	.form-grid {
		grid-template-columns: 1fr;
	}
	.form-grid .span-2 {
		grid-column: 1;
	}
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
	margin-bottom: 8px;
}
.free-office-btn:hover {
	background-color: #b3b0b0;
}
</style>
