<template>
	<div
		class="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center z-50"
	>
		<div class="absolute inset-0 bg-gray-400 bg-opacity-50 backdrop-blur-sm">
			<div
				class="relative bg-gray-100 p-6 pt-8 mt-8 rounded-lg shadow-lg max-w-md z-10 mx-auto my-auto w-[550px] top-[20%]"
			>
				<button class="float-end" @click="emitFunction()">
					<Icon
						icon="fa6-solid:xmark"
						class="cursor-pointer text-xl text-gray-600 hover:text-red-500"
					/>
				</button>
				<ul
					class="mt-8 pl-0 max-h-[650px] overflow-y-auto"
					v-if="contactsStore.selectedContacts.length > 0"
				>
					<li
						class="my-0 py-3 pl-2 hover:bg-gray-300 cursor-pointer rounded"
						v-for="contact in contactsStore.selectedContacts"
						:key="contact.id"
						@click="goToDetail(contact.id)"
					>
						{{ contact.meno }} {{ contact.priezvisko }}
					</li>
				</ul>
				<div v-else><h3>Zoznam kontaktov je prázdny</h3></div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

import { useContactsStore } from "@/stores/contactsStore";
const contactsStore = useContactsStore();

import { Icon } from "@iconify/vue";

const emit = defineEmits(["showSelectedContacts"]);

const emitFunction = () => {
	console.log("emitFunction called");
	emit("showSelectedContacts");
};

const goToDetail = (id) => {
	router.push(`/contact/${id}`);
};
</script>
