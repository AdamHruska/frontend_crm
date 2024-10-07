<script setup>
const config = useRuntimeConfig();

const emit = defineEmits(["cancelSignOut"], ["confirmSignOut"]);
import axios from "axios";
const router = useRouter();

import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

function cancelSignOut() {
	emit("cancelSignOut");
}

function confirmSignOut() {
	logout();
	emit("cancelSignOut");
}

//sessionStorage.getItem("token")

const logout = async () => {
	await axios.post(
		`${config.public.apiUrl}logout`,
		{},
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		}
	);
	authStore.clearToken();
	sessionStorage.removeItem("token");
	console.log("Logged out");
	router.push("/login");
};
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center"
	>
		<div class="bg-white p-4 w-[300px] h-[150px] rounded-lg shadow-lg">
			<p class="text-lg font-semibold mb-4 text-black text-center mt-1">
				Do you want to sign out?
			</p>
			<div class="flex justify-center mt-18">
				<button
					@click="confirmSignOut"
					class="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-400"
				>
					Yes
				</button>
				<button
					@click="cancelSignOut"
					class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-800"
				>
					No
				</button>
			</div>
		</div>
	</div>
</template>
