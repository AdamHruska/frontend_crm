<template>
	<div :class="['flex', !isAuthenticated ? 'bg-slate-900' : '']">
		<!-- Sidebar -->
		<div
			class="flex flex-col h-screen w-16 overflow-hidden text-gray-400 bg-blue-800 fixed top-0 left-0 nav-shadow"
			v-if="isAuthenticated"
			style="z-index: 999"
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
				class="flex flex-col items-center mt-3 border-t border-black border-t-1 flex-grow"
			>
				<UTooltip
					text="kontakty"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						to="/"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded hover:scale-[105%] transition-transform"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'home' }"
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'calendar' }"
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded border-t border-black hover:scale-[105%] transition-transform"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'calls' }"
						to="/calls"
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
					text="Štatistika"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded border-t border-black hover:scale-[105%] transition-transform"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'stats' }"
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
					v-if="contactsStore.lastShowenDetails"
					text="Posledný zobrazený kontakt"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						v-if="contactsStore.lastShowenDetails"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded border-t border-black hover:scale-[105%] transition-transform"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'detail' }"
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
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'todo' }"
						to="/todo"
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
					text="Presunuté kontaky"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'delegovane_kontakty',
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
					text="Kancelárie"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'kancelarie',
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'declined-events',
						}"
						to="/declined-events"
						@click="setActiveTab('declined-events')"
					>
						<Icon icon="ic:close" style="font-size: 36px" class="text-white" />
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Odovzdané kontaky"
					:ui="{ background: '!bg-white', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'delegovane_kontakty',
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'shared-contacts',
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'employees',
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'contacts-all',
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'kancelarie',
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
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded hover:scale-[105%] transition-transform"
						:class="{
							'bg-blue-700 text-gray-200': activeTab === 'logs',
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
					class="flex items-center justify-center w-16 h-16 mt-auto hover:bg-blue-700 mb-2 cursor-pointer hover:scale-[105%] transition-transform"
					:class="{
						'bg-blue-700 text-gray-200': activeTab === 'test',
						'bg-red-600 hover:bg-red-700':
							requestStore.viewTheirCalendarForApproval.length > 0 ||
							requestStore.letThemViewMineTabulka.length > 0,
					}"
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
					class="flex items-center justify-center w-16 h-16 mt-auto hover:bg-blue-600 hover:text-gray-300 mb-2 cursor-pointer hover:scale-[105%] transition-transform border-t border-black"
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
		<div class="flex-1 ml-16">
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

<style scoped>
* {
	font-family: "Inter", sans-serif;
	color: aliceblue !important;
}

.text-white {
	color: white !important;
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
</style>
