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
});

const aktivita = ref("");
const datum_cas = ref("");

onMounted(async () => {
	// await todosStore.createTodo({
	// 	activity_name: "Skuska",
	// 	due_date: "2025-5-24",
	// 	contact_id: 164,
	// });
});

const addActivity = async () => {
	event.preventDefault();
	await todosStore.createTodo({
		activity_name: aktivita.value,
		due_date: datum_cas.value,
		contact_id: props.contact_id,
	});
	emit("cancelToDoActivity");
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<loadigcomponent v-if="loadingState" />
		<form
			class="relative bg-white bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<div class="cursor-pointer" @click="cancelActivity()">
				<Icon icon="fa6-solid:xmark" class="absolute top-4 right-6" />
			</div>

			<div class="relative z-0 w-full mb-5 mt-2 group">
				<label
					class="text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Aktivita</label
				>

				<input
					type="text"
					v-model="aktivita"
					class="w-full mt-3 p-1 bg-white rounded-lg text-black pl-2 focus:outline-blue-500 border-2 border-gray-300 focus:border-blue-500"
					placeholder="Zadajte aktivitu ..."
				/>
			</div>

			<div class="relative z-0 w-full mb-5 group">
				<input
					type="date"
					name="datum_cas"
					v-model="datum_cas"
					id="floating_datum_cas"
					class="!text-black block py-2.5 px-0 w-full text-sm text-gray-200 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text- dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
				/>
				<label
					for="floating_datum_cas"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Termín</label
				>
			</div>

			<div class="flex justify-center items-center mt-3">
				<button
					@click="addActivity()"
					class="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-8 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
				>
					Pridať
				</button>
			</div>
		</form>
	</div>
</template>
