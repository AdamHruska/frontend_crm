<template>
	<button @click="requestPermission">Enable Notifications</button>
	<button @click="showNotification">Test Notification</button>
</template>

<script setup>
// Request permission
const requestPermission = async () => {
	if ("Notification" in window) {
		const permission = await Notification.requestPermission();
		console.log("Notification permission:", permission);
	}
};

// Show notification
const showNotification = (
	title = "Hello!",
	body = "This is a test notification"
) => {
	if (Notification.permission === "granted") {
		new Notification(title, {
			body,
			icon: "/icon.png",
		});
	}
};
</script>
