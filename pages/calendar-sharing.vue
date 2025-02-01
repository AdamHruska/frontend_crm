<script setup>
const config = useRuntimeConfig();

import axios from "axios";
import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useUserStore } from "#imports";
import RequestsHistoryTable from "~/components/RequestsHistoryTable.vue";
import ToApproveShowingMyCal from "~/components/SharingTable5.vue";
const userStore = useUserStore();

const showHistory = ref(false);

onMounted(async () => {
	await userStore.fetchUser();
});

const logout = async () => {
	const config = useRuntimeConfig();
	const authStore = useAuthStore();
	const token = authStore.token;

	const response = await axios.post(`${config.public.apiUrl}auth/logout`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
};

const clientId = "3eaf604a-c4a7-42d2-b0d9-cc041af68824";
const redirectUri = encodeURIComponent(
	"http://localhost:8000/auth/callbackAzure"
);
const scope = encodeURIComponent(
	"offline_access Calendars.Read Calendars.Read.Shared User.Read Mail.Read OnlineMeetings.Read Calendar.ReadWrite"
);

const loginWithMicrosoft = () => {
	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query`;
	console.log(authUrl);
	window.location.href = authUrl;
};
</script>

<template>
	<div class="pl-2">
		<!-- <div class="flex gap-4 mb-12 items-center text-lg ml-4 mt-6 mb-8">
			<p class="font-semibold">Prihlásený ako:</p>

			<p>Adam</p>
			<p>Hruška</p>
			<button
				@click="logout"
				class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 shadow"
			>
				Odhlásiť
			</button>
		</div> -->
		<!-- Second section -->
		<div>
			<div
				class="ml-4 mt-16 mb-2 w-[1150px] flex gap-[50px] items-start flex-col"
			>
				<!-- <SearchBarSharing
					@updateResults="handleSearchResults"
					class="shadow-md"
				/> -->
				<SearchBarSharing class="shadow-md max-w-[475px]" />
				<!-- <button
					class="flex bg-white px-4 rounded-md shadow hover:bg-slate-100 flex items-center gap-2"
					@click="loginWithMicrosoft"
				>
					<span>Prihlásiť pomocou Microsoft</span>
					<img src="/public/icons8-microsoft-48.png" alt="logo" />
				</button> -->
				<div class="flex items-center gap-4">
					<button
						class="flex bg-white px-4 rounded-md shadow hover:bg-slate-100 flex items-center gap-2"
						@click="loginWithMicrosoft(rememberMe)"
					>
						<span>Prihlásiť pomocou Microsoft</span>
						<img src="/public/icons8-microsoft-48.png" alt="logo" />
					</button>
					<!-- <label class="flex items-center gap-2">
					<input type="checkbox" v-model="rememberMe" class="form-checkbox" />
					<span>Remember Me</span>
				</label> -->
					<button
						@click="logout"
						class="rounded-md bg-red-500 hover:bg-red-600 font-semibold px-2 py-3 text-white shadow-md"
					>
						Odhlásiť z microsoft
					</button>
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
		</div>
	</div>
</template>

<style></style>
