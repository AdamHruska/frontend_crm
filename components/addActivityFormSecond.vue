<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
import { format, parseISO, add } from "date-fns";
const props = defineProps({
	contact_id: {
		type: String,
		required: true,
	},
});

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

import { useCalendarstore } from "#imports";
const calendarStore = useCalendarstore();

import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();

import { useOfficeStore } from "#imports";
const officeStore = useOfficeStore();

import { useToast } from "vue-toastification";
const toast = useToast();

const showVDD = ref(false);

const contact = ref([]);

const aktivita = ref("");
const ina_aktivita = ref("");
const importance = ref("normal");
const datum_cas = ref("");
const koniec = ref("");
const poznamka = ref("");
const volane = ref("");
const dovolane = ref("");
const dohodnute = ref("");
const ineBool = ref(false);
const miesto_stretnutia = ref("");
const onlineMeeting = ref(false);

const officeAvailability = ref({});

const allOffices = computed(() => [
	...officeStore.offices,
	...officeStore.officesSharedWithMe,
]);

const currentTimeFromDatum = computed(() => {
	if (!datum_cas.value) return null;
	const date = new Date(datum_cas.value);
	return format(date, "HH:mm");
});

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

const emailBool = ref(false);
const email = ref("");
const contacts = ref([]);

watch([aktivita, datum_cas], ([newAktivita, newDatumCas]) => {
	ineBool.value = newAktivita === "ine";

	const val = (newAktivita || "").toLowerCase().trim();

	if (val.startsWith("telefonát") && newDatumCas) {
		showVDD.value = true;
		const newEndTime = add(parseISO(newDatumCas), { minutes: 5 });
		koniec.value = format(newEndTime, "yyyy-MM-dd'T'HH:mm");
	} else {
		showVDD.value = false;
	}
});

const manualChangeCount = ref(0);
const showCalendar = ref(false);
const dateOnly = ref("");

watch(datum_cas, (newValue) => {
	if (!newValue) return;

	const addedTime =
		aktivita.value === "Telefonát klient" ? { minutes: 5 } : { hours: 1 };

	const newEnd = add(parseISO(newValue), addedTime);
	koniec.value = format(newEnd, "yyyy-MM-dd'T'HH:mm");

	dateOnly.value = newValue.split("T")[0];

	if (manualChangeCount.value > 1) {
		showCalendar.value = true;
	}

	manualChangeCount.value = 10;
});

onBeforeMount(async () => {
	officeStore.fetchOffices();
	officeStore.fetchOfficesSharedWithMe();
	userStore.fetchUser();

	officeStore.getallOfficeActivites();

	const response = await findPerson(props.contact_id);
	if (contact.value[0]?.email) {
		emailBool.value = true;
	}

	const now = new Date();
	datum_cas.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	const startPlusHour = add(datum_cas.value, { hours: 1 });
	koniec.value = format(startPlusHour, "yyyy-MM-dd'T'HH:mm");

	const response2 = await axios.get(`${config.public.apiUrl}all-contacts`, {
		headers: { Authorization: `Bearer ${authStore.token}` },
	});
	contacts.value = await response2.data.contacts;
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: { Authorization: `Bearer ${authStore.token}` },
		});
		if (response.data && response.data.contact) {
			contact.value = [response.data.contact];
		}
	} catch (error) {
		console.error("Error fetching contact:", error);
	}
};

const emit = defineEmits(["cancelAddActivity", "activityAdded"]);

const cancelActivity = () => {
	emit("cancelAddActivity");
};

const emailCount = ref(0);
const emails = ref([""]);

const addActivity = async () => {
	event.preventDefault();

	if (onlineMeeting.value) {
		const hasEmail =
			emailBool.value || (email.value && email.value.trim() !== "");
		if (!hasEmail) {
			toast.error("Pre online stretnutie je potrebné zadať email");
			return;
		}
	}

	if (aktivita.value === "ine") {
		aktivita.value = ina_aktivita.value;
	}

	if (onlineMeeting.value) {
		miesto_stretnutia.value =
			"Online Meeting " + (email.value || contact.value[0].email);
	}

	try {
		if (
			aktivita.value === "Telefonát klient" ||
			aktivita.value === "Telefonát nábor"
		) {
			volane.value = true;
		}

		if (selectedOffice.value.name !== "Kancelárie") {
			miesto_stretnutia.value = selectedOffice.value.name;
		}

		const response = await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: props.contact_id,
				aktivita: aktivita.value,
				datumCas: datum_cas.value,
				koniec: koniec.value,
				poznamka: poznamka.value,
				volane: volane.value,
				dovolane: dovolane.value,
				dohodnute: dohodnute.value,
				online_meeting: onlineMeeting.value,
				miesto_stretnutia: miesto_stretnutia.value,
				send_notification_15: active.value?.includes(15) || false,
				send_notification_30: active.value?.includes(30) || false,
				send_notification_60: active.value?.includes(60) || false,
			},
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		if (response.data.status === 201) {
			toast.success("Aktivita bola úspešne pridaná");
		}

		if (response.data.activity.aktivita === "Pohovor") {
			location.reload();
		}

		if (!emailBool.value && onlineMeeting.value && email.value) {
			await axios.patch(
				`${config.public.apiUrl}contact/${props.contact_id}/email`,
				{ email: email.value },
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
		}

		if (onlineMeeting.value) {
			try {
				const teamsResponse = await axios.post(
					`${config.public.apiUrl}create-teams-meeting`,
					{
						activityId: response.data.activity.id,
						user_id: userStore.user.id,
						importance: importance.value,
					},
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);

				if (teamsResponse.data.joinUrl) {
					const officePart =
						selectedOffice.value.name !== "Kancelárie"
							? `${selectedOffice.value.name} - `
							: "";
					response.data.activity.miesto_stretnutia = `${officePart}${teamsResponse.data.joinUrl}`;
					miesto_stretnutia.value = response.data.activity.miesto_stretnutia;
				}
			} catch (error) {
				console.error("Error creating Teams meeting:", error);
				toast.error("Chyba pri vytváraní online stretnutia");
			}
		}

		if (selectedOffice.value.name !== "Kancelárie") {
			const toLocalString = (localStr) => localStr.replace("T", " ") + ":00";

			const newActivity = {
				aktivita: aktivita.value,
				datum_cas: toLocalString(datum_cas.value),
				koniec: toLocalString(koniec.value),
				poznamka: poznamka.value,
				office_id: officeStore.setOfficeID,
				owner_number: userStore.user.vizitka_phone_num,
			};

			await officeStore.storeActivity(newActivity);
		}

		calendarStore.activities.push(response.data.activity);

		const successMsg = onlineMeeting.value
			? "Online stretnutie bolo úspešne pridané"
			: "Aktivita bola úspešne pridaná";

		toast.success(successMsg);

		emit("activityAdded", response.data.activity);

		setTimeout(() => {
			emit("cancelAddActivity");
		}, 400);
	} catch (error) {
		console.error("Error adding activity:", error);
		toast.error("Chyba pri pridávaní aktivity");
	}
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

watch(emailCount, (newCount, oldCount) => {
	if (newCount > oldCount) {
		emails.value.push("");
	} else if (newCount < oldCount && newCount > 0) {
		emails.value.pop();
	} else if (newCount === 0) {
		emails.value = [""];
	}
});

watch(onlineMeeting, (newValue) => {
	if (newValue) {
		emails.value[0] = email.value;
	}
});

const activeDropdown = ref(null);

const filteredContacts = (index) => {
	const searchText = emails.value[index] || "";
	if (!searchText) return [];

	return contacts.value.filter((contact) =>
		[contact.meno, contact.priezvisko, contact.email].some((field) =>
			(field || "").toLowerCase().includes(searchText.toLowerCase()),
		),
	);
};

const showOffices = ref(false);
const selectedOffice = ref({ id: null, name: "Kancelárie" });

const toggleOffices = () => {
	showOffices.value = !showOffices.value;
};

const selectOffice = (office) => {
	officeStore.setOfficeID = office.id;
	selectedOffice.value = office;
	miesto_stretnutia.value = office.name;
	showOffices.value = false;
};

const handleMiniCalendarDateChange = (newDate) => {
	if (datum_cas.value) {
		const timePart = datum_cas.value.split("T")[1];
		datum_cas.value = `${newDate}T${timePart}`;
	} else {
		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		datum_cas.value = `${newDate}T${hours}:${minutes}`;
	}
};

const updateTime = (time) => {
	if (!time) return;

	if (props.date) {
		const dateObj = new Date(props.date);
		const [hours, minutes] = time.split(":").map(Number);
		dateObj.setHours(hours);
		dateObj.setMinutes(minutes);
		datum_cas.value = format(dateObj, "yyyy-MM-dd'T'HH:mm");
	} else {
		const [hours, minutes] = time.split(":").map(Number);
		const now = new Date();
		now.setHours(hours);
		now.setMinutes(minutes);
		datum_cas.value = format(now, "yyyy-MM-dd'T'HH:mm");
	}

	const addedTime =
		aktivita.value === "Telefonát klient" ||
		aktivita.value === "Telefonát nábor"
			? { minutes: 5 }
			: { hours: 1 };

	const newEnd = add(parseISO(datum_cas.value), addedTime);
	koniec.value = format(newEnd, "yyyy-MM-dd'T'HH:mm");
};

defineExpose({ updateTime });

const active = ref([]);

const setActive = (n) => {
	if (active.value.includes(n)) {
		active.value = active.value.filter((item) => item !== n);
	} else {
		active.value.push(n);
	}
};

const officeActivityId = ref(null);
const deletingOfficeActivity = ref(false);

const findAndDeleteOfficeActivity = async () => {
	if (!datum_cas.value || !koniec.value) {
		toast.error("Najprv vyberte dátum a čas aktivity");
		return;
	}

	deletingOfficeActivity.value = true;
	try {
		const findResponse = await axios.get(
			`${config.public.apiUrl}find-office-activity`,
			{
				params: { datum_cas: datum_cas.value, koniec: koniec.value },
				headers: { Authorization: `Bearer ${authStore.token}` },
			},
		);

		if (!findResponse.data.found) {
			toast.error("Žiadna kancelárska aktivita sa nenašla pre tento čas");
			return;
		}

		await axios.delete(
			`${config.public.apiUrl}office-activities/${findResponse.data.activity.id}`,
			{ headers: { Authorization: `Bearer ${authStore.token}` } },
		);

		selectedOffice.value = { id: null, name: "Kancelárie" };
		officeStore.setOfficeID = null;
		miesto_stretnutia.value = "";

		toast.success("Kancelárska aktivita bola vymazaná");
	} catch (error) {
		console.error("Error deleting office activity:", error);
		toast.error("Chyba pri mazaní kancelárskej aktivity");
	} finally {
		deletingOfficeActivity.value = false;
	}
};
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center z-50"
	>
		<div
			class="absolute inset-0 bg-gray-200 bg-opacity-50 backdrop-blur-sm"
		></div>
		<form
			class="relative bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full z-10 max-h-[100vh] overflow-y-auto"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<!-- Email for online meeting -->
			<div v-if="!emailBool && onlineMeeting" class="mb-4">
				<label class="text-sm text-gray-500">Pridať email ku kontaktu:</label>
				<input
					v-model="email"
					type="email"
					class="w-full mt-2 p-1 bg-gray-100 rounded-lg text-gray-800 pl-2 focus:outline-blue-500 shadow-sm"
					placeholder="Zadajte email ..."
				/>
			</div>

			<!-- ═══ TWO-COLUMN GRID ═══ -->
			<div class="form-grid">
				<!-- col 1: Aktivita -->
				<div class="relative z-0 w-full group">
					<label class="text-sm text-gray-500">Aktivita</label>
					<select
						v-model="aktivita"
						class="w-full bg-gray-100 text-gray-800 rounded-lg p-1 mt-1 shadow-sm"
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
						<option value="welcome seminár">Welcome seminár</option>
						<option value="basic 1">Basic 1</option>
						<option value="basic 2">Basic 2</option>
						<option value="basic 3">Basic 3</option>
						<option value="basic 4">Basic 4</option>
						<option value="Post info">Post info</option>
						<option value="konfirmačný servis">Konfirmačný servis</option>
						<option value="servis">Servis</option>
						<option value="bringer bonus">Bringer bonus</option>
						<option value="káva">Káva</option>
						<option value="porada">Porada</option>
						<option value="vzdelávanie">Vzdelávanie</option>
						<option value="stretnutie na zistenie stavu">
							Stretnutie na zistenie stavu
						</option>
						<option value="súkromné">Súkromné</option>
						<option value="ine">Iné vypíšem sám</option>
					</select>
					<input
						v-model="ina_aktivita"
						type="text"
						v-if="ineBool"
						class="w-full mt-2 p-1 bg-gray-300 rounded-lg text-gray-800 pl-2 focus:outline-blue-500"
						placeholder="Zadajte aktivitu ..."
					/>
				</div>

				<!-- col 2: Importance + Online Meeting -->
				<div class="relative z-0 w-full group">
					<div v-if="onlineMeeting" class="mb-3">
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
					<div class="flex items-center gap-3 mt-2">
						<input
							v-model="onlineMeeting"
							type="checkbox"
							class="bg-gray-300 rounded-lg text-gray-800 focus:outline-blue-500"
							value="true"
						/>
						<label class="text-sm text-gray-500">Online Meeting</label>
						<div
							@click="emailCount++"
							class="cursor-pointer ml-auto"
							title="Pridať ďalší email"
						>
							<Icon
								icon="solar:add-circle-linear"
								class="text-green-500"
								width="22"
								height="22"
							/>
						</div>
						<div
							@click="emailCount--"
							class="cursor-pointer"
							v-if="emailCount > 1"
							title="Odstrániť email"
						>
							<Icon
								icon="solar:minus-circle-linear"
								class="text-red-500"
								width="22"
								height="22"
							/>
						</div>
					</div>
					<div
						v-for="(em, index) in emails.slice(1)"
						:key="index"
						class="relative mt-2"
					>
						<input
							v-model="emails[index + 1]"
							type="email"
							placeholder="Zadajte email ..."
							class="w-full p-1 bg-gray-200 rounded-lg !text-black pl-2 focus:outline-blue-500"
							@focus="activeDropdown = index + 1"
						/>
						<div
							class="w-full bg-gray-200 rounded-lg !text-black flex flex-col p-2 mt-1 max-h-[200px] overflow-y-auto absolute z-50"
							v-if="activeDropdown === index + 1"
						>
							<div
								v-for="contact in filteredContacts(index + 1)"
								:key="contact.id"
								class="my-1 px-2 hover:bg-gray-300 cursor-pointer"
								@click="
									emails[index + 1] = contact.email;
									activeDropdown = null;
								"
							>
								{{ contact.meno }} {{ contact.priezvisko }}
							</div>
						</div>
					</div>
				</div>

				<!-- col 1: Dátum začatia -->
				<div class="relative z-0 w-full group">
					<input
						v-model="datum_cas"
						type="datetime-local"
						step="900"
						class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-10"
						placeholder=" "
					/>
					<span
						class="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none"
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
						class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-10"
						placeholder=" "
					/>
					<span
						class="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none"
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
								d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</span>
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
						class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
						placeholder=" "
					></textarea>
					<label
						class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Poznámka k aktivite
					</label>
				</div>

				<!-- col 1: Miesto stretnutia -->
				<div v-if="!onlineMeeting" class="relative z-0 w-full group">
					<label class="text-sm text-gray-500">Miesto stretnutia</label>
					<input
						v-model="miesto_stretnutia"
						type="text"
						class="w-full mt-2 p-1 bg-gray-100 rounded-lg text-gray-800 pl-2 focus:outline-blue-500 shadow-sm"
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

				<!-- col 1: VDD toggles -->
				<div class="relative z-0 w-full group" v-if="showVDD">
					<label class="text-sm text-gray-500 block mb-2"
						>Volané / Dovolané / Dohodnuté</label
					>
					<div class="flex justify-between px-2">
						<label class="cursor-pointer flex flex-col items-center gap-3">
							<span class="text-sm font-medium text-gray-800">Volané</span>
							<input
								type="checkbox"
								value="1"
								class="sr-only peer"
								v-model="volane"
							/>
							<div
								class="relative w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
							></div>
						</label>
						<label class="cursor-pointer flex flex-col items-center gap-3">
							<span class="text-sm font-medium text-gray-800">Dovolané</span>
							<input
								type="checkbox"
								value="1"
								class="sr-only peer"
								v-model="dovolane"
							/>
							<div
								class="relative w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
							></div>
						</label>
						<label class="cursor-pointer flex flex-col items-center gap-3">
							<span class="text-sm font-medium text-gray-800">Dohodnuté</span>
							<input
								type="checkbox"
								value="1"
								class="sr-only peer"
								v-model="dohodnute"
							/>
							<div
								class="relative w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
							></div>
						</label>
					</div>
				</div>

				<!-- col 2 (or full): Notifications -->
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

				<!-- full: Submit -->
				<div class="flex justify-center items-center span-2 mt-2">
					<button
						@click="addActivity()"
						class="text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center"
					>
						Pridať
					</button>
				</div>
			</div>
			<!-- ═══ END GRID ═══ -->
		</form>
		<AddActivityDay
			v-if="showCalendar"
			:date="dateOnly"
			@updateDate="handleMiniCalendarDateChange"
			@timeClicked="updateTime"
		/>
	</div>
</template>

<style scoped>
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
	filter: invert(0%) !important;
	cursor: pointer;
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
</style>
