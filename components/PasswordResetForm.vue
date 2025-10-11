<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
	>
		<div class="bg-white p-6 min-w-[1024px] min-h-[70vh] rounded-lg shadow-xl">
			<div>
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-2xl font-semibold text-gray-800 text-center flex-1">
						Upraviť kontakt
					</h2>
					<Icon
						icon="fa6-solid:xmark"
						@click="cancelReset()"
						class="cursor-pointer text-2xl text-gray-600 hover:text-gray-800"
					/>
				</div>

				<form @submit.prevent="updatePassword">
					<div class="w-full px-10">
						<div class="flex gap-16 mb-9 relative">
							<div class="flex-1">
								<label
									v-if="newPassword"
									for="meno"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Heslo</label
								>
								<input
									v-model="newPassword"
									id="meno"
									type="password"
									class="w-full"
									placeholder="Heslo"
								/>
							</div>
							<div class="flex-1">
								<label
									v-if="newPasswordConfirmation"
									class="text-gray-600 absolute top-[-22px] font-medium"
									>Potvrdenie hesla</label
								>
								<input
									v-model="newPasswordConfirmation"
									id="priezvisko"
									type="password"
									class="w-full"
									placeholder="Potvrdenie hesla"
								/>
							</div>
						</div>
						<div
							v-if="newPassword !== newPasswordConfirmation"
							class="text-red-500 mb-4 text-center font-semibold text-xl"
						>
							Heslá sa nezhodujú.
						</div>
					</div>

					<div class="flex justify-center">
						<button
							type="submit"
							class="bg-blue-500 text-white w-[75px] py-2 rounded mr-2 hover:bg-blue-600 font-semibold transition-colors"
						>
							Zmeniť heslo
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>
<script setup>
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
import axios from "axios";
import { useToast } from "vue-toastification";

const props = defineProps({
	userID: {
		required: true,
	},
});
const newPassword = ref("");
const newPasswordConfirmation = ref("");
const emit = defineEmits(["closeForm"]);

const updatePassword = async () => {
	if (newPassword.value !== newPasswordConfirmation.value) {
		console.error("Passwords do not match");
		return;
	}

	const config = useRuntimeConfig();
	try {
		const response = await axios.post(
			`${config.public.apiUrl}users/${props.userID}/reset-password`,
			{
				password: newPassword.value,
				password_confirmation: newPasswordConfirmation.value,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			}
		);
		const toast = useToast();
		toast.success("Heslo bolo úspešne zmenené.");
		emit("closeForm");
	} catch (error) {
		console.error("Error changing password:", error);
		const toast = useToast();
		toast.error("Nastala chyba pri zmene hesla.");
	}
};

const cancelReset = () => {
	emit("closeForm");
};
</script>

<style scoped>
input {
	border-bottom: 1px solid #d1d5db;
	background-color: #ffffff;
	height: 30px;
	color: #374151;
}

input::placeholder {
	color: #9ca3af;
}

textarea {
	border-bottom: 1px solid #d1d5db;
	background-color: #ffffff;
	height: 50px;
	padding-left: 5px;
	padding-top: 5px;
	color: #374151;
}

textarea::placeholder {
	color: #9ca3af;
}

input:focus,
textarea:focus {
	outline: none;
	border-bottom: 2px solid #3b82f6;
}

select {
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #d1d5db;
}

select:focus {
	outline: none;
	border-color: #3b82f6;
	ring: 2px solid #3b82f6;
}
</style>
