<script setup>
import axios from "axios";
const router = useRouter();
const config = useRuntimeConfig();
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
import { useToast } from "vue-toastification";
const toast = useToast();
const email = ref("");
const password = ref("");
const rememberMe = ref(false); // Add this line to track remember me state
const loading = ref(false);

const login = async (email, password, rememberMe) => {
	loading.value = true;
	event.preventDefault();
	if (email && password) {
		try {
			const response = await axios.post(
				`${config.public.apiUrl}login`,
				{ email, password },
				{
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				}
			);
			console.log("Login response:", response.data.message);
			const token = response.data.authorization.token;
			authStore.setToken(token);

			// Store token based on remember me preference
			if (rememberMe) {
				localStorage.setItem("auth_token", token);
			} else {
				sessionStorage.setItem("auth_token", token);
			}

			if (email == "admin@admin.com") {
				router.push("/users");
			} else {
				router.push("/");
			}
		} catch (error) {
			if (error.response?.status === 403) {
				toast.error("Váš účet nie je aktívny. Kontaktujte administrátora.");
				loading.value = false;
				return;
			} else {
				toast.error("Nesprávny email alebo heslo");
			}
		}
	} else {
		toast.error("Vyplňte všetky polia", {
			position: "top-center",
			timeout: 5000,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			draggablePercent: 60,
			showCloseButtonOnHover: false,
			hideProgressBar: false,
		});
	}
	loading.value = false;
};

// Clear any existing tokens on component mount
onMounted(() => {
	console.log("Remember me status:", rememberMe.value);
});

//skuska
</script>

<template>
	<loadigcomponent v-if="loading" />
	<div class="flex items-center justify-center min-h-screen bg-blue-800">
		<div class="w-full max-w-md p-8 space-y-8 rounded-lg shadow-md bg-white">
			<h1 class="mx-auto text-center text-3xl font-bold pb-4 text-black">
				Partners Group SK
			</h1>
			<!-- ... previous header content ... -->
			<form class="mt-8 space-y-6">
				<div class="rounded-md shadow-sm">
					<div class="mb-4">
						<label for="email" class="block text-sm text-black font-medium"
							>Emailová adresa</label
						>
						<input
							id="email"
							v-model="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="text-black appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
						/>
					</div>
					<div class="mb-4">
						<label for="password" class="block text-sm text-black font-medium"
							>Heslo</label
						>
						<input
							id="password"
							v-model="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="text-black appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
						/>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember_me"
							v-model="rememberMe"
							name="remember_me"
							type="checkbox"
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-900 rounded"
						/>
						<label for="remember_me" class="ml-2 block text-sm text-black"
							>Zapamätať si ma</label
						>
					</div>
					<div class="text-sm">
						<a href="#" class="font-medium text-blue-600 hover:text-blue-500"
							>Zabudnuté heslo?</a
						>
					</div>
				</div>
				<div>
					<button
						@click="login(email, password, rememberMe)"
						class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-8"
					>
						Prihlásiť
					</button>
					<nuxt-link
						class="font-small font-semibold text-blue-600 hover:text-blue-500 float-right mt-1"
						to="/register"
					>
						Registrovať
					</nuxt-link>
				</div>
			</form>
		</div>
	</div>
</template>
