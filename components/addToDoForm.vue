<script setup>
import { Icon } from "@iconify/vue";
import { useTodosStore } from "../stores/todoStore";
const todosStore = useTodosStore();

const emit = defineEmits(["cancelToDoActivity"]);

const cancelActivity = () => {
	emit("cancelToDoActivity");
};

const props = defineProps({
	contact_id: {
		type: String,
	},
	contact: {
		type: Object,
		default: () => ({}),
	},
});

const aktivita = ref("");
const datum_cas = ref("");

onMounted(async () => {
	// Set default datetime to current date and time
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");

	datum_cas.value = `${year}-${month}-${day}T${hours}:${minutes}`;
	console.log(
		"meno kotaktu:",
		props.contact[0].meno,
		props.contact[0].priezvisko
	);
});

const addActivity = async () => {
	event.preventDefault();

	// Validate inputs
	if (!aktivita.value.trim()) {
		alert("Prosím zadajte aktivitu");
		return;
	}

	if (!datum_cas.value) {
		alert("Prosím vyberte dátum a čas");
		return;
	}

	try {
		// Send datetime-local as is (without converting to UTC)
		// This preserves the user's intended local time
		await todosStore.createTodo({
			activity_name: aktivita.value,
			due_date: datum_cas.value, // Send as YYYY-MM-DDTHH:MM format
			contact_id: props.contact_id,
			contact_name: props.contact[0].meno + " " + props.contact[0].priezvisko,
		});

		emit("cancelToDoActivity");
	} catch (error) {
		console.error("Error creating todo:", error);
		alert("Chyba pri vytváraní úlohy");
	}
};

// Format datetime for display
const formatDateTime = (dateTimeString) => {
	if (!dateTimeString) return "";
	const date = new Date(dateTimeString);
	return date.toLocaleString("sk-SK", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<loadigcomponent v-if="todosStore.loadingState" />
		<form
			class="relative bg-white bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full z-10"
			@submit.prevent="addActivity"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
				Pridať novú úlohu
			</h3>

			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita *
				</label>

				<input
					type="text"
					v-model="aktivita"
					required
					class="w-full mt-3 p-3 bg-white rounded-lg text-black pl-2 focus:outline-blue-500 border-2 border-gray-300 focus:border-blue-500"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<label
					for="floating_datum_cas"
					class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
					>Termín a čas *</label
				>
				<input
					type="datetime-local"
					name="datum_cas"
					v-model="datum_cas"
					id="floating_datum_cas"
					required
					class="w-full p-3 text-sm text-black bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				/>
			</div>

			<div class="flex justify-center items-center mt-6 gap-3">
				<button
					type="button"
					@click="cancelActivity()"
					class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
				>
					Zrušiť
				</button>
				<button
					type="submit"
					class="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-8 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
				>
					Pridať úlohu
				</button>
			</div>
		</form>
	</div>
</template>

<style scoped>
/* Custom styles for datetime input */
input[type="datetime-local"] {
	color-scheme: light;
}

input[type="datetime-local"]::-webkit-calendar-picker-indicator {
	cursor: pointer;
	border-radius: 4px;
	margin-left: 8px;
	opacity: 0.6;
	filter: invert(0.8);
}

input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
	opacity: 1;
}

/* Dark mode support */
.dark input[type="datetime-local"] {
	color-scheme: dark;
}

.dark input[type="datetime-local"]::-webkit-calendar-picker-indicator {
	filter: invert(0.8);
}

/* Focus styles */
input[type="datetime-local"]:focus {
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
