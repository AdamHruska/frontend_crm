<script setup>
const config = useRuntimeConfig();
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { ref, computed } from "vue";
import { useCallListStore } from "#imports";
const callListStore = useCallListStore();

const authStore = useAuthStore();
authStore.loadToken();
const token = ref("");
const searchQuery = ref("");

const emits = defineEmits(["cancleCallListForm", "uncheckAll"]);

const props = defineProps({
	callListNames: {
		type: Array,
		required: true,
	},
	selected: {
		type: Array,
		required: true,
	},
	user_id: {
		type: Number,
		required: true,
	},
});

const filteredCallLists = computed(() => {
	return props.callListNames.filter((list) =>
		list.name.toLowerCase().includes(searchQuery.value.toLowerCase())
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
	let status = 0;
	var callList = {
		author_id: props.user_id,
		name: searchQuery.value,
		contact_ids: props.selected.map((person) => person.id),
	};
	console.log("Call list created 1", callList);
	if (!filteredCallLists.value[0]) {
		const response = await axios.post(
			`${config.public.apiUrl}call-lists`,
			{
				author_id: props.user_id,
				name: searchQuery.value,
				contact_ids: props.selected.map((person) => person.id),
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);
		callListStore.callLists.push(response.data);
		console.log("Call list created 1", response.status);
		status = response.status;
	} else {
		const response = await axios.post(
			`${config.public.apiUrl}call-lists`,
			{
				author_id: props.user_id,
				name: filteredCallLists.value[0].name,
				contact_ids: props.selected.map((person) => person.id),
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			}
		);
		status = response.status;
	}

	emits("cancleCallListForm", status);
	emits("uncheckAll");
};

const addToCallList = async (callList) => {
	let status = 0;
	var old_contact_ids = callList.contact_ids;
	old_contact_ids = JSON.parse(old_contact_ids.replace(/'/g, '"'));
	var new_contact_ids = [
		...old_contact_ids,
		...props.selected.map((person) => person.id),
	];

	const response = await axios.put(
		`${config.public.apiUrl}call-lists/${callList.id}`,
		{
			author_id: props.user_id,
			name: callList.name,
			contact_ids: new_contact_ids,
		},
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
				"Content-Type": "application/json",
			},
		}
	);

	const callListResponse = await axios.post(
		`${config.public.apiUrl}call-list`,
		{ ids: new_contact_ids }, // Make sure it's sent as {ids: [...]}
		{
			headers: {
				Authorization: `Bearer ${authStore.token}`,
				"Content-Type": "application/json",
			},
		}
	);
	console.log("skuska skuska skuska", callListResponse.data.contacts);
	callListStore.selectedCallListPeople = callListResponse.data.contacts;
	if (callListStore.selectedCallList === callList.id) {
		console.log("Call list sa rovna");
	}
	status = response.status;
	emits("cancleCallListForm", status);
	emits("uncheckAll");
};
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center z-50"
	>
		<div class="absolute inset-0 bg-gray-400 bg-opacity-50 backdrop-blur-sm">
			<form
				class="relative bg-gray-100 p-6 pt-8 mt-8 rounded-lg shadow-lg max-w-md w-full z-10 mx-auto my-auto w-[350px]"
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
					>
						<div class="font-semibold">{{ callList.name }}</div>
					</li>
				</ul>
			</form>
		</div>
	</div>
</template>
