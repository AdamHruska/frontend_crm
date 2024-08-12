<template>
	<div class="flex">
		<!-- Sidebar -->
		<div
			class="flex flex-col h-screen w-16 overflow-hidden text-gray-400 bg-gray-900 fixed top-0 left-0"
		>
			<!-- Logo or Top Icon -->
			<a class="flex items-center justify-center mt-3" href="#">
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

			<!--<a
				class="flex items-center justify-center w-18 h-16 mt-auto bg-gray-800 hover:bg-gray-700 hover:text-gray-300"
				href="#"
			>
				<svg
					class="w-6 h-6 stroke-current"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</a>-->

			<!-- Main Navigation Items -->
			<div
				class="flex flex-col items-center mt-3 border-t border-gray-700 flex-grow"
			>
				<NuxtLink
					to="/"
					class="flex items-center justify-center w-12 h-12 mt-2 rounded hover:bg-gray-700 hover:text-gray-300"
				>
					<Icon icon="streamline:bullet-list" style="font-size: 22px" />
				</NuxtLink>

				<NuxtLink
					to="/calendar"
					class="flex items-center justify-center w-12 h-12 mt-2 rounded hover:bg-gray-700 hover:text-gray-300 border-t border-gray-700"
				>
					<Icon icon="streamline:blank-calendar" style="font-size: 22px" />
				</NuxtLink>

				<NuxtLink
					class="flex items-center justify-center w-12 h-12 mt-2 rounded hover:bg-gray-700 hover:text-gray-300 border-t border-gray-700"
					href="#"
				>
					<Icon icon="ep:phone-filled" style="font-size: 22px" />
				</NuxtLink>

				<!-- Add other nav items similarly -->
			</div>

			<!-- Bottom Navigation Item -->
			<div
				class="flex items-center justify-center w-16 h-16 mt-auto hover:bg-gray-700 hover:text-gray-300 mb-2 cursor-pointer"
				@click="showSignOutForm()"
			>
				<!--<svg
					class="w-6 h-6 stroke-current"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>-->
				<img
					:src="user?.photoURL"
					alt="Photo of user"
					class="w-12 h-12 rounded-full"
				/>
			</div>
		</div>

		<!-- Main Content -->
		<div class="flex-1 ml-16">
			<slot />
		</div>
	</div>
	<SignOutForm
		v-if="showSignOutFormBool"
		@cancelSignOut="showSignOutForm()"
		@confirmSignOut="signOut()"
	/>
</template>

<script setup>
import { Icon } from "@iconify/vue";
// Script setup (if needed)
defineProps(["user"]);

var showSignOutFormBool = ref(false);

function showSignOutForm() {
	showSignOutFormBool.value = !showSignOutFormBool.value;
	console.log(showSignOutFormBool);
}

function signOut() {
	console.log("signed out");
}
</script>
