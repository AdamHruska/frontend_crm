<script setup>
const config = useRuntimeConfig();
const emit = defineEmits(["cancelSignOut", "confirmSignOut"]);
import axios from "axios";
const router = useRouter();
import { resetAllStores } from "@/stores/resetStores";
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();

function cancelSignOut() {
	emit("cancelSignOut");
}

async function confirmSignOut() {
	try {
		await logout();
		emit("confirmSignOut"); // This should be emitted before navigation
		emit("cancelSignOut"); // This will close the modal
		await router.push("/login");
	} catch (error) {
		console.error("Error during sign out:", error);
	}
}

const logout = async () => {
	try {
		await axios.post(
			`${config.public.apiUrl}logout`,
			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);
		resetAllStores(); // Clears all Pinia stores
		// Clear auth store
		authStore.clearToken();

		// Remove tokens from both storage types
		localStorage.removeItem("auth_token");
		sessionStorage.removeItem("auth_token");

		console.log("Successfully logged out");
	} catch (error) {
		console.error("Logout error:", error);

		// Even if the API call fails, we should still clear local storage
		authStore.clearToken();
		localStorage.removeItem("auth_token");
		sessionStorage.removeItem("auth_token");
	}
};
</script>

<template>
	<Transition name="fade">
		<div
			class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-10"
		>
			<div class="bg-white p-4 w-[300px] h-[150px] rounded-lg shadow-lg">
				<p class="text-lg font-semibold mb-4 text-black text-center mt-1">
					Do you want to sign out?
				</p>
				<div class="flex justify-center mt-18">
					<button
						@click="confirmSignOut"
						class="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-400 shadow-md"
					>
						Yes
					</button>
					<button
						@click="cancelSignOut"
						class="bg-gray-300 text-white px-4 py-2 rounded hover:bg-gray-800 shadow-md"
					>
						No
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
