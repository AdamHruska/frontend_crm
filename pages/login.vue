<script setup>
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
const router = useRouter();

const auth = useFirebaseAuth();

definePageMeta({
	layout: "empty",
});

const login = () => {
	router.push("/");
};

const signInWithGoogle = () => {
	signInWithPopup(auth, new GoogleAuthProvider()).then(() =>
		router.replace("/")
	);
};
</script>

<template>
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
						<label for="email" class="block text-sm font-medium text-gray-400"
							>Emailová adresa</label
						>
						<input
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
							id="password"
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
						@click="login"
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Prihlásiť
					</button>

					<button
						@click="signInWithGoogle"
						class="mt-2 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-slate-300 hover:outline-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Prihlásiť pomocou Google
					</button>

					<nuxt-link
						class="font-small text-indigo-600 hover:text-indigo-500 float-right mt-1"
						to="/register"
						>Registrovať</nuxt-link
					>
				</div>
			</form>
		</div>
	</div>
</template>
