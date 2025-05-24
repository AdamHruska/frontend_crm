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
const emailRef = ref('');
const telRef = ref('');
const textRef = ref('');

onMounted(async () => {
	await userStore.fetchUser();
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
			userStore.user.vizitka_email = vizitka.data.vizitka_email;
			userStore.user.vizitka_phone_num = vizitka.data.vizitka_phone_num;
			userStore.user.vizitka_body = vizitka.data.vizitka_body;
	}
	menoRef.value = userStore.user.vizitka_name;
  emailRef.value = userStore.user.vizitka_email;
  telRef.value = userStore.user.vizitka_phone_num;
	textRef.value = userStore.user.vizitka_body;
});

const menoComputed = computed(() => userStore.user.vizitka_name);
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
</script>

<template>
	<div class="pl-2">
		<div>
			<div
				class="ml-4 mt-16 mb-2 w-[1150px] flex gap-[50px] items-start flex-col"
			>
				<SearchBarSharing class="shadow-md max-w-[475px]" />
				<div class="bg-white p-4 rounded-md shadow-md"> 
					<h3 class="font-semibold text-xl mb-4">Vizitka</h3>
				<div class="flex flex-col gap-4">

					<div class="flex gap-6">
						<label>Text:</label>
						<textarea v-model="textRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1 h-[120px] w-full"> </textarea>
					</div>

					<div class="flex gap-4">
						<label>Meno:</label>
						<input v-model="menoRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>

					<div class="flex gap-4">
						<label>Email:</label>
						<input v-model="emailRef" type="email" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>

					<div class="flex gap-4">
						<label>Tel. č.:</label>
						<input v-model="telRef" type="text" class="bg-white rounded-md border border-blue-500 pl-1"> </input>
					</div>
				</div>
				<button class="bg-blue-600 px-2 py-1 rounded-md mt-2 float-right text-white hover:bg-blue-700" @click="updateVizitka">Upraviť vizitku</button>
				</div>
				
			</div>
		</div>
		<div class="flex w-full mt-6">
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
			<span class="float-right">24.5.2025 aktuálna verzia</span>
		</div>
	</div>
</template>

<style></style>
