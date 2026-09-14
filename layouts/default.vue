<template>
	<div :class="['flex', !isAuthenticated ? 'bg-slate-900' : 'bg-white']">
		<!-- Sidebar -->
		<div
			class="flex flex-col h-screen w-16 overflow-hidden text-gray-400 bg-[#921337] fixed top-0 left-0 nav-shadow"
			v-if="isAuthenticated"
		>
			<!-- Logo or Top Icon -->
			<a class="flex items-center justify-center mt-3" href="/">
				<svg
					class="w-10 h-10 fill-current"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z"
					/>
				</svg>
			</a>

			<!-- Main Navigation Items -->
			<div
				v-if="!isAdmin"
				class="flex flex-col items-center mt-3 border-t border-black border-t-1 flex-grow overflow-y-auto min-h-0 nav-scroll"
			>
				<UTooltip
					text="kontakty"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						to="/"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 hover:rounded hover:scale-[105%] transition-transform"
						:class="{ 'bg-[#cc1d4d] text-gray-200': activeTab === 'home' }"
						@click="setActiveTab('home')"
					>
						<Icon icon="streamline:bullet-list" style="font-size: 22px" />
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Kalendár"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						to="/calendar"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{ 'bg-[#cc1d4d] text-gray-200': activeTab === 'calendar' }"
						@click="setActiveTab('calendar')"
					>
						<Icon icon="streamline:blank-calendar" style="font-size: 22px" />
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Call Lists"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 hover:rounded border-t border-black hover:scale-[105%] transition-transform"
						:class="{ 'bg-[#cc1d4d] text-gray-200': activeTab === 'calls' }"
						to="/callsSecond"
						@click="setActiveTab('calls')"
					>
						<Icon
							icon="ep:phone-filled"
							style="font-size: 22px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					v-if="contactsStore.lastShowenDetails"
					text="Posledný zobrazený kontakt"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						v-if="contactsStore.lastShowenDetails"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 hover:rounded border-t border- border-black hover:scale-[105%] transition-transform"
						:class="{ 'bg-[#cc1d4d] text-gray-200': activeTab === 'detail' }"
						:to="`/contact/${contactsStore.lastShowenDetails}`"
						@click="setActiveTab('detail')"
					>
						<Icon
							icon="pepicons-pencil:person"
							style="font-size: 32px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="ToDo List"
					:ui="{ background: '!bg-white', color: '' }"
					class="mt-auto"
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{ 'bg-[#cc1d4d] text-gray-200': activeTab === 'todo' }"
						to="/todoSecond"
						@click="setActiveTab('todo')"
					>
						<Icon
							icon="material-symbols:event-list"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Kancelárie"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'kancelarie',
						}"
						to="/office"
						@click="setActiveTab('kancelarie')"
					>
						<Icon
							icon="hugeicons:office"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Zrušené udalosti"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'declined-events',
						}"
						to="/declined-events"
						@click="setActiveTab('declined-events')"
					>
						<Icon
							icon="material-symbols:filter-alt"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Štatistika"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 hover:rounded border-t border-black hover:scale-[105%] transition-transform"
						:class="{ 'bg-[#cc1d4d] text-gray-200': activeTab === 'stats' }"
						to="/statistics"
						@click="setActiveTab('stats')"
					>
						<Icon
							icon="simple-icons:soundcharts"
							style="font-size: 22px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Odovzdané kontaky"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'delegovane_kontakty',
						}"
						to="/delegovane-kontakty"
						@click="setActiveTab('delegovane_kontakty')"
					>
						<Icon
							icon="pepicons-pencil:share-android"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Zdielané kontakty"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'shared-contacts',
						}"
						to="/shared-contacts"
						@click="setActiveTab('shared-contacts')"
					>
						<Icon
							icon="material-symbols:share-outline"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Ohrievač"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'ohrievac',
						}"
						to="/ohrievac"
						@click="setActiveTab('ohrievac')"
					>
						<Icon
							icon="material-symbols:calendar-check-outline-sharp"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Kategórie"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'kategorie',
						}"
						to="/categoryThird"
						@click="setActiveTab('kategorie')"
					>
						<Icon
							icon="fluent:task-list-square-ltr-16-regular"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>
			</div>

			<!-- Admin Navigation Items -->
			<div
				v-else
				class="flex flex-col items-center mt-3 border-t border-black border-t-1 flex-grow"
			>
				<UTooltip
					text="Všetci zamestnanci"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'employees',
						}"
						to="/users"
						@click="setActiveTab('employees')"
					>
						<Icon
							icon="pepicons-pencil:people"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Všetky kontakty"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'contacts-all',
						}"
						to="/contacts-all"
						@click="setActiveTab('contacts-all')"
					>
						<Icon
							icon="streamline:bullet-list"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Všetky kancelárie"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'kancelarie',
						}"
						to="/offices-all"
						@click="setActiveTab('kancelarie')"
					>
						<Icon
							icon="hugeicons:office"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Logy prihlásení"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-[#cc1d4d] hover:text-gray-300 hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-[#cc1d4d] text-gray-200': activeTab === 'logs',
						}"
						to="/logs"
						@click="setActiveTab('logs')"
					>
						<Icon
							icon="material-symbols:receipt-long-rounded"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>
			</div>

			<!-- Bottom Navigation Item -->
			<UTooltip
				text="Nastavenia"
				:ui="{ background: '!bg-white', color: '' }"
				class=""
			>
				<NuxtLink
					class="flex items-center justify-center w-16 h-16 mt-auto hover:bg-[#cc1d4d] mb-2 cursor-pointer hover:scale-[105%] transition-transform"
					to="/calendar-sharing"
					@click="setActiveTab('test')"
				>
					<Icon
						icon="material-symbols-light:settings-outline"
						style="font-size: 36px"
						class="text-white"
					/>
				</NuxtLink>
			</UTooltip>

			<UTooltip
				text="Odhlasiť sa"
				:ui="{ background: '!bg-white', color: '' }"
				class=""
			>
				<div
					class="flex items-center justify-center w-16 h-16 mt-auto hover:bg-[#cc1d4d] hover:text-gray-300 mb-2 cursor-pointer hover:scale-[105%] transition-transform border-t border-black"
					@click="showSignOutForm()"
				>
					<Icon
						icon="fa6-solid:circle-arrow-right"
						class="rotate-180"
						style="font-size: 22px"
					/>
				</div>
			</UTooltip>
		</div>

		<!-- Main Content -->
		<div class="flex-1 ml-16 bg-white min-h-screen">
			<div class="relative z-0">
				<slot />
			</div>
		</div>
	</div>

	<SignOutForm
		v-if="showSignOutFormBool"
		@cancelSignOut="showSignOutForm()"
		@confirmSignOut="signOut()"
		class="z-[60]"
	/>
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore";
import { Icon } from "@iconify/vue";
import { useContactsStore, useUserStore, useRequestStore } from "#imports";

const contactsStore = useContactsStore();
const userStore = useUserStore();
const requestStore = useRequestStore();

const authStore = useAuthStore();
authStore.loadLoginState();

const isAuthenticated = computed(() => authStore.isAuthenticated);

const showSignOutFormBool = ref(false);
const activeTab = ref("");

function setActiveTab(tab) {
	activeTab.value = tab;
}

function showSignOutForm() {
	showSignOutFormBool.value = !showSignOutFormBool.value;
}

function signOut() {
	console.log("signed out");
}

onMounted(async () => {
	setActiveTab("home");
	await requestStore.fetchLetThemViewMineForApproval();
	await requestStore.fetchLetThemViewMineTabulka5();
});

// Načítať usera pred renderom
onBeforeMount(async () => {
	await userStore.fetchUser();
});

const isAdmin = computed(() => {
	const user = userStore.user;
	if (!user) return false;
	return (
		user.first_name === "admin" &&
		user.last_name === "admin" &&
		user.email === "admin@admin.com"
	);
});
</script>

<style>
* {
	font-family: "Inter", sans-serif;
	color: black;
}

.text-white {
	color: white !important;
}

/* Force gray text to black — preserves explicitly colored text */
.text-gray-50,
.text-gray-100,
.text-gray-200,
.text-gray-300,
.text-gray-400,
.text-gray-500,
.text-gray-600,
.text-gray-700,
.text-gray-800,
.text-gray-900 {
	color: black !important;
}

/* Add these new styles */
:deep(.table-container) {
	position: relative;
	z-index: 0;
	overflow-x: auto;
}

:deep(.udropdown) {
	z-index: 40;
}

.nav-shadow {
	box-shadow: 4px 0 10px rgba(0, 0, 0, 0.4);
}

.nav-shadow {
	box-shadow: 4px 0 10px rgba(0, 0, 0, 0.4);
}

/* Sidebar scrollbar */
.nav-scroll::-webkit-scrollbar {
	width: 4px;
}

.nav-scroll::-webkit-scrollbar-track {
	background: transparent;
}

.nav-scroll::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.35);
	border-radius: 10px;
}

.nav-scroll::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.6);
}

/* ══════════════════════════════════════════════════════════
   FULLCALENDAR — mobile responsive (global unscoped)
══════════════════════════════════════════════════════════ */

@media (max-width: 768px) {
	/* Toolbar */
	.fc-toolbar {
		flex-wrap: wrap !important;
		gap: 6px !important;
		padding: 6px !important;
	}

	.fc-toolbar-title {
		font-size: 14px !important;
	}

	.fc-button {
		padding: 4px 8px !important;
		font-size: 12px !important;
	}

	/* Time grid */
	.fc-timegrid-axis {
		width: 42px !important;
	}

	.fc-timegrid-slot-label-cushion {
		font-size: 10px;
	}

	.fc-timegrid-slot {
		height: 36px;
	}

	/* Events */
	.fc-timegrid-event .fc-event-main {
		padding: 1px 3px;
		font-size: 11px;
		line-height: 1.25;
	}

	.fc-timegrid-event {
		border-radius: 3px;
	}

	/* Day grid */
	.fc-daygrid-day {
		padding: 2px;
	}

	.fc-daygrid-day-number {
		font-size: 12px;
		padding: 4px 6px;
	}

	.fc-daygrid-more-link {
		font-size: 11px;
		padding: 2px 6px;
	}

	.fc-event-title {
		font-size: 11px;
	}

	.fc-event-time {
		font-size: 10px;
	}

	/* Headers */
	.fc-col-header-cell {
		padding: 6px 0;
	}

	.fc-col-header-cell-cushion {
		font-size: 11px;
		padding: 2px 4px;
	}

	/* Scrollable time grid */
	.fc-timegrid {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	/* Touch targets */
	.fc-event {
		min-height: 22px;
	}

	.fc-view-harness {
		min-height: 400px;
	}
}

@media (max-width: 480px) {
	.fc-toolbar {
		flex-direction: column !important;
		align-items: flex-start !important;
		gap: 4px !important;
	}

	.fc-toolbar-chunk {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
	}

	.fc-toolbar-title {
		font-size: 13px !important;
	}

	.fc-button {
		padding: 3px 6px !important;
		font-size: 11px !important;
	}

	.fc-timegrid-axis {
		width: 34px !important;
	}

	.fc-timegrid-slot-label-cushion {
		font-size: 9px;
	}

	.fc-timegrid-slot {
		height: 30px;
	}

	.fc-timegrid-event .fc-event-main {
		font-size: 10px;
		padding: 0 2px;
	}

	.fc-daygrid-day-number {
		font-size: 11px;
		padding: 3px 4px;
	}

	.fc-col-header-cell-cushion {
		font-size: 10px;
	}

	.fc-event-title {
		font-size: 10px;
	}

	.fc-event-time {
		font-size: 9px;
	}

	.fc-daygrid-day-frame {
		min-height: 24px;
	}

	.fc-timegrid {
		overflow-x: scroll;
	}
}
</style>
