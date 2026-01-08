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

const emits = defineEmits([
	"cancleCallListForm",
	"uncheckAll",
	"refreshCallLists",
	"cancelDelegateForm",
]);

const props = defineProps({
	selected: {
		type: Array,
		required: false,
	},
});

onMounted(() => {
	console.log("Selected contacts for delegation:", props.selected);
});

// const alterPerson = async (id) => {
// 	const person = {
// 		id: props.single_contact.id,
// 		meno: meno.value,
// 		priezvisko: priezvisko.value,
// 		poradca: poradca.value ? String(poradca.value) : "",
// 		cislo: cislo.value,
// 		email: email.value,
// 		odporucitel: odporucitel.value,
// 		adresa: adresa.value,
// 		vek: rok_narodenia.value,
// 		zamestanie: zamestanie.value,
// 		poznamka: poznamka.value,
// 		Investicny_dotaznik: Investicny_dotaznik.value,
// 		author_id: selectedAuthorId.value,
// 		is_deleted: true,
// 		current_advisor: aktualnyPoradca.value,
// 	};
// 	// console.log(person);
// 	const response = await axios.put(
// 		`${config.public.apiUrl}post-update-contact/${id}`,
// 		person,
// 		{
// 			headers: {
// 				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
// 			},
// 		}
// 	);

// 	if (response.status === 200) {
// 		toast.success("Úspešne upravené!");
// 	} else {
// 		toast.error("Niečo sa pokazilo!");
// 	}
// 	emit("alterPerson", response.data.contact);
// };

const filteredUsers = computed(() => {
	if (!searchQuery.value) {
		return userStore.allUsers;
	}

	const query = searchQuery.value.toLowerCase();

	return userStore.allUsers.filter((user) => {
		return (
			user.first_name?.toLowerCase().includes(query) ||
			user.last_name?.toLowerCase().includes(query) ||
			user.email?.toLowerCase().includes(query)
		);
	});
});

const handleSearch = (query) => {
	searchQuery.value = query;
	console.log("Search Query in Parent:", searchQuery.value);
};

const delegateContacts = async (newAuthorId) => {
	loadingState.value = true;

	try {
		await Promise.all(
			props.selected.map((contact) =>
				axios.put(
					`${config.public.apiUrl}post-update-contact/${contact.id}`,
					{ author_id: newAuthorId },
					{
						headers: {
							Authorization: `Bearer ${sessionStorage.getItem("token")}`,
						},
					}
				)
			)
		);

		emits("refreshCallLists");
		emits("uncheckAll");
		emits("cancelDelegateForm");
	} finally {
		loadingState.value = false;
		location.reload();
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
					@click="emits('cancelDelegateForm')"
					class="absolute right-3 top-2 hover:bg-black hover:bg-opacity-10 rounded-full p-2"
				>
					<Icon
						icon="fa6-solid:xmark"
						class="cursor-pointer text-xl text-gray-600 hover:text-red-500"
					/>
				</button>
				<CallListAddSearchBar
					class="mb-2 mt-4 shadow-md"
					@update-search="handleSearch"
				/>
				<div
					class="py-3 max-h-[500px] overflow-y-auto border-t border-b border-gray-300"
				>
					<div
						v-for="user in filteredUsers"
						:key="user.id"
						@click="delegateContacts(user.id)"
						class="py-2 px-3 hover:bg-gray-200 rounded text-black cursor-pointer my-1"
					>
						<span class="font-semibold">
							{{ user.first_name }} {{ user.last_name }}
						</span>
						- ({{ user.email }})
					</div>
				</div>
			</form>
		</div>
	</div>
</template>
