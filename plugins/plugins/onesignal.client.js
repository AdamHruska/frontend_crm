export default defineNuxtPlugin(() => {
	if (process.client) {
		const script = document.createElement("script");
		script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
		document.head.appendChild(script);

		script.onload = () => {
			console.log("OneSignal script loaded");

			window.OneSignalDeferred = window.OneSignalDeferred || [];
			window.OneSignalDeferred.push(async function (OneSignal) {
				try {
					await OneSignal.init({
						appId: "2b1b9281-793f-4815-93bf-16f9c13ea655",
						safari_web_id:
							"web.onesignal.auto.596e7d36-250c-4e22-98d4-39c9730f6c95",
						allowLocalhostAsSecureOrigin: true,
						// Explicitly specify service worker path
						serviceWorkerParam: { scope: "/" },
						serviceWorkerPath: "OneSignalSDKWorker.js",
					});

					console.log("✅ OneSignal initialized successfully!");
					window.OneSignalReady = true;

					// Listen for subscription changes
					OneSignal.User.PushSubscription.addEventListener(
						"change",
						async (event) => {
							console.log("Subscription changed:", event);
							if (event.current && event.current.id) {
								await savePlayerIdToBackend(event.current.id);
							}
						}
					);

					// Check for existing subscription
					const subId = OneSignal.User.PushSubscription.id;
					if (subId) {
						console.log("Found existing subscription:", subId);
						await savePlayerIdToBackend(subId);
					}
				} catch (error) {
					console.error("❌ OneSignal initialization error:", error);
				}
			});
		};

		script.onerror = () => {
			console.error("❌ Failed to load OneSignal script");
		};

		// Function to save player ID to backend
		async function savePlayerIdToBackend(playerId) {
			try {
				const config = useRuntimeConfig();
				const token = localStorage.getItem("auth_token");

				if (!token) {
					console.log("No auth token, skipping save");
					return;
				}

				await $fetch(`${config.public.apiUrl}save-onesignal-id`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: { player_id: playerId },
				});

				console.log("✅ Player ID saved to backend");
			} catch (error) {
				console.error("❌ Failed to save player ID:", error);
			}
		}
	}
});

// export default defineNuxtPlugin(() => {
// 	if (process.client) {
// 		const script = document.createElement("script");
// 		script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
// 		document.head.appendChild(script);

// 		script.onload = () => {
// 			console.log("OneSignal script loaded");

// 			window.OneSignalDeferred = window.OneSignalDeferred || [];
// 			window.OneSignalDeferred.push(async function (OneSignal) {
// 				try {
// 					await OneSignal.init({
// 						appId: "2b1b9281-793f-4815-93bf-16f9c13ea655",
// 						safari_web_id:
// 							"web.onesignal.auto.596e7d36-250c-4e22-98d4-39c9730f6c95",
// 						allowLocalhostAsSecureOrigin: true,

// 						// Try without custom service worker config first
// 						// serviceWorkerParam: { scope: "/" },
// 						// serviceWorkerPath: "OneSignalSDKWorker.js",

// 						// Add these for better Android support
// 						notifyButton: {
// 							enable: false, // Disable default prompt
// 						},
// 					});

// 					console.log("✅ OneSignal initialized successfully!");
// 					console.log("User Agent:", navigator.userAgent);
// 					console.log("Is Android:", /Android/i.test(navigator.userAgent));

// 					window.OneSignalReady = true;

// 					// Check notification permission status
// 					const permission = await OneSignal.Notifications.permission;
// 					console.log("Current permission:", permission);

// 					// Listen for subscription changes
// 					OneSignal.User.PushSubscription.addEventListener(
// 						"change",
// 						async (event) => {
// 							console.log("Subscription changed:", event);
// 							if (event.current && event.current.id) {
// 								await savePlayerIdToBackend(event.current.id);
// 							}
// 						}
// 					);

// 					// Check for existing subscription
// 					const subId = OneSignal.User.PushSubscription.id;
// 					if (subId) {
// 						console.log("Found existing subscription:", subId);
// 						await savePlayerIdToBackend(subId);
// 					} else {
// 						console.log("No existing subscription found");
// 					}
// 				} catch (error) {
// 					console.error("❌ OneSignal initialization error:", error);
// 					console.error("Error details:", error.message, error.stack);
// 				}
// 			});
// 		};

// 		script.onerror = () => {
// 			console.error("❌ Failed to load OneSignal script");
// 		};

// 		async function savePlayerIdToBackend(playerId) {
// 			try {
// 				const config = useRuntimeConfig();
// 				const token = localStorage.getItem("auth_token");

// 				if (!token) {
// 					console.log("No auth token, skipping save");
// 					return;
// 				}

// 				await $fetch(`${config.public.apiBase}/api/save-onesignal-id`, {
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${token}`,
// 					},
// 					body: { player_id: playerId },
// 				});

// 				console.log("✅ Player ID saved to backend");
// 			} catch (error) {
// 				console.error("❌ Failed to save player ID:", error);
// 			}
// 		}
// 	}
// });
