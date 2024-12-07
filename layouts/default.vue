<template>
	<div :class="['flex', !isAuthenticated ? 'bg-slate-900' : '']">
		<!-- Sidebar -->
		<div
			class="flex flex-col h-screen w-16 overflow-hidden text-gray-400 bg-blue-800 fixed top-0 left-0 nav-shadow"
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
				class="flex flex-col items-center mt-3 border-t border-black border-t-1 flex-grow"
			>
				<UTooltip text="kontakty" :ui="{ background: '', color: '' }" class="">
					<NuxtLink
						to="/"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'home' }"
						@click="setActiveTab('home')"
					>
						<Icon icon="streamline:bullet-list" style="font-size: 22px" />
					</NuxtLink>
				</UTooltip>

				<UTooltip text="Kalendár" :ui="{ background: '', color: '' }" class="">
					<NuxtLink
						to="/calendar"
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'calendar' }"
						@click="setActiveTab('calendar')"
					>
						<Icon icon="streamline:blank-calendar" style="font-size: 22px" />
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Zdielanie Kalendára"
					:ui="{ background: '', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 border-t border-black hover:rounded"
						:class="{ 'bg-blue-700 text-gray-200': activeTab === 'test' }"
						to="/calendar-sharing"
						@click="setActiveTab('test')"
					>
						<Icon
							icon="pepicons-pencil:people"
							style="font-size: 36px"
							class="text-white"
						/>
					</NuxtLink>
				</UTooltip>

				<UTooltip
					text="Call Lists"
					:ui="{ background: '', color: '' }"
					class=""
				>
					<NuxtLink
						class="flex items-center justify-center w-12 h-12 mt-2 hover:bg-blue-600 hover:text-gray-300 hover:rounded border-t border-black"
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
			</div>

			<!-- Bottom Navigation Item -->
			<div
				class="flex items-center justify-center w-16 h-16 mt-auto hover:bg-blue-600 hover:text-gray-300 mb-2 cursor-pointer"
				@click="showSignOutForm()"
			>
				<Icon icon="fa6-solid:circle-arrow-right" style="font-size: 22px" />
			</div>
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
import { set } from "date-fns";

const authStore = useAuthStore();
authStore.loadLoginState();

const isAuthenticated = computed(() => authStore.isAuthenticated);

defineProps(["user"]);

const showSignOutFormBool = ref(false);

const activeTab = ref(""); // Default active tab

function setActiveTab(tab) {
	activeTab.value = tab;
}

function showSignOutForm() {
	showSignOutFormBool.value = !showSignOutFormBool.value;
	console.log(showSignOutFormBool);
}

function signOut() {
	console.log("signed out");
}

onMounted(() => {
	setActiveTab("home");
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
