<script setup>
const requestPermission = async () => {
	if (!("Notification" in window)) {
		alert("This browser does not support notifications.");
		return;
	}

	const permission = await Notification.requestPermission();
	alert("Permission: " + permission);
};

const showNotification = () => {
	if (Notification.permission !== "granted") {
		alert("Please allow notifications first.");
		return;
	}

	new Notification("Hello from Nuxt!", {
		body: "This is a test browser notification 🎉",
		icon: "/icon.png", // optional
	});
};
</script>

<template>
	<div class="p-10 space-y-4">
		<h1 class="text-2xl font-bold">Notification Test</h1>

		<button
			class="px-4 py-2 bg-blue-600 text-white rounded"
			@click="requestPermission"
		>
			Request Permission
		</button>

		<button
			class="px-4 py-2 bg-green-600 text-white rounded"
			@click="showNotification"
		>
			Show Notification
		</button>
	</div>
</template>
