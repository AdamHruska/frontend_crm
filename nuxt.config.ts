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

	modules: ["@nuxt/ui", "@pinia/nuxt"],
	runtimeConfig: {
		public: {
			apiUrl: process.env.API_URL || "http://localhost:8000/api/", // Fallback to localhost
		},
	},
});
