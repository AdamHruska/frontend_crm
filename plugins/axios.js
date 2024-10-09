import axios from "axios";

export default defineNuxtPlugin(() => {
	axios.defaults.withCredentials = true;
});
