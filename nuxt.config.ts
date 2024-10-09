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
			apiUrl: "https://crm-be-main.vercel.app/",
		},
	},
});
