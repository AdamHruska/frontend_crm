// sessionStorage is per-tab, so a contact opened in a new tab (middle-click /
// Ctrl+click) starts without a token and gets sent to /login.
// On startup, a tab without a token asks the other open tabs for theirs over a
// BroadcastChannel (same-origin only). This runs before the initial route
// middleware. Logging out in one tab also logs out all other tabs.
import { AUTH_CHANNEL } from "~/utils/authChannel";

export default defineNuxtPlugin(async () => {
	if (typeof BroadcastChannel === "undefined") return;

	const channel = new BroadcastChannel(AUTH_CHANNEL);

	channel.addEventListener("message", (e) => {
		// Answer token requests from newly opened tabs
		if (e.data?.type === "request-token") {
			const token = sessionStorage.getItem("token");
			if (token) {
				channel.postMessage({
					type: "token",
					token,
					authToken: sessionStorage.getItem("auth_token") || token,
				});
			}
		}

		// Another tab logged out -> drop this tab's token too
		if (e.data?.type === "logout") {
			sessionStorage.removeItem("token");
			sessionStorage.removeItem("auth_token");
			window.location.href = "/login";
		}
	});

	if (sessionStorage.getItem("token")) return;

	const data = await new Promise((resolve) => {
		const onMessage = (e) => {
			if (e.data?.type === "token" && e.data.token) {
				clearTimeout(timer);
				channel.removeEventListener("message", onMessage);
				resolve(e.data);
			}
		};
		// No other logged-in tab answered -> continue as logged out
		const timer = setTimeout(() => {
			channel.removeEventListener("message", onMessage);
			resolve(null);
		}, 400);

		channel.addEventListener("message", onMessage);
		channel.postMessage({ type: "request-token" });
	});

	if (data) {
		// app.vue checks "auth_token", the middleware and API calls use "token"
		sessionStorage.setItem("token", data.token);
		sessionStorage.setItem("auth_token", data.authToken);
	}
});
