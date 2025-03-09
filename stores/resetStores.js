import { useContactsStore } from "@/stores/contactsStore";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
//import { useCalendarStore } from "@/stores/calendarStore";

export function resetAllStores() {
	const stores = [
		useContactsStore(),
		useAuthStore(),
		useUserStore(),
		//useCalendarStore(),
	];

	stores.forEach((store) => {
		store.$reset();
	});
}
