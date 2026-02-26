
<script setup>
import { ref, onMounted } from "vue";
import { useRuntimeConfig } from "#imports";
import axios from "axios";

// Emits for parent communication
const emit = defineEmits(["close", "eventCreated"]);

// Props
const props = defineProps({
	selectedDate: { type: String, default: "" },
});

// State
const eventForm = ref({
	subject: "",
	location: "",
	body: "",
	start: "",
	end: "",
	isOnlineMeeting: false,
	attendees: [{ email: "", name: "" }],
});
const formError = ref("");
const isLoading = ref(false);
const config = useRuntimeConfig();

// Set initial form dates
onMounted(() => {
	const base = props.selectedDate ? new Date(props.selectedDate) : new Date();
	const end = new Date(base);
	end.setHours(base.getHours() + 1);
	eventForm.value.start = formatDateTimeForInput(base);
	eventForm.value.end = formatDateTimeForInput(end);
});

// Format date for datetime-local input
function formatDateTimeForInput(date) {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0")
	].join("-") +
		"T" +
		[String(date.getHours()).padStart(2, "0"), String(date.getMinutes()).padStart(2, "0")].join(":");
}

function addAttendee() {
	eventForm.value.attendees.push({ email: "", name: "" });
}

function removeAttendee(index) {
	if (eventForm.value.attendees.length > 1) {
		eventForm.value.attendees.splice(index, 1);
	}
}

async function createEvent() {
	formError.value = "";
	// Validation
	if (!eventForm.value.subject) {
		formError.value = "Please enter a subject for the event";
		return;
	}
	if (!eventForm.value.start || !eventForm.value.end) {
		formError.value = "Please set both start and end times";
		return;
	}
	const startTime = new Date(eventForm.value.start);
	const endTime = new Date(eventForm.value.end);
	if (endTime <= startTime) {
		formError.value = "End time must be after start time";
		return;
	}
	const validAttendees = eventForm.value.attendees.filter(a => a.email.trim() !== "");
	try {
		isLoading.value = true;
		const formattedData = { ...eventForm.value, attendees: validAttendees };
		const response = await axios.post(
			`${config.public.apiUrl}create-microsoft-event`,
			formattedData
		);
		emit("eventCreated", response.data);
		emit("close");
	} catch (error) {
		// Portfolio: show user-friendly error
		formError.value = error?.response?.data?.error || "Failed to create event. Please try again.";
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
	>
		<div class="bg-white rounded-lg p-6 w-full max-w-lg">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold">Create Microsoft Outlook Event</h2>
				<button
					@click="$emit('close')"
					class="text-gray-500 hover:text-gray-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div
				v-if="formError"
				class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
			>
				{{ formError }}
			</div>

			<form @submit.prevent="createEvent" class="space-y-4">
				<!-- Subject -->
				<div>
					<label class="block text-sm font-medium text-gray-700"
						>Subject *</label
					>
					<input
						type="text"
						v-model="eventForm.subject"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white"
						required
					/>
				</div>

				<!-- Location -->
				<div>
					<label class="block text-sm font-medium text-gray-700"
						>Location</label
					>
					<input
						type="text"
						v-model="eventForm.location"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white"
					/>
				</div>

				<!-- Date/Time -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700"
							>Start *</label
						>
						<input
							type="datetime-local"
							v-model="eventForm.start"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white pl-1"
							required
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">End *</label>
						<input
							type="datetime-local"
							v-model="eventForm.end"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white pl-1"
							required
						/>
					</div>
				</div>

				<!-- Online Meeting Option -->
				<div class="flex items-center">
					<input
						type="checkbox"
						id="isOnlineMeeting"
						v-model="eventForm.isOnlineMeeting"
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="isOnlineMeeting" class="ml-2 block text-sm text-gray-700">
						Create as online meeting
					</label>
				</div>

				<!-- Description -->
				<div>
					<label class="block text-sm font-medium text-gray-700"
						>Description</label
					>
					<textarea
						v-model="eventForm.body"
						rows="3"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white"
					></textarea>
				</div>

				<!-- Attendees -->
				<div>
					<div class="flex justify-between items-center mb-2">
						<label class="block text-sm font-medium text-gray-700"
							>Attendees</label
						>
						<button
							type="button"
							@click="addAttendee"
							class="text-sm text-blue-600 hover:text-blue-800"
						>
							+ Add Attendee
						</button>
					</div>

					<div
						v-for="(attendee, index) in eventForm.attendees"
						:key="index"
						class="flex space-x-2 mb-2"
					>
						<input
							type="email"
							v-model="attendee.email"
							placeholder="Email"
							class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white pl-1"
						/>
						<input
							type="text"
							v-model="attendee.name"
							placeholder="Name (optional)"
							class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border-2 bg-white pl-1"
						/>
						<button
							type="button"
							@click="removeAttendee(index)"
							class="text-red-500 hover:text-red-700"
							v-if="eventForm.attendees.length > 1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>

				<!-- Buttons -->
				<div class="flex justify-end space-x-3 pt-4">
					<button
						type="button"
						@click="$emit('close')"
						class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
						:disabled="isLoading"
					>
						<span v-if="isLoading">Creating...</span>
						<span v-else>Create Event</span>
					</button>
				</div>
			</form>
		</div>
	</div>
</template>
