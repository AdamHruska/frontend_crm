<template>
	<div class="test-page">
		<h1>OneSignal Test Page</h1>

		<div class="status-box">
			<p><strong>Status:</strong> {{ status }}</p>
			<p><strong>Permission:</strong> {{ permission }}</p>
			<p>
				<strong>Subscription ID:</strong>
				{{ subscriptionId || "Not subscribed" }}
			</p>
		</div>

		<div class="buttons">
			<button @click="checkStatus" class="btn">Check Status</button>
			<button @click="requestPermission" class="btn primary">
				Request Permission
			</button>
			<button @click="subscribe" class="btn success">Subscribe</button>
		</div>

		<div class="logs">
			<h3>Console Logs:</h3>
			<div v-for="(log, i) in logs" :key="i" class="log">{{ log }}</div>
		</div>
	</div>
</template>

<script setup>
const status = ref("Initializing...");
const permission = ref("unknown");
const subscriptionId = ref("");
const logs = ref([]);

const addLog = (message) => {
	logs.value.push(`[${new Date().toLocaleTimeString()}] ${message}`);
	console.log(message);
};

onMounted(() => {
	addLog("Component mounted");
	addLog("Waiting for OneSignal to load...");

	let attempts = 0;
	const maxAttempts = 30; // Try for 15 seconds

	const checkOneSignal = setInterval(() => {
		attempts++;

		if (window.OneSignal && window.OneSignalReady) {
			clearInterval(checkOneSignal);
			addLog("✅ OneSignal SDK loaded and ready!");
			status.value = "OneSignal loaded";
			checkStatus();
		} else if (attempts >= maxAttempts) {
			clearInterval(checkOneSignal);
			addLog("❌ OneSignal failed to load after 15 seconds");
			addLog("Check browser console for errors");
			status.value = "OneSignal load timeout";
		} else {
			// Log every 2 seconds
			if (attempts % 4 === 0) {
				addLog(`Still waiting... (${attempts}/2 seconds)`);
			}
		}
	}, 500);
});

// Rest of your methods stay the same...
const checkStatus = async () => {
	try {
		if (!window.OneSignal || !window.OneSignalReady) {
			addLog("ERROR: OneSignal not loaded");
			status.value = "OneSignal not loaded";
			return;
		}

		const browserPermission = Notification.permission;
		permission.value = browserPermission;
		addLog(`Browser permission: ${browserPermission}`);

		const oneSignalPermission = await window.OneSignal.Notifications.permission;
		addLog(`OneSignal permission: ${oneSignalPermission}`);

		const subId = window.OneSignal.User.PushSubscription.id;
		subscriptionId.value = subId || "";
		addLog(`Subscription ID: ${subId || "none"}`);

		status.value = subId ? "Subscribed ✅" : "Not subscribed";
	} catch (error) {
		addLog(`ERROR: ${error.message}`);
		status.value = "Error checking status";
	}
};

const requestPermission = async () => {
	try {
		addLog("Requesting permission...");

		if (!window.OneSignal || !window.OneSignalReady) {
			addLog("ERROR: OneSignal not loaded");
			return;
		}

		const browserPerm = await Notification.requestPermission();
		addLog(`Browser permission result: ${browserPerm}`);
		permission.value = browserPerm;

		if (browserPerm === "granted") {
			addLog("Permission granted! ✅");
			status.value = "Permission granted, now subscribe...";
			setTimeout(subscribe, 1000);
		} else {
			addLog("Permission denied ❌");
			status.value = "Permission denied";
		}
	} catch (error) {
		addLog(`ERROR: ${error.message}`);
	}
};

const subscribe = async () => {
	try {
		addLog("Attempting to subscribe...");

		if (!window.OneSignal || !window.OneSignalReady) {
			addLog("ERROR: OneSignal not loaded");
			return;
		}

		let subId = window.OneSignal.User.PushSubscription.id;
		if (subId) {
			addLog(`Already subscribed: ${subId}`);
			subscriptionId.value = subId;
			status.value = "Already subscribed ✅";
			return;
		}

		const perm = await window.OneSignal.Notifications.permission;
		if (!perm) {
			addLog("Need permission first, requesting...");
			await requestPermission();
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 2000));

		subId = window.OneSignal.User.PushSubscription.id;
		if (subId) {
			addLog(`Successfully subscribed: ${subId}`);
			subscriptionId.value = subId;
			status.value = "Subscribed ✅";

			await saveToBackend(subId);
		} else {
			addLog("Subscription ID not available yet");
			status.value = "Subscription pending...";
		}
	} catch (error) {
		addLog(`ERROR: ${error.message}`);
	}
};

const saveToBackend = async (playerId) => {
	try {
		const config = useRuntimeConfig();
		const token = localStorage.getItem("auth_token");

		if (!token) {
			addLog("No auth token found, skipping backend save");
			return;
		}

		addLog("Saving to backend...");

		await $fetch(`${config.public.apiBase}/api/save-onesignal-id`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: { player_id: playerId },
		});

		addLog("Saved to backend successfully! ✅");
	} catch (error) {
		addLog(`Backend save failed: ${error.message}`);
	}
};
</script>
<style scoped>
.test-page {
	max-width: 800px;
	margin: 50px auto;
	padding: 20px;
	font-family: Arial, sans-serif;
}

.status-box {
	background: #f5f5f5;
	padding: 20px;
	border-radius: 8px;
	margin: 20px 0;
}

.status-box p {
	margin: 10px 0;
}

.buttons {
	display: flex;
	gap: 10px;
	margin: 20px 0;
}

.btn {
	padding: 12px 24px;
	font-size: 16px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	background: #ddd;
}

.btn:hover {
	background: #ccc;
}

.btn.primary {
	background: #007bff;
	color: white;
}

.btn.primary:hover {
	background: #0056b3;
}

.btn.success {
	background: #28a745;
	color: white;
}

.btn.success:hover {
	background: #218838;
}

.logs {
	background: #1e1e1e;
	color: #00ff00;
	padding: 20px;
	border-radius: 8px;
	margin-top: 20px;
	max-height: 400px;
	overflow-y: auto;
	font-family: "Courier New", monospace;
	color: white !important;
}

.log {
	margin: 5px 0;
	font-size: 14px;
	color: white !important;
}

h1 {
	color: #333;
}

h3 {
	color: #ddd;
	margin: 0 0 10px 0;
}
</style>
