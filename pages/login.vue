<script setup>
import axios from "axios";
const router = useRouter();
const config = useRuntimeConfig();
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const rememberMe = ref(false); // Add this line to track remember me state

const login = async (email, password, rememberMe) => {
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
			const token = response.data.authorization.token;
			authStore.setToken(token);

			// Store token based on remember me preference
			if (rememberMe) {
				localStorage.setItem("auth_token", token);
			} else {
				sessionStorage.setItem("auth_token", token);
			}

			router.push("/");
		} catch (error) {
			alert("Login failed. Please check your credentials.");
		}
	} else {
		alert("Please fill in all fields");
	}
};

// Clear any existing tokens on component mount
onMounted(() => {
	console.log("Remember me status:", rememberMe.value);
});
</script>

<template>
	<div class="flex items-center justify-center min-h-screen bg-gray-900">
		<div class="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-md">
			<h1 class="mx-auto text-center text-3xl font-bold text-white pb-4">
				Partners Group
			</h1>
			<!-- ... previous header content ... -->
			<form class="mt-8 space-y-6">
				<div class="rounded-md shadow-sm">
					<div class="mb-4">
						<label for="email" class="block text-sm font-medium text-gray-400"
							>Emailová adresa</label
						>
						<input
							id="email"
							v-model="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-300 bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>
					<div class="mb-4">
						<label
							for="password"
							class="block text-sm font-medium text-gray-400"
							>Heslo</label
						>
						<input
							id="password"
							v-model="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-300 bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
							class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-900 rounded"
						/>
						<label for="remember_me" class="ml-2 block text-sm text-gray-400"
							>Zapamätať si ma</label
						>
					</div>
					<div class="text-sm">
						<a
							href="#"
							class="font-medium text-indigo-600 hover:text-indigo-500"
							>Zabudnuté heslo?</a
						>
					</div>
				</div>
				<div>
					<button
						@click="login(email, password, rememberMe)"
						class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Prihlásiť
					</button>
					<nuxt-link
						class="font-small text-indigo-600 hover:text-indigo-500 float-right mt-1"
						to="/register"
					>
						Registrovať
					</nuxt-link>
				</div>
			</form>
		</div>
	</div>
</template>
