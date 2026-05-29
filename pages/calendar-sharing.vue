<script setup>
const config = useRuntimeConfig();
import { useToast } from "vue-toastification";
const toast = useToast();
import axios from "axios";
import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useUserStore } from "#imports";
import RequestsHistoryTable from "~/components/RequestsHistoryTable.vue";
import ToApproveShowingMyCal from "~/components/SharingTable5.vue";
const userStore = useUserStore();

const autoCreateOutlookEvent = ref(false);

const showHistory = ref(false);

const mailSender = ref('asistent');

const menoRef = ref('');
const poziciaRef = ref('');
const emailRef = ref('');
const telRef = ref('');
const textRef = ref('');
const icsLinkRef = ref('');


const icsCalendars = ref([]);
const newCalendarName = ref('');
const newIcsLink = ref('');

const fetchIcsCalendars = async () => {
  try {
    const response = await axios.get(
      `${config.public.apiUrl}ics-calendars`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    icsCalendars.value = response.data;
  } catch (error) {
    console.error(error);
    toast.error("Nepodarilo sa načítať ICS kalendáre!");
  }
};


// ADD NEW ICS CALENDAR
const addIcsCalendar = async () => {
  try {
    const response = await axios.post(
      `${config.public.apiUrl}ics-calendars`,
      {
        calendar_name: newCalendarName.value,
        ics_link: newIcsLink.value,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    toast.success("ICS kalendár bol pridaný!");
    newCalendarName.value = '';
    newIcsLink.value = '';

    await fetchIcsCalendars();
  } catch (error) {
    console.error(error);
    toast.error("Nepodarilo sa pridať ICS kalendár!");
  }
};


// DELETE ICS CALENDAR
const deleteIcsCalendar = async (id) => {
  try {
    await axios.delete(
      `${config.public.apiUrl}ics-calendars/${id}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    toast.success("ICS kalendár bol odstránený!");
    await fetchIcsCalendars();
  } catch (error) {
    console.error(error);
    toast.error("Nepodarilo sa odstrániť ICS kalendár!");
  }
};

const updateMailSender = async () => {
  try {
    const response = await axios.patch(
      `${config.public.apiUrl}user/mail-sender`,
      { mail_sender: mailSender.value },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      userStore.user.mail_sender = mailSender.value;
      toast.success(
        `Odosielateľ mailov nastavený na: ${
          mailSender.value === 'asistent' ? 'Asistent' : 'Môj Microsoft'
        }`
      );
    }
  } catch (error) {
    console.error(error);
    toast.error("Nastala chyba pri aktualizácii nastavenia mailov!");
  }
};

const updateIcsLink = async () => {
  try {
    const response = await axios.post(
      `${config.public.apiUrl}user/ics-link`,
      {
        ics_link: icsLinkRef.value,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      toast.success("ICS link updated successfully!");
      userStore.user.ics_link = response.data.ics_link;
    }
  } catch (error) {
    console.error(error);
    toast.error("Failed to update ICS link!");
  }
};


onMounted(async () => {
	await userStore.fetchUser();
	mailSender.value = userStore.user.mail_sender || 'asistent';
	autoCreateOutlookEvent.value = userStore.user.auto_create_outlook_event === 1 || 
	                                 userStore.user.auto_create_outlook_event === true;

	console.log("userStore.user", autoCreateOutlookEvent.value);

	// userStore.user.oneSignal_ID.forEach(id => {
  // 	console.log(id);
	// });

	if(!userStore.user.vizitka_name) {
		const vizitka = await axios.get(
				`${config.public.apiUrl}vizitka`,
				{

					headers: {
						Authorization: `Bearer ${authStore.token}`,
						"Content-Type": "application/json",
					},
				}
			);

			userStore.user.vizitka_name = vizitka.data.vizitka_name;
			userStore.user.vizitka_position = vizitka.data.vizitka_position;
			userStore.user.vizitka_email = vizitka.data.vizitka_email;
			userStore.user.vizitka_phone_num = vizitka.data.vizitka_phone_num;
			userStore.user.vizitka_body = vizitka.data.vizitka_body;
	}
	menoRef.value = userStore.user.vizitka_name;
	poziciaRef.value = userStore.user.vizitka_position || '';
  emailRef.value = userStore.user.vizitka_email;
  telRef.value = userStore.user.vizitka_phone_num;
	textRef.value = userStore.user.vizitka_body;
	icsLinkRef.value = userStore.user.ics_link || '';

	await fetchIcsCalendars();
});

const menoComputed = computed(() => userStore.user.vizitka_name);
const poziciaComputed = computed(() => userStore.user.vizitka_position || '');
const emailComputed = computed(() => userStore.user.vizitka_email);
const telComputed = computed(() => userStore.user.vizitka_phone_num);
const textComputed = computed(() => userStore.user.vizitka_body);



const updateVizitka = async () => {
	// toast.success("Operation Successful!");
	try {
		const response = await axios.post(
				`${config.public.apiUrl}update-vizitka`,
				{
					vizitka_name: menoRef.value,
					vizitka_position: poziciaRef.value,
          vizitka_email: emailRef.value,
          vizitka_phone_num: telRef.value,
					vizitka_body: textRef.value,
				},
				{

					headers: {
						Authorization: `Bearer ${authStore.token}`,
						"Content-Type": "application/json",
					},
				}
			);

		if (response.status === 200) {
			toast.success("Vizitka bola úspešne upravená!");
		}
	
	} catch (error) {
		console.error(error);

		// Check if there is a response and an error message
		if (error.response && error.response.data && error.response.data.error) {
			toast.error(error.response.data.error);  // Show the specific error message
		} else {
			toast.error("Nastala chyba pri upravovaní vizitky!");
		}
	}
};

const deleteNotification = async (playerId) => {
  try {
    const response = await axios.post(
      `${config.public.apiUrl}delete-onesignal-id`,
      { player_id: playerId },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      toast.success("Notifikácie boli úspešne vymazané!");
      // Remove the deleted ID from the user store
      userStore.user.oneSignal_ID = userStore.user.oneSignal_ID.filter(
        (idObj) => idObj.player_id !== playerId
      );
    }
  } catch (error) {
    console.error(error);
    toast.error("Nastala chyba pri mazaní notifikácií!");
  }
};



const toggleAutoCreateOutlookEvent = async () => {
    try {
        const response = await axios.patch(
            `${config.public.apiUrl}user/auto-create-outlook-event`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${authStore.token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data.success) {
            autoCreateOutlookEvent.value = response.data.auto_create_outlook_event;
            userStore.user.auto_create_outlook_event = response.data.auto_create_outlook_event;

            toast.success(
                `Automatické vytváranie Outlook eventu ${
                    response.data.auto_create_outlook_event ? "zapnuté" : "vypnuté"
                }`
            );
        }
    } catch (error) {
        console.error(error);
        toast.error("Nastala chyba pri aktualizácii Outlook nastavenia!");
    }
};

const loginWithGoogle = () => {
	const clientId = config.public.GOOGLE_CLIENT_ID;
	const redirectUri = config.public.GOOGLE_REDIRECT_URI;
	const scope = config.public.GOOGLE_SCOPE;
	const userId = userStore.user.id;

	if (!userId) {
		console.error("No user logged in");
		return;
	}

	const state = JSON.stringify({
		userId,
		csrf: authStore.csrfToken,
	});

	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: redirectUri,
		scope,
		access_type: "offline",
		prompt: "consent",
		state,
	});

	window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

const logoutWithGoogle = async () => {
	try {
		const response = await $fetch(`/api/google/logout?userId=${userStore.user.id}`, {
			method: "POST",
		});

		if (response.success) {
			toast.success("Odhlásenie z Google úspešné!");
		} else {
			toast.error("Nepodarilo sa odhlásiť z Google.");
		}
	} catch (error) {
		console.error(error);
		toast.error("Nastala chyba pri odhlasovaní z Google.");
	}
};

const loginWithMicrosoft = () => {
	const clientId = config.public.AZURE_CLIENT_ID;
	const redirectUriRaw = config.public.AZURE_REDIRECT_URI;
	const scope = config.public.AZURE_SCOPE;
	const userId = userStore.user.id;

	if (!userId) {
		console.error("No user logged in");
		return;
	}

	const state = JSON.stringify({
		userId,
		csrf: authStore.csrfToken,
	});

	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUriRaw)}&scope=${encodeURIComponent(scope)}&response_mode=query&state=${encodeURIComponent(state)}`;

	window.location.href = authUrl;
};

const logoutWithMicrosoft = async () => {
	try {
		const response = await axios.post(
			`${config.public.apiUrl}microsoft/logout`,
			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);

		toast.success("Odhlásenie z Microsoft úspešné!");
		location.reload();
	} catch (error) {
		console.error("Microsoft logout failed:", error);
		toast.error("Nastala chyba pri odhlasovaní z Microsoft.");
	}
};

</script>

<template>
	
		<div>
			<div
				class="ml-4 mt-16 mb-2 w-[1150px] flex gap-[50px] items-start flex-col"
			>

				<SearchBarSharing class="shadow-md max-w-[550px]" />
				<div class="bg-white p-4 rounded-md shadow-md"> 
					<h3 class="font-semibold text-xl mb-4">Vizitka</h3>
				<div class="flex flex-col gap-4">

					<div class="flex  justify-between gap-4">
						<label>Text:</label>
						<textarea v-model="textRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1 h-[120px] w-full"> </textarea>
					</div>

					<div class="flex justify-between gap-4">
						<label>Meno:</label>
						<input v-model="menoRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>

					<div class="flex justify-between ">
						<label>Pozícia:</label>
						<input v-model="poziciaRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>

					<div class="flex justify-between">
						<label>Email:</label>
						<input v-model="emailRef" type="email" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>

					<div class="flex  justify-between ">
						<label>Tel. č.:</label>
						<input v-model="telRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>
				</div>
				<button class="bg-blue-600 px-2 py-1 rounded-md mt-2 float-right text-white hover:bg-blue-700" @click="updateVizitka">Upraviť vizitku</button>
				</div>
				
			</div>
		</div>
<div class="mt-16  pt-10 pb-10 bg-white">
			<div class="flex w-full ">
			<MyCalendarShareTable1 :user="userStore.user" class="" />
			<SharingTable6 />
		</div>
		<!-- <div class="flex w-full mt-6">
			<MyInvitationsTable2 />
			<SharingIvitationsTable3 />
		</div> -->

		<!-- Third Table -->
		<!-- <div class="flex mt-6">
			<SharingTable4 />
			<SharingTable5 />
		</div> -->
		<!-- Modified history section -->
		<div class="mt-6">
			<div class="flex items-center mb-4 pl-4">
				<button
					class="py-2 px-2 bg-blue-500 rounded-md font-bold hover:bg-blue-400"
					@click="showHistory = !showHistory"
				>
					{{
						showHistory
							? "Skryť históriu žiadostí"
							: "Zobraziť históriu žiadostí"
					}}
				</button>
				
			</div>
			<div class="w-[67%]"><RequestsHistoryTable v-if="showHistory" /></div>
			
		</div>
</div>


		<!-- Devices table -->
		 
		<div class="w-full ">
			  <h1 class="text-xl mt-12 mb-6 ml-4 font-semibold">
            Notifikácie zariadení
        </h1>
   
   
        <table class="w-[400px] text-md bg-white  rounded mb-4 ml-4 ">
            <tbody>
                <tr class="border-b bg-gray-300 ">
                    <th class="text-left p-3 px-5">Zariadenie</th>
                    <th class="text-left p-3 px-5">Dátum</th>
                   <th></th>
                </tr>
                <tr v-if="userStore.user && userStore.user.oneSignal_ID" class="border-b " v-for="ClientID in userStore.user.oneSignal_ID">
                    <td class="p-3 px-5"> {{ ClientID.device_name }} </td>
										<td class="p-3 px-5"> {{ ClientID.added_at }} </td>
                    <td class="p-3 px-5 flex justify-end"><button @click="deleteNotification(ClientID.player_id)" type="button" class="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Vymazať notifikácie</button></td>
                </tr>
               
                

            </tbody>
        </table>

				<div class="flex items-center gap-4 ml-4 my-16"><span class="font-semibold text-lg">Automaticky vytvárať outlook event: </span>
					<input
        	class="w-4 h-4"
        	type="checkbox"
        	v-model="autoCreateOutlookEvent"
        	@change="toggleAutoCreateOutlookEvent"
    			>
				</div>

				<div class="flex items-center gap-4 ml-4 my-6">
  <span class="font-semibold text-lg">Posielať pozvánky ba online udalosti z mailu:</span>
  <div class="flex items-center gap-6">
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="mailSender"
        value="asistent"
        v-model="mailSender"
        @change="updateMailSender"
        class="w-4 h-4 accent-blue-600"
      />
      <span>Asistent</span>
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="mailSender"
        value="microsoft"
        v-model="mailSender"
        @change="updateMailSender"
        class="w-4 h-4 accent-blue-600"
      />
      <span>Môj Microsoft</span>
    </label>
  </div>
</div>



	<div class="bg-white p-4 mt-4">
  <h3 class="font-semibold text-xl mb-4">Outlook ICS Kalendáre</h3>

  <div class="flex flex-col gap-3 mb-6">
    <div>
      <label>Názov kalendára:</label>
      <input
        v-model="newCalendarName"
        type="text"
        placeholder="Napr. Firemný kalendár"
        class="bg-white rounded-md border border-blue-500 pl-1 w-full"
      />
    </div>

    <div>
      <label>ICS Link:</label>
      <input
        v-model="newIcsLink"
        type="text"
        placeholder="https://outlook.office365.com/.../calendar.ics"
        class="bg-white rounded-md border border-blue-500 pl-1 w-full"
      />
    </div>

    <button
      class="bg-blue-600 px-3 py-2 rounded-md text-white hover:bg-blue-700 w-fit"
      @click="addIcsCalendar"
    >
      Pridať ICS kalendár
    </button>
  </div>

  <div v-if="icsCalendars.length > 0">
    <h4 class="font-semibold mb-2">Vaše kalendáre:</h4>

    <table class="w-full text-sm border rounded-md">
      <thead>
        <tr class="bg-gray-200">
          <th class="p-2 text-left">Názov</th>
          <th class="p-2 text-left">ICS Link</th>
          <th class="p-2 text-right">Akcie</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="calendar in icsCalendars"
          :key="calendar.id"
          class="border-b"
        >
          <td class="p-2">{{ calendar.calendar_name }}</td>
          <td class="p-2 break-all">{{ calendar.ics_link }}</td>
          <td class="p-2 text-right">
            <button
              class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
              @click="deleteIcsCalendar(calendar.id)"
            >
              Vymazať
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="text-gray-500">
    Zatiaľ nemáte pridané žiadne ICS kalendáre.
  </div>
</div>

<!-- Google & Microsoft účty -->
<div class="bg-white p-4 mt-8 rounded-md shadow-md ml-4 max-w-[500px]">
    <h3 class="font-semibold text-xl mb-4">Prepojené účty</h3>

    <div class="flex flex-col gap-3">
        <div class="border-b pb-3">
            <p class="font-semibold text-sm text-gray-500 mb-2">Google</p>
            <div class="flex gap-3">
                <button
                    class="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 border text-sm font-medium"
                    @click="loginWithGoogle"
                >
                    <img src="/public/google_icon.png" class="w-5 h-5" alt="Google" />
                    Prihlásiť sa
                </button>
                <button
                    class="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-medium"
                    @click="logoutWithGoogle"
                >
                    <img src="/public/google_icon.png" class="w-5 h-5" alt="Google" />
                    Odhlásiť sa
                </button>
            </div>
        </div>

        <div class="pt-1">
            <p class="font-semibold text-sm text-gray-500 mb-2">Microsoft</p>
            <div class="flex gap-3">
                <button
                    class="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 border text-sm font-medium"
                    @click="loginWithMicrosoft"
                >
                    <img src="/public/icons8-microsoft-48.png" class="w-5 h-5" alt="Microsoft" />
                    Prihlásiť sa
                </button>
                <button
                    class="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-medium"
                    @click="logoutWithMicrosoft"
                >
                    <img src="/public/icons8-microsoft-48.png" class="w-5 h-5" alt="Microsoft" />
                    Odhlásiť sa
                </button>
            </div>
        </div>
    </div>
</div>

				<span class="float-right">9.2.2026 aktuálna verzia</span>
		</div>
</template>

<style></style>
