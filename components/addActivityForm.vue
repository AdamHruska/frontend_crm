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

// show volane dovolane dohodnute
const showVDD = ref(false);

const contact = ref([]);

const aktivita = ref("");
const ina_aktivita = ref("");
const datum_cas = ref("");
const koniec = ref("");
const poznamka = ref("");
const volane = ref("");
const dovolane = ref("");
const dohodnute = ref("");
const ineBool = ref(false);
const miesto_stretnutia = ref("");
const onlineMeeting = ref(false);

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

	// Set koniec based on aktivita
	const addedTime =
		aktivita.value === "Telefonát klient" ? { minutes: 5 } : { hours: 1 };

	const newEnd = add(parseISO(newValue), addedTime);
	koniec.value = format(newEnd, "yyyy-MM-dd'T'HH:mm");

	// Set dateOnly
	dateOnly.value = format(new Date(datum_cas.value), "yyyy-MM-dd");
	dateOnly.value = String(dateOnly.value);

	// Show calendar after 1 manual change
	if (manualChangeCount.value > 1) {
		showCalendar.value = true;
	}

	manualChangeCount.value = 10;
});

onBeforeMount(async () => {
	officeStore.fetchOffices();
	officeStore.fetchOfficesSharedWithMe();
	userStore.fetchUser();

	const response = await findPerson(props.contact_id);
	if (contact.value[0]?.email) {
		emailBool.value = true;
	}

	// Initialize `datum_cas` with the current local time in ISO format
	const now = new Date();
	datum_cas.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
		2,
		"0"
	)}-${String(now.getDate()).padStart(2, "0")}T${String(
		now.getHours()
	).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	const startPlusHour = add(datum_cas.value, { hours: 1 });
	koniec.value = format(startPlusHour, "yyyy-MM-dd'T'HH:mm");

	const response2 = await axios.get(`${config.public.apiUrl}all-contacts`, {
		headers: {
			Authorization: `Bearer ${authStore.token}`,
		},
	});
	contacts.value = await response2.data.contacts;
});

const findPerson = async (id) => {
	try {
		const response = await axios.get(`${config.public.apiUrl}contact/${id}`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
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

	// Validate email for online meetings
	if (onlineMeeting.value) {
		const hasEmail =
			emailBool.value || (email.value && email.value.trim() !== "");
		if (!hasEmail) {
			toast.error("Pre online stretnutie je potrebné zadať email", {
				position: "top-right",
				timeout: 5000,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				draggablePercent: 60,
				showCloseButtonOnHover: false,
				hideProgressBar: false,
			});
			return; // Stop execution if validation fails
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
			//dovolane.value = true;
			//dohodnute.value = true;
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
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);

		if (response.data.status === 201) {
			toast.success("Aktivita bola úspešne pridaná", {
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

		// Update email if needed
		if (!emailBool.value && onlineMeeting.value && email.value) {
			await axios.patch(
				`${config.public.apiUrl}contact/${props.contact_id}/email`,
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

		if (onlineMeeting.value) {
			try {
				const teamsResponse = await axios.post(
					`${config.public.apiUrl}create-teams-meeting`,
					{ activityId: response.data.activity.id, user_id: userStore.user.id },
					{ headers: { Authorization: `Bearer ${authStore.token}` } }
				);

				if (teamsResponse.data.joinUrl) {
					response.data.activity.miesto_stretnutia = teamsResponse.data.joinUrl;
				}
			} catch (error) {
				console.error("Error creating Teams meeting:", error);
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

		if (selectedOffice.value.name !== "Kancelárie") {
			//tu spravit office aktivitu

			const datumCasDate = new Date(datum_cas.value);
			datumCasDate.setHours(datumCasDate.getHours() + 2);

			const koniecDate = new Date(koniec.value);
			koniecDate.setHours(koniecDate.getHours() + 2);

			const newActivity = {
				aktivita:
					aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
				datum_cas: datumCasDate.toISOString(),
				koniec: koniecDate.toISOString(),
				poznamka: poznamka.value,
				office_id: officeStore.setOfficeID,
				owner_number: userStore.user.vizitka_phone_num,
			};

			await officeStore.storeActivity(newActivity);
		}

		calendarStore.activities.push(response.data.activity);

		emit("activityAdded", response.data.activity);
		emit("cancelAddActivity");
	} catch (error) {
		console.error("Error adding activity:", error);
		toast.error("Chyba pri pridávaní aktivity", {
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

const handleMiniCalendarDateChange = (newDate) => {
	// Format date to match your input field (yyyy-MM-ddTHH:mm)
	const formatted = format(new Date(newDate), "yyyy-MM-dd'T'HH:mm");
	datum_cas.value = formatted;
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
			class="relative bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>
			<div v-if="!emailBool && onlineMeeting">
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Pridať email ku kontaktu:
				</label>
				<input
					v-model="email"
					type="email"
					class="w-full mt-3 p-1 bg-gray-100 rounded-lg text-gray-800 pl-2 focus:outline-blue-500 shadow-sm"
					placeholder="Zadajte email ..."
				/>
			</div>
			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita</label
				>
				<select
					v-model="aktivita"
					id="floating_aktivita"
					class="w-full bg-gray-100 text-gray-800 rounded-lg p-1 mt-1 shadow-sm"
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
					<option value="welcome seminár">Welcome seminár</option>
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
					<option value="ine">Iné vypíšem sám</option>
				</select>
				<input
					v-model="ina_aktivita"
					type="text"
					v-if="ineBool"
					class="w-full mt-3 p-1 bg-gray-300 rounded-lg text-gray-800 pl-2 focus:outline-blue-500"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<div class="relative z-0 w-full mb-2 group">
				<input
					v-model="onlineMeeting"
					type="checkbox"
					class="bg-gray-300 rounded-lg text-gray-800 pl-2 focus:outline-blue-500 mr-4"
					value="true"
				/>
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Online Meeting</label
				>
			</div>

			<div class="flex gap-3 mb-6 items-center">
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

			<div class="max-h-[550px] overflow-y-auto">
				<div
					class="relative w-full mb-2 group"
					v-for="(email, index) in emails.slice(1)"
					:key="index"
				>
					<input
						v-model="emails[index + 1]"
						type="email"
						placeholder="Zadajte email ..."
						class="w-full p-1 bg-gray-200 rounded-lg text-white pl-2 focus:outline-blue-500 !text-black z-20"
						required
						@focus="activeDropdown = index + 1"
					/>
					<div
						class="w-full bg-gray-200 rounded-lg !text-black flex flex-col p-2 mt-1 max-h-[400px] overflow-y-auto absolute z-[100] overflow-visible"
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

			<div class="relative z-0 w-full mb-5 mt-6 group">
				<input
					v-model="datum_cas"
					type="datetime-local"
					step="900"
					name="datum_cas"
					id="floating_datum_cas"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
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
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
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
					id="floating_poznamka"
					rows="3"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				></textarea>
				<label
					for="floating_poznamka"
					class="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Poznámka k aktivite</label
				>
			</div>

			<div v-if="!onlineMeeting" class="relative z-0 w-full mb-5 group">
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Miesto stretnutia</label
				>
				<input
					v-model="miesto_stretnutia"
					type="text"
					class="w-full mt-3 p-1 bg-gray-100 rounded-lg text-gray-800 pl-2 focus:outline-blue-500 shadow-sm"
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
			</div>

			<div class="flex justify-between px-12 pb-4" v-if="showVDD">
				<label class="cursor-pointer flex flex-col items-center gap-4">
					<span class="ms-3 text-sm font-medium text-gray-800">Volané</span>
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

				<div>
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span class="ms-3 text-sm font-medium text-gray-800">Dovolané</span>
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
				</div>

				<div>
					<label class="cursor-pointer flex flex-col items-center gap-4">
						<span class="ms-3 text-sm font-medium text-gray-800"
							>Dohodnuté</span
						>
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
			<div class="flex justify-center items-center mt-3">
				<button
					@click="addActivity()"
					class="text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center"
				>
					Pridať
				</button>
			</div>
		</form>
		<AddActivityDay
			v-if="showCalendar"
			:date="dateOnly"
			@updateDate="handleMiniCalendarDateChange"
		/>
	</div>
</template>

<style></style>
