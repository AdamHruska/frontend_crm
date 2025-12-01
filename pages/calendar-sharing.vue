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

const showHistory = ref(false);

const menoRef = ref('');
const poziciaRef = ref('');
const emailRef = ref('');
const telRef = ref('');
const textRef = ref('');

onMounted(async () => {
	await userStore.fetchUser();

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

const deleteNotification = async (clientID) => {
	try {
		const response = await axios.post(
				`${config.public.apiUrl}delete-onesignal-id`,
				{
					player_id: clientID,
				},
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
				(id) => id !== clientID
			);
		}
	
	} catch (error) {
		console.error(error);
		toast.error("Nastala chyba pri mazaní notifikácií!");
	}
}
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
		<div class="flex w-full mt-6">
			<!-- First Table -->
			<MyInvitationsTable2 />
			<!-- Second Table -->
			<SharingIvitationsTable3 />
		</div>

		<!-- Third Table -->
		<div class="flex mt-6">
			<SharingTable4 />
			<SharingTable5 />
		</div>
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
   
   
        <table class="w-[400px] text-md bg-white shadow-md rounded mb-4 ml-4 shadow">
            <tbody>
                <tr class="border-b bg-gray-300 ">
                    <th class="text-left p-3 px-5">Zariadenie</th>
                    
                    <th></th>
                </tr>
                <tr v-if="userStore.user && userStore.user.oneSignal_ID" class="border-b " v-for="ClientID in userStore.user.oneSignal_ID">
                    <td class="p-3 px-5"> {{ ClientID.device_name }} </td>
										<td class="p-3 px-5"> {{ ClientID.added_at }} </td>
                    <td class="p-3 px-5 flex justify-end"><button @click="deleteNotification(ClientID)" type="button" class="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Vymazať notifikácie</button></td>
                </tr>
               
                

            </tbody>
        </table>

				<span class="float-right">30.9.2025 aktuálna verzia</span>
		</div>
</template>

<style></style>
