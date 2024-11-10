<script setup>
const showDropdown = ref(false);
const selectedContact = ref(null);
const searchText = ref("");

const props = defineProps({
	contactsProp: Array,
});

// Define emit
const emit = defineEmits(["selectedContact"]);

const removeDiacritics = (str) => {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const filteredContacts = computed(() => {
	if (!searchText.value) return props.contactsProp;

	const searchTerms = removeDiacritics(searchText.value.toLowerCase()).split(
		" "
	);

	return props.contactsProp.filter((contact) => {
		const normalizedFirstName = removeDiacritics(contact.meno.toLowerCase());
		const normalizedLastName = removeDiacritics(
			contact.priezvisko.toLowerCase()
		);

		const fullNameNormal = `${normalizedFirstName} ${normalizedLastName}`;
		const fullNameReverse = `${normalizedLastName} ${normalizedFirstName}`;

		return searchTerms.every(
			(term) => fullNameNormal.includes(term) || fullNameReverse.includes(term)
		);
	});
});

const handleContactSelect = (contact) => {
	selectedContact.value = contact;
	showDropdown.value = false;
	searchText.value = "";
	emit("selectedContact", contact);
	console.log(contact);
};

const toggleDropdown = () => {
	showDropdown.value = !showDropdown.value;
};

const dropdownRef = ref(null);

onMounted(() => {
	document.addEventListener("click", (event) => {
		if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
			showDropdown.value = false;
		}
	});
});
</script>

<template>
	<div ref="dropdownRef" class="relative">
		<div
			@click="toggleDropdown"
			class="bg-slate-700 w-full h-[30px] rounded cursor-pointer flex items-center px-3"
		>
			{{
				selectedContact
					? `${selectedContact.meno} ${selectedContact.priezvisko}`
					: "Select an option"
			}}
		</div>
		<div
			v-if="showDropdown"
			class="absolute w-full mt-1 bg-slate-700 rounded shadow-lg z-10 py-2"
		>
			<input
				v-model="searchText"
				type="text"
				class="w-full mb-2 p-1 pl-0 bg-slate-700 text-white pl-2 border-b-2 border-slate-500 focus:border-blue-500 w-[95%]"
				placeholder="Vyhľadajte kontakt ..."
			/>
			<div
				v-for="contact in filteredContacts"
				:key="contact.id"
				@click="handleContactSelect(contact)"
				class="pl-2 pb-1 hover:bg-slate-500 cursor-pointer"
			>
				{{ contact.meno }} {{ contact.priezvisko }}
			</div>
		</div>
	</div>
</template>
