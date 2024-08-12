// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	devtools: { enabled: true },
	ssr: false,
	css: ["~/assets/css/main.css"],

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},

	modules: ["nuxt-vuefire", "@nuxt/ui"],
	vuefire: {
		auth: {
			enabled: true,
			sessionCookie: false,
		},
		config: {
			apiKey: "AIzaSyCzguAi0Gyu62H-7izesVze-E_4KtQynws",
			authDomain: "crm-system-b70d1.firebaseapp.com",
			projectId: "crm-system-b70d1",
			storageBucket: "crm-system-b70d1.appspot.com",
			messagingSenderId: "91100149882",
			appId: "1:91100149882:web:ad1ed41503a08d54dc23c3",
			measurementId: "G-0V47WPLVRR",
		},
	},
});
