import { useContactsStore } from "@/stores/contactsStore";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import { useCalendarstore } from "@/stores/calendarStore";
import { useCallListStore } from "@/stores/callListStore";
import { useTodosStore } from "@/stores/todoStore";
import { useMicrosoftStore } from "@/stores/microsoftStore";
import { useStatisticsStore } from "@/stores/statisticsStore";

//import { useCalendarStore } from "@/stores/calendarStore";

export function resetAllStores() {
	const stores = [
		useContactsStore(),
		useAuthStore(),
		useUserStore(),
		useCalendarstore(),
		useCallListStore(),
		useTodosStore(),
		useMicrosoftStore(),
		useStatisticsStore(), // don't show the previous user's statistics
	];

	stores.forEach((store) => {
		store.$reset();
	});
}
