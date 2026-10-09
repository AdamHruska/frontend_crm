// Same-origin channel used to share the login token between open CRM tabs
// (see plugins/00.auth-sync.client.js)
export const AUTH_CHANNEL = "crm-auth";

// Tell every other open tab to drop its token and go to /login
export const broadcastLogout = () => {
	if (typeof BroadcastChannel === "undefined") return;
	const channel = new BroadcastChannel(AUTH_CHANNEL);
	channel.postMessage({ type: "logout" });
	channel.close();
};
