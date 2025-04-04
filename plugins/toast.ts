import { defineNuxtPlugin } from "#app";
import Toast from "vue-toastification";
import type { PluginOptions } from "vue-toastification";
import { POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";

export default defineNuxtPlugin((nuxtApp) => {
	const options: PluginOptions = {
		timeout: 3000,
		position: POSITION.TOP_RIGHT,
		closeOnClick: true,
		pauseOnFocusLoss: true,
		pauseOnHover: true,
		draggable: true,
		draggablePercent: 0.6,
		showCloseButtonOnHover: false,
		hideProgressBar: false,
		closeButton: "button",
		icon: true,
		rtl: false,
	};

	nuxtApp.vueApp.use(Toast, options);
});
