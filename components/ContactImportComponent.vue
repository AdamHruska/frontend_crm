<template>
	<div v-if="loading" class="loading-overlay">
		<Loadigcomponent class="z-[10]" />
	</div>
	<div>
		<button @click="isOpen = true" class="btn btn-primary">
			Importovať kontakty
		</button>

		<div v-if="isOpen" class="z-[1]">
			<div class="blured-background"></div>
			<div class="modal-container">
				<div class="close-btn-container">
					<Icon
						icon="fa6-solid:xmark"
						class="absolute top-0 right-0 cursor-pointer hover:scale-125 transition-transform"
						@click="closeModal"
					/>
				</div>
				<div class="flex gap-4 mb-4">
					<div class="mt-1">Odporúčateľ:</div>
					<input
						type="text"
						v-model="odporucatel"
						placeholder="(voliteľné)"
						class="bg-white mb-4 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

		<!-- Duplicates Modal -->
		<div v-if="showDuplicates" class="z-[1]">
			<div class="blured-background" @click="showDuplicates = false"></div>
			<div class="modal-container duplicates-modal">
				<div class="close-btn-container">
					<Icon
						icon="fa6-solid:xmark"
						class="absolute top-0 right-0 cursor-pointer hover:scale-125 transition-transform"
						@click="showDuplicates = false"
					/>
				</div>
				<h1 class="heading">Výsledok importu</h1>

				<div class="summary-boxes">
					<div class="summary-box success">
						<span class="summary-number">{{ importResult.imported }}</span>
						<span class="summary-label">Importovaných</span>
					</div>
					<div class="summary-box warning">
						<span class="summary-number">{{
							importResult.duplicates_detected
						}}</span>
						<span class="summary-label">Duplikátov</span>
					</div>
				</div>

				<div
					v-if="importResult.duplicate_contacts?.length"
					class="duplicates-section"
				>
					<h2 class="section-title">Zoznam duplikátov</h2>
					<div class="duplicates-list">
						<div
							v-for="(dup, index) in importResult.duplicate_contacts"
							:key="index"
							class="duplicate-item"
						>
							<a :href="`/contact/${dup.id}`" class="duplicate-new">
								<!-- <span class="tag new-tag">Nový</span> -->
								<span class="contact-name"
									>{{ dup.meno }} {{ dup.priezvisko }}
								</span>
								<span class="contact-phone">{{ dup.cislo }}</span>
							</a>
						</div>
					</div>
				</div>

				<button
					@click="showDuplicates = false"
					class="btn btn-primary close-duplicates-btn"
				>
					Zavrieť
				</button>
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

const odporucatel = ref("");

const loading = ref(false);
const selectedFile = ref(null);
const isOpen = ref(false);
const showDuplicates = ref(false);
const importResult = ref({
	imported: 0,
	duplicates_detected: 0,
	duplicate_contacts: [],
});

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

	loading.value = true;

	const formData = new FormData();
	formData.append("file", selectedFile.value);

	// 👇 pridaj toto
	if (odporucatel.value) {
		formData.append("odporucitel", odporucatel.value);
	}

	try {
		const response = await axios.post(
			`${config.public.apiUrl}import-contacts`,
			formData,
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			},
		);

		importResult.value = response.data;
		closeModal();
		showDuplicates.value = true;
	} catch (error) {
		console.error(error.response?.data || error);
		alert("Import sa nepodaril.");
	} finally {
		loading.value = false;
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

.duplicates-modal {
	min-width: 560px;
	max-width: 700px;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.close-btn-container {
	position: relative;
	height: 20px;
	margin-bottom: 10px;
}

.heading {
	font-size: 1.3rem;
	font-weight: 500;
	margin-bottom: 20px;
	text-align: center;
}

.summary-boxes {
	display: flex;
	gap: 16px;
	margin-bottom: 24px;
}

.summary-box {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16px;
	border-radius: 8px;
}

.summary-box.success {
	background-color: #dcfce7;
	color: #166534;
}

.summary-box.warning {
	background-color: #fef9c3;
	color: #854d0e;
}

.summary-number {
	font-size: 2rem;
	font-weight: 700;
}

.summary-label {
	font-size: 0.85rem;
	font-weight: 500;
	margin-top: 4px;
}

.section-title {
	font-size: 1rem;
	font-weight: 600;
	margin-bottom: 12px;
	color: #374151;
}

.duplicates-section {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.duplicates-list {
	overflow-y: auto;
	max-height: 340px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding-right: 4px;
}
/*
.duplicate-item {
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	overflow: hidden;
}
*/
.duplicate-new,
.duplicate-existing {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 12px;
	flex-wrap: wrap;
}

.duplicate-new {
	background-color: #eff6ff;
	border-bottom: 1px solid #e5e7eb;
}

.duplicate-existing {
	background-color: #f9fafb;
}

.tag {
	font-size: 0.7rem;
	font-weight: 600;
	padding: 2px 8px;
	border-radius: 999px;
	white-space: nowrap;
}

.new-tag {
	background-color: #bfdbfe;
	color: #1e40af;
}

.existing-tag {
	background-color: #e5e7eb;
	color: #374151;
}

.contact-name {
	font-weight: 500;
	font-size: 0.9rem;
	color: #111827;
}

.contact-phone {
	font-size: 0.85rem;
	color: #6b7280;
}

.contact-activity {
	font-size: 0.78rem;
	color: #9ca3af;
	margin-left: auto;
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
	padding: 8px 20px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s ease;
	width: 100%;
}

.btn-primary {
	background-color: #2563eb;
}

.btn-primary:hover {
	background-color: #1d4ed8;
}

.close-duplicates-btn {
	margin-top: 20px;
	width: 100%;
}

.loading-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 2000;
}
</style>
