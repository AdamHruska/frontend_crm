<script setup>
import { Icon } from "@iconify/vue";
import axios from "axios";
import { format, parseISO, add } from "date-fns";

const config = useRuntimeConfig();

import { useCalendarstore } from "#imports";
const calendarStore = useCalendarstore();
import { useUserStore } from "#imports";
const userStore = useUserStore();
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();
import { useToast } from "vue-toastification";
const toast = useToast();
const props = defineProps({
	end_date: String,
});

import { useOfficeStore } from "#imports";
const officeStore = useOfficeStore();

const emailCount = ref(0);
const emails = ref([]);

// show volane dovolane dohodnute
const showVDD = ref(false);

const contacts = ref([]);
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
const dohodnute = ref("");
const ineBool = ref(false);
const miesto_stretnutia = ref("");
const onlineMeeting = ref(false);

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

// watch(aktivita, (newValue) => {
// 	if (newValue === "ine") {
// 		ineBool.value = true;
// 	} else {
// 		ineBool.value = false;
// 	}
// });

watch(aktivita, (newValue) => {
	// Show/hide extra field
	ineBool.value = newValue === "ine";

	// If aktivita is "Telefonát klient", set koniec to datum_cas + 5 minutes
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

const formatDateToISO = (dateString) => {
	// Parse the date string into a Date object
	const date = parseISO(dateString); // This will handle 'yyyy-MM-dd' format

	// Format the date to the desired format (YYYY-MM-DDTHH:mm)
	const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm"); // or "yyyy-MM-dd'T'HH:mm:ss" for seconds

	return formattedDate;
};

// watch(datum_cas, (newValue) => {
// 	const startPlusHour = add(parseISO(newValue), { hours: 1 });
// 	koniec.value = format(startPlusHour, "yyyy-MM-dd'T'HH:mm");
// });

watch(datum_cas, (newValue) => {
	if (!newValue) return;

	let newEndTime;

	if (aktivita.value === "Telefonát klient") {
		newEndTime = add(parseISO(newValue), { minutes: 5 });
	} else {
		newEndTime = add(parseISO(newValue), { hours: 1 });
	}

	koniec.value = format(newEndTime, "yyyy-MM-dd'T'HH:mm");
});

onMounted(async () => {
	officeStore.fetchOffices();
	officeStore.fetchOfficesSharedWithMe();
	userStore.fetchUser();

	officeStore.getallOfficeActivites();

	emails.value = [""];
	console.log(email.value);
	// Set initial datum_cas to props.end_date
	datum_cas.value = formatDateToISO(props.end_date);

	// Set koniec to props.end_date + 1 hour
	// const endDate = parseISO(props.end_date);
	// const endDatePlusHour = add(endDate, { hours: 1 });
	const startPlusHour = add(datum_cas.value, { hours: 1 });
	koniec.value = format(startPlusHour, "yyyy-MM-dd'T'HH:mm");

	const response2 = await axios.get(`${config.public.apiUrl}all-contacts`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	contacts.value = await response2.data.contacts;
});
const id = ref("");
watch(kontakt, async (newValue) => {
	console.log("teraz");
	id.value = getIdFromString(newValue);
	const responseContact = await axios.get(
		`${config.public.apiUrl}contact/${id.value}`,
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	contact.value = responseContact.data.contact;
	email.value = contact.value.email;
	console.log("contact:", contact.value.email);
});

const emit = defineEmits(["cancelAddActivity", "activityAdded", "addNewEvent"]);

const cancelActivity = () => {
	emit("cancelAddActivity");
};

function getIdFromString(str) {
	const words = str.split(" ");
	return words[words.length - 1];
}

// const addActivity = async () => {
// 	changeLoadingState();
// 	event.preventDefault();

// 	// if (!email.value) {
// 	// 	alert("Kontakt nemá email, pridajte email");
// 	// 	changeLoadingState();
// 	// 	return;
// 	// }

// 	try {
// 		// Store the first response in a separate variable
// 		const activityResponse = await axios.post(
// 			`${config.public.apiUrl}add-activity`,
// 			{
// 				contact_id: getIdFromString(kontakt.value),
// 				aktivita:
// 					aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
// 				datumCas: datum_cas.value,
// 				koniec: koniec.value,
// 				poznamka: poznamka.value,
// 				volane: volane.value,
// 				dovolane: dovolane.value,
// 				dohodnute: dohodnute.value,
// 				miesto_stretnutia: miesto_stretnutia.value,
// 				online_meeting: onlineMeeting.value,
// 			},
// 			{
// 				headers: {
// 					Authorization: `Bearer ${authStore.token}`,
// 				},
// 			}
// 		);

// 		if (activityResponse.data.status === 201) {
// 			toast.success("Aktivita bola úspešne pridaná", {
// 				position: "top-right",
// 				timeout: 5000,
// 				closeOnClick: true,
// 				pauseOnHover: true,
// 				draggable: true,
// 				draggablePercent: 60,
// 				showCloseButtonOnHover: false,
// 				hideProgressBar: false,
// 			});
// 		} else {
// 			toast.error("Chyba pri pridávaní aktivity", {
// 				position: "top-right",
// 				timeout: 5000,
// 				closeOnClick: true,
// 				pauseOnHover: true,
// 				draggable: true,
// 				draggablePercent: 60,
// 				showCloseButtonOnHover: false,
// 				hideProgressBar: false,
// 			});
// 		}

// 		// Update email if needed
// 		if (!emailBool.value) {
// 			console.log("Adding email to contact:", email.value);
// 			await axios.patch(
// 				`${config.public.apiUrl}contact/${id.value}/email`,
// 				{
// 					email: email.value,
// 				},
// 				{
// 					headers: {
// 						Authorization: `Bearer ${authStore.token}`,
// 					},
// 				}
// 			);
// 		}
// 		// Create Teams meeting if online meeting is selected
// 		if (onlineMeeting.value) {
// 			try {
// 				const teamsResponse = await axios.post(
// 					`${config.public.apiUrl}create-teams-meeting`,
// 					{ activityId: activityResponse.data.activity.id },
// 					{ headers: { Authorization: `Bearer ${authStore.token}` } }
// 				);

// 				console.log("Teams meeting created:", teamsResponse.data);

// 				// Update the activity with the meeting URL if needed
// 				if (teamsResponse.data.joinUrl) {
// 					activityResponse.data.activity.miesto_stretnutia =
// 						teamsResponse.data.joinUrl;
// 				}
// 			} catch (error) {
// 				console.error(
// 					"Error creating Teams meeting:",
// 					error.response?.data || error.message
// 				);
// 				// Consider showing an error message to the user here
// 			}
// 		}

// 		// Update the calendar store
// 		calendarStore.activities.push(activityResponse.data.activity);

// 		// Emit events
// 		emit("activityAdded", activityResponse.data.activity);
// 		emit("addNewEvent", activityResponse.data.activity);
// 		emit("cancelAddActivity");
// 	} catch (error) {
// 		console.error("Error adding activity:", error);
// 		alert(
// 			"Nastala chyba pri pridaní aktivity: " +
// 				(error.response?.data?.error || error.message)
// 		);
// 	}

// 	changeLoadingState();
// };

const addActivity = async () => {
	changeLoadingState();
	event.preventDefault();

	// Validate emails - filter out empty strings
	const validEmails = emails.value.filter(
		(email) => email && email.trim() !== ""
	);

	// Check if online meeting is selected and no valid emails provided
	if (onlineMeeting.value && validEmails.length === 0) {
		toast.error("Pre online stretnutie je potrebné zadať aspoň jeden email", {
			position: "top-right",
			timeout: 5000,
		});
		changeLoadingState();
		return;
	}

	try {
		if (selectOffice.value !== "Kancelárie") {
			selectOffice.value = miesto_stretnutia.value;
		}

		const activityResponse = await axios.post(
			`${config.public.apiUrl}add-activity`,
			{
				contact_id: getIdFromString(kontakt.value),
				aktivita:
					aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
				datumCas: datum_cas.value,
				koniec: koniec.value,
				poznamka: poznamka.value,
				volane: volane.value,
				dovolane: dovolane.value,
				dohodnute: dohodnute.value,
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

		if (activityResponse.data.status === 201) {
			toast.success("Aktivita bola úspešne pridaná", {
				position: "top-right",
				timeout: 5000,
			});
		}

		// Update email for contact if primary email is provided and online meeting
		if (onlineMeeting.value && !emailBool.value && emails.value[0]) {
			console.log("Adding email to contact:", emails.value[0]);
			await axios.patch(
				`${config.public.apiUrl}contact/${id.value}/email`,
				{
					email: emails.value[0],
				},
				{
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				}
			);
		}

		// Create Teams meeting if online meeting is selected
		if (onlineMeeting.value) {
			try {
				const teamsResponse = await axios.post(
					`${config.public.apiUrl}create-teams-meeting`,
					{
						activityId: activityResponse.data.activity.id,
						user_id: userStore.user.id,
						additionalEmails: validEmails.slice(1),
						importance: importance.value,
					},
					{ headers: { Authorization: `Bearer ${authStore.token}` } }
				);

				console.log("Teams meeting created:", teamsResponse.data);

				if (teamsResponse.data.joinUrl) {
					activityResponse.data.activity.miesto_stretnutia =
						teamsResponse.data.joinUrl;
				}
			} catch (error) {
				console.error(
					"Error creating Teams meeting:",
					error.response?.data || error.message
				);
				toast.error("Je potrebné prihlásiť sa do Microsoft účtu");
			}
		}

		if (selectOffice.value !== "Kancelárie") {
			//tu spravit office aktivitu

			const datumCasDate = new Date(datum_cas.value);
			datumCasDate.setHours(datumCasDate.getHours());

			const koniecDate = new Date(koniec.value);
			koniecDate.setHours(koniecDate.getHours());

			const newActivity = {
				aktivita:
					aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
				importance: importance.value,
				datum_cas: datumCasDate.toISOString(),
				koniec: koniecDate.toISOString(),
				poznamka: poznamka.value,
				office_id: officeStore.setOfficeID,
				owner_number: userStore.user.vizitka_phone_num,
			};

			await officeStore.storeActivity(newActivity);
		}

		calendarStore.activities.push(activityResponse.data.activity);
		emit("activityAdded", activityResponse.data.activity);
		emit("addNewEvent", activityResponse.data.activity);
		emit("cancelAddActivity");
	} catch (error) {
		console.error("Error adding activity:", error);
		alert(
			"Nastala chyba pri pridaní aktivity: " +
				(error.response?.data?.error || error.message)
		);
	}

	changeLoadingState();
};

const handleSelectedContact = (contact) => {
	kontakt.value = `${contact.meno} ${contact.priezvisko} ${contact.id}`;
	id.value = contact.id;
	email.value = contact.email;
};

const loadingState = ref(false);

const changeLoadingState = () => {
	loadingState.value = !loadingState.value;
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
		// Add new empty email
		emails.value.push("");
	} else if (newCount < oldCount && newCount > 0) {
		// Remove last email
		emails.value.pop();
	} else if (newCount === 0) {
		// Reset to one empty email
		emails.value = [""];
	}
});

// Add this watcher to sync the single email input with the emails array
watch(onlineMeeting, (newValue) => {
	if (newValue) {
		// When online meeting is enabled, set the first email in array to the single email value
		emails.value[0] = email.value;
	}
});

const activeDropdown = ref(null);

const filteredContacts = (index) => {
	const searchText = emails.value[index] || ""; // fallback if null/undefined
	if (!searchText) return [];

	return contacts.value.filter((contact) =>
		[contact.meno, contact.priezvisko, contact.email].some((field) =>
			(field || "").toLowerCase().includes(searchText.toLowerCase())
		)
	);
};

const showOffices = ref(false);
const selectedOffice = ref({ id: null, name: "Kancelárie" }); // default text

const toggleOffices = () => {
	showOffices.value = !showOffices.value;
};

const selectOffice = (office) => {
	officeStore.setOfficeID = office.id;
	selectedOffice.value = office;
	showOffices.value = false; // close dropdown after selection
};

const active = ref([]);

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
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<loadigcomponent v-if="loadingState" />
		<form
			class="relative bg-white bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<label
				class="text-sm text-black duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>Kontakt</label
			>
			<!-- <select
				v-model="kontakt"
				id="floating_aktivita"
				class="w-full bg-gray-700 text-white rounded-lg p-1 mt-1 mb-2"
			>
				<option v-for="contact in contacts">
					{{ contact.meno }} {{ contact.priezvisko }}
					<span class="invisible">{{ contact.id }}</span>
				</option>
			</select> -->

			<EventSearch
				:contactsProp="contacts"
				@selectedContact="handleSelectedContact"
				class="z-30"
			/>

			<div v-if="onlineMeeting">
				<label
					class="text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Pridať email ku kontaktu:
				</label>
				<input
					v-model="emails[0]"
					type="email"
					class="w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500 !text-black"
					placeholder="Zadajte email ..."
					required
				/>
			</div>
			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
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
					<option value="poradenstvo">Poradenstvo</option>
					<option value="realizácia">realizácia</option>
					<option value="welcome seminar">Welcome seminár</option>
					<option value="basic 1">Basic 1</option>
					<option value="basic 2">Basic 2</option>
					<option value="basic 3">Basic 3</option>
					<option value="basic 4">Basic 4</option>
					<option value="Post info">Post info</option>
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
					class="w-full mt-3 p-1 bg-slate-700 rounded-lg text-white pl-2 focus:outline-blue-500"
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

			<div class="relative z-0 w-full mb-1 group">
				<input
					v-model="onlineMeeting"
					type="checkbox"
					class="bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500 mr-4"
					value="true"
				/>
				<label
					class="text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 !text-black"
					>Online Meeting</label
				>
			</div>

			<div class="flex gap-3 mb-3 items-center">
				<!-- Add Email Button -->
				<div
					@click="emailCount++"
					class="cursor-pointer transition-all duration-200 hover:scale-110"
					title="Pridať ďalší email"
				>
					<Icon
						icon="solar:add-circle-linear"
						class="text-green-500 hover:text-green-600"
						width="24"
						height="24"
					/>
				</div>

				<!-- Remove Email Button (only shows when emailCount > 1) -->
				<div
					@click="emailCount--"
					class="cursor-pointer transition-all duration-200 hover:scale-110"
					v-if="emailCount > 1"
					title="Remove last email"
				>
					<Icon
						icon="solar:minus-circle-linear"
						class="text-red-500 hover:text-red-600"
						width="24"
						height="24"
					/>
				</div>
			</div>

			<div class="max-h-[150px] overflow-y-auto">
				<div
					class="relative z-20 w-full mb-2 group"
					v-for="(email, index) in emails.slice(1)"
					:key="index"
				>
					<input
						v-model="emails[index + 1]"
						type="email"
						placeholder="Zadajte email ..."
						class="w-full p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500 !text-black z-10"
						required
						@focus="activeDropdown = index + 1"
					/>
					<div
						class="w-full bg-gray-200 rounded-lg !text-black flex flex-col p-2 mt-1 max-h-[400px] overflow-y-auto"
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

			<div class="relative z-0 w-full mb-5 mt-5 group">
				<input
					v-model="datum_cas"
					type="datetime-local"
					step="900"
					name="datum_cas"
					id="floating_datum_cas"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-200 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text- dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
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

			<div class="relative z-0 w-full mb-5 group" v-if="!onlineMeeting">
				<label
					class="text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Miesto stretnutia</label
				>
				<input
					v-model="miesto_stretnutia"
					type="text"
					class="!text-black w-full mt-3 p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500"
					placeholder="Zadajte miesto stretnutia ..."
				/>
			</div>

			<!-- <div class="relative z-0 w-full mb-5 group">
				
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
							v-for="office in [
								...officeStore.offices,
								...officeStore.officesSharedWithMe,
							]"
							:key="office"
							@click="selectOffice(office)"
							class="hover:bg-gray-300 my-0 p-2 rounded-sm"
						>
							{{ office.name }}
						</li>
					</ul>
				</div>
			</div> -->

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
						class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
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
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
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
							class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
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

			<div class="flex justify-center items-center mt-3">
				<button
					@click="addActivity()"
					class="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
				>
					Pridať
				</button>
			</div>
		</form>
	</div>
</template>
