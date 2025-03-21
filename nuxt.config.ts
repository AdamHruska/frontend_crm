// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	devtools: { enabled: true },
	ssr: false,
	css: [
		"~/assets/css/main.css",
		"@toast-ui/calendar/dist/toastui-calendar.min.css",
	],

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
	plugins: ["~/plugins/axios.js"],

	modules: ["@nuxt/ui", "@pinia/nuxt"],

	runtimeConfig: {
		public: {
			// apiUrl: "https://crm-be-main.vercel.app/",
			// apiUrl: "http://localhost:8000/",
			apiUrl: "https://backend.partners-crm.sk/",
			// AZURE_CLIENT_ID: process.env.NUXT_PUBLIC_AZURE_CLIENT_ID,
			// AZURE_REDIRECT_URI: process.env.NUXT_PUBLIC_AZURE_REDIRECT_URI,
			// AZURE_SCOPE: process.env.NUXT_PUBLIC_AZURE_SCOPE,
		},
	},
});
