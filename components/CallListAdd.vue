<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import { ref, computed } from "vue";
import { useCallListStore } from "#imports";
const callListStore = useCallListStore();

const userStore = useUserStore();
const authStore = useAuthStore();
authStore.loadToken();
const token = ref("");
const searchQuery = ref("");
const loadingState = ref(false);

const emits = defineEmits(["cancleCallListForm", "uncheckAll"]);

const props = defineProps({
	callListNames: {
		type: Array,
		required: true,
	},
	selected: {
		type: Array,
		required: false,
	},
	user_id: {
		type: Number,
		required: true,
	},
});

const author_id = ref("");
onMounted(() => {
	userStore.fetchUser();
	author_id.value = userStore.user.id;

	console.log("author_id", author_id.value);
});

const filteredCallLists = computed(() => {
	return props.callListNames.filter((list) =>
		list.name.toLowerCase().includes(searchQuery.value.toLowerCase())
	);
});

// Find exact match for the search query
const exactMatch = computed(() => {
	return props.callListNames.find(
		(list) => list.name.toLowerCase() === searchQuery.value.toLowerCase().trim()
	);
});

const cancelCallListForm = (e) => {
	e.preventDefault();
	emits("cancleCallListForm");
};

const handleSearch = (query) => {
	searchQuery.value = query;
};

const handleSubmit = (e) => {
	e.preventDefault(); // Prevent form submission
};

const createCallList = async () => {
	// Check if there's an exact match first
	if (exactMatch.value) {
		// If exact match exists, add to existing call list
		await addToCallList(exactMatch.value);
		return;
	}

	// Handle both cases: single ID or array of objects
	const contactIds = Array.isArray(props.selected)
		? props.selected.map((person) => person.id) // If array, extract IDs
		: [props.selected]; // If single ID, wrap in array

	const callList = {
		author_id: author_id.value,
		name: searchQuery.value.trim(),
		contact_ids: contactIds, // Always an array
	};

	console.log("Call list payload:", callList);
	loadingState.value = true;

	try {
		const response = await axios.post(
			`${config.public.apiUrl}call-lists`,
			{
				author_id: author_id.value,
				name: searchQuery.value.trim(),
				contact_ids: contactIds,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		callListStore.callLists.push(response.data);
		emits("cancleCallListForm", response.status);
	} catch (error) {
		console.error("Error creating call list:", error);
	} finally {
		loadingState.value = false;
		emits("uncheckAll");
	}
};

const addToCallList = async (callList) => {
	loadingState.value = true;

	// Handle both cases: single ID or array of objects
	const newContactIds = Array.isArray(props.selected)
		? props.selected.map((person) => person.id)
		: [props.selected];

	try {
		// Parse existing IDs (handle SQL array format)
		const oldContactIds = JSON.parse(callList.contact_ids.replace(/'/g, '"'));

		// Merge old and new IDs, removing duplicates
		const mergedIds = [...new Set([...oldContactIds, ...newContactIds])];

		// Update call list
		await axios.put(
			`${config.public.apiUrl}call-lists/${callList.id}`,
			{
				author_id: props.user_id,
				name: callList.name,
				contact_ids: mergedIds,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		// Fetch updated call list
		const callListResponse = await axios.post(
			`${config.public.apiUrl}call-list`,
			{ ids: mergedIds },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);

		callListStore.selectedCallListPeople = callListResponse.data.contacts;
		emits("cancleCallListForm", 200); // Success status
	} catch (error) {
		console.error("Error updating call list:", error);
	} finally {
		loadingState.value = false;
		emits("uncheckAll");
	}
};
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center z-50"
	>
		<loadigcomponent v-if="loadingState" />
		<div class="absolute inset-0 bg-gray-400 bg-opacity-50 backdrop-blur-sm">
			<form
				class="relative bg-gray-100 p-6 pt-8 mt-8 rounded-lg shadow-lg max-w-md w-full z-10 mx-auto my-auto w-[350px] top-1/4"
				@submit="handleSubmit"
				@keyup.enter="createCallList"
			>
				<button
					type="button"
					@click="cancelCallListForm"
					class="absolute right-3 top-2 hover:bg-black hover:bg-opacity-10 rounded-full"
				>
					<Icon
						icon="fa6-solid:xmark"
						class="cursor-pointer text-xl text-gray-600 hover:text-red-500"
					/>
				</button>
				<CallListAddSearchBar
					class="mb-2 shadow-md"
					@update-search="handleSearch"
				/>

				<ul class="px-2 text-black max-h-[500px] overflow-y-auto my-2">
					<li
						v-for="callList in filteredCallLists"
						:key="callList.id"
						@click="addToCallList(callList)"
						class="py-2 px-4 hover:bg-gray-300 rounded text-black text-sm cursor-pointer my-2"
						:class="{
							'bg-blue-100 border-l-4 border-blue-500':
								callList.name.toLowerCase() ===
								searchQuery.toLowerCase().trim(),
						}"
					>
						<div class="font-semibold">{{ callList.name }}</div>
						<div
							v-if="
								callList.name.toLowerCase() === searchQuery.toLowerCase().trim()
							"
							class="text-xs text-blue-600 mt-1"
						>
							Exact match - contacts will be added here
						</div>
					</li>
				</ul>
				<button
					@click="createCallList"
					class="bg-blue-600 px-2 py-2 rounded text-white hover:bg-blue-700 w-full mt-4 shadow-md"
				>
					<span v-if="exactMatch"> Pridať do "{{ exactMatch.name }}" </span>
					<span v-else> Vytvoriť Call List </span>
				</button>
			</form>
		</div>
	</div>
</template>
