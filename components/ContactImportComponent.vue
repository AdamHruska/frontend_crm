<template>
	<div>
		<button @click="isOpen = true" class="btn btn-primary">
			Importovať kontakty
		</button>

		<div v-if="isOpen">
			<div class="blured-background"></div>
			<div class="modal-container">
				<div class="close-btn-container">
					<Icon
						icon="fa6-solid:xmark"
						class="absolute top-0 right-0 cursor-pointer hover:scale-125 transition-transform"
						@click="closeModal"
					/>
				</div>
				<h1 class="heading">Importovať kontakty z CSV súboru</h1>
				<div class="form-section">
					<input
						type="file"
						@change="handleFile"
						accept=".csv"
						class="file-input"
					/>
					<button @click="uploadFile" class="btn btn-primary">
						Nahrať CSV
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import axios from "axios";
const config = useRuntimeConfig();
import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();

const selectedFile = ref(null);
const isOpen = ref(false);

const handleFile = (event) => {
	selectedFile.value = event.target.files[0];
};

const closeModal = () => {
	isOpen.value = false;
	selectedFile.value = null;
};

const uploadFile = async () => {
	if (!selectedFile.value) {
		alert("Vyberte súbor CSV");
		return;
	}

	const formData = new FormData();
	formData.append("file", selectedFile.value);

	try {
		await axios.post(`${config.public.apiUrl}import-contacts`, formData, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
			},
		});

		alert("Kontakty úspešne importované");
		closeModal();
	} catch (error) {
		console.error(error.response?.data || error);
		alert("Import sa nepodaril.");
	}
};
</script>

<style scoped>
.blured-background {
	background-color: rgba(0, 0, 0, 0.5);
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1000;
}

.modal-container {
	background-color: #fff;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 30px;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	z-index: 1001;
	min-width: 400px;
}

.close-btn-container {
	position: relative;
	height: 20px;
	margin-bottom: 10px;
}

.heading {
	font-size: 1.3rem;
	font-weight: 500;
	margin-bottom: 30px;
	text-align: center;
}

.form-section {
	display: flex;
	flex-direction: column;
	gap: 15px;
	margin-top: 20px;
}

.file-input {
	padding: 10px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	cursor: pointer;
}

.btn {
	color: white;
	padding: 10px 20px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

.btn-primary {
	background-color: #2563eb;
}

.btn-primary:hover {
	background-color: #1d4ed8;
}
</style>
