<script setup>
import { Icon } from "@iconify/vue";
const props = defineProps({
	event: {
		type: Object,
		required: true,
	},
});

const emit = defineEmits(["close"]);

const formatDateTime = (date) => {
	if (!date) return "";
	return new Date(date).toLocaleString();
};

const closeModal = () => {
	emit("close");
};
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
	>
		<div class="absolute inset-0 bg-gray bg-opacity-50 backdrop-blur-sm"></div>
		<div
			class="relative bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-10"
		>
			<!-- Close button -->
			<div class="flex justify-between items-center mb-4">
				<button
					@click="closeModal"
					class="absolute top-4 right-6 cursor-pointer"
				>
					<Icon icon="fa6-solid:xmark" class="h-6 w-6" />
				</button>

				<!-- Event details -->
				<h2 class="text-xl font-bold mb-4">{{ event.title }}</h2>
			</div>

			<div class="space-y-4">
				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Začiatok</p>
					<p class="font-medium">{{ formatDateTime(event.start) }}</p>
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Koniec</p>
					<p class="font-medium">{{ formatDateTime(event.end) }}</p>
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Organizátor</p>
					<p class="font-medium">{{ event.organizator }}</p>
					<!-- <p class="text-gray-600 font-semibold">Email organizátora</p>
					<p class="font-medium">{{ event.extendedProps.organizer.email }}</p> -->
				</div>

				<div class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Ostatní účastníci</p>
					<p class="font-medium">{{ event.attendees }}</p>
				</div>

				<div v-if="event.id" class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Lokalita</p>
					<p class="font-medium break-words">{{ event.location }}</p>
				</div>
				<div v-if="event.id" class="border-b pb-2">
					<p class="text-gray-600 font-semibold">Link na meeting</p>
					<a
						v-if="event.link"
						:href="event.link"
						class="font-medium break-words text-blue-600 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						{{ event.link }}
					</a>
					<div v-else>Link nie je určený</div>
				</div>
			</div>
		</div>
	</div>
</template>
