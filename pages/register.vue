<script setup>
const config = useRuntimeConfig();

import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const router = useRouter();

const first_name = ref("");
const last_name = ref("");
const email = ref("");
const password = ref("");
const password_confirmation = ref("");

const loading = ref(false);

const token = ref("");

definePageMeta({
	layout: "empty",
});

const register = async () => {
	loading.value = true;
	event.preventDefault();

	if (first_name.value && last_name.value && email.value && password.value) {
		if (password.value !== password_confirmation.value) {
			alert("Heslá sa nezhodujú");
			loading.value = false;
			return;
		}
		try {
			const response = await axios.post(
				`${config.public.apiUrl}register`,
				{
					username: first_name.value + " " + last_name.value,
					first_name: first_name.value,
					last_name: last_name.value,
					email: email.value,
					password: password.value,
				},
				{
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
				}
			);

			if (response.status === 200 || response.status === 201) {
				console.log("User registered successfully:", response.data);

				// Call login immediately after successful registration
				await login(email.value, password.value, rememberMe.value);
			} else {
				alert(
					response.data.message || "Registration failed. Please try again."
				);
			}
		} catch (error) {
			alert(
				error.response?.data?.message ||
					"An error occurred during registration."
			);
			console.error(
				"Error during registration:",
				error.response ? error.response.data : error.message
			);
		}
	} else {
		alert("Je potrebné vyplniť všetky polia");
	}
	loading.value = false;
};

const login = async (email, password, rememberMe) => {
	loading.value = true;
	try {
		const response = await axios.post(
			`${config.public.apiUrl}login`,
			{ email, password },
			{
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
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

		console.log("User logged in successfully:", authStore.token);
		router.push("/");
	} catch (error) {
		alert("Login failed. Please check your credentials.");
		console.error(
			"Error during login:",
			error.response ? error.response.data : error.message
		);
	}
	loading.value = false;
};

const rememberMe = ref(false);
</script>

<template>
	<loadigcomponent v-if="loading" />
	<div class="flex items-center justify-center min-h-screen bg-gray-900">
		<div class="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-md">
			<div class="flex justify-center">
				<svg
					class="w-16 h-16 fill-current text-gray-400"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z"
					/>
				</svg>
			</div>
			<form class="mt-8 space-y-6">
				<div class="rounded-md shadow-sm">
					<div class="mb-4">
						<label for="meno" class="block text-sm font-medium text-gray-400"
							>Meno</label
						>
						<input
							type="text"
							v-model="first_name"
							id="meno"
							name="meno"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-300 bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>
					<div class="mb-4">
						<label
							for="priezvisko"
							class="block text-sm font-medium text-gray-400"
							>Priezvisko</label
						>
						<input
							v-model="last_name"
							id="priezvisko"
							name="priezvisko"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-300 bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>
					<div class="mb-4">
						<label for="email" class="block text-sm font-medium text-gray-400"
							>Emailová adresa</label
						>
						<input
							v-model="email"
							id="email"
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
							v-model="password"
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-300 bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							:class="{
								'border-red-500 focus:ring-red-500 focus:border-red-500':
									password !== password_confirmation,
								'border-gray-600 focus:ring-indigo-500 focus:border-indigo-500':
									password === password_confirmation,
							}"
						/>
					</div>
					<div class="mb-4">
						<label
							for="password"
							class="block text-sm font-medium text-gray-400"
							>Potvrdiť heslo</label
						>
						<input
							v-model="password_confirmation"
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-300 bg-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							:class="{
								'border-red-500 focus:ring-red-500 focus:border-red-500':
									password !== password_confirmation,
								'border-gray-600 focus:ring-indigo-500 focus:border-indigo-500':
									password === password_confirmation,
							}"
						/>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember_me"
							name="remember_me"
							type="checkbox"
							class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-900 rounded"
							v-model="rememberMe"
						/>
						<label for="remember_me" class="ml-2 block text-sm text-gray-400"
							>Zapamätať si ma</label
						>
					</div>
				</div>
				<div>
					<button
						@click="register"
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Registrovať
					</button>
				</div>
			</form>
		</div>
	</div>
</template>
