<template>
	<div class="categories-page">
		<div class="page-header">
			<div class="header-left">
				<h1 class="page-title">Kategórie</h1>
				<p class="page-subtitle">{{ categories.length }} kategórií</p>
			</div>
			<button class="btn-create" @click="openCreateModal">
				<span class="btn-icon">+</span>
				Nová kategória
			</button>
		</div>

		<div v-if="loading" class="loading-grid">
			<div v-for="n in 4" :key="n" class="skeleton-card" />
		</div>

		<div v-else-if="categories.length === 0" class="empty-state">
			<div class="empty-icon">📂</div>
			<h3>Žiadne kategórie</h3>
			<p>Vytvor svoju prvú kategóriu a začni organizovať kontakty.</p>
			<button class="btn-create" @click="openCreateModal">
				Vytvoriť kategóriu
			</button>
		</div>

		<div v-else class="categories-grid">
			<div
				v-for="category in categories"
				:key="category.id"
				class="category-card"
			>
				<div class="card-header">
					<div class="category-image-wrap">
						<img
							:src="category.image"
							:alt="category.name"
							class="category-image"
							@error="onImgError($event)"
						/>
					</div>
					<div class="card-actions">
						<button
							class="icon-btn"
							title="Upraviť"
							@click="openEditModal(category)"
						>
							✏️
						</button>
						<button
							class="icon-btn danger"
							title="Vymazať"
							@click="confirmDelete(category)"
						>
							🗑️
						</button>
					</div>
				</div>

				<div class="card-meta">
					<h2 class="category-name">{{ category.name }}</h2>
					<span class="contact-count"
						>{{ category.contacts?.length ?? 0 }} kontaktov</span
					>
				</div>

				<div
					class="contacts-bubbles"
					v-if="category.contacts && category.contacts.length"
				>
					<div
						v-for="contact in category.contacts.slice(0, 8)"
						:key="contact.id"
						class="contact-bubble"
						:title="`${contact.meno} ${contact.priezvisko}`"
					>
						{{ initials(contact.meno, contact.priezvisko) }}
						<button
							class="bubble-remove"
							title="Odobrať z kategórie"
							@click.stop="removeContactFromCategory(category.id, contact.id)"
						>
							×
						</button>
					</div>
					<div v-if="category.contacts.length > 8" class="bubble-more">
						+{{ category.contacts.length - 8 }}
					</div>
				</div>
				<div v-else-if="category.contacts" class="no-contacts-hint">
					Žiadne kontakty
				</div>

				<button class="btn-add-contact" @click="openAddContactModal(category)">
					<span>+</span> Pridať kontakt
				</button>
			</div>
		</div>

		<!-- ───── CREATE / EDIT CATEGORY MODAL ───── -->
		<Teleport to="body">
			<div
				v-if="showCategoryModal"
				class="modal-overlay"
				@click.self="closeCategoryModal"
			>
				<div class="modal">
					<h2 class="modal-title">
						{{ editingCategory ? "Upraviť kategóriu" : "Nová kategória" }}
					</h2>

					<label class="field-label">Názov *</label>
					<input
						v-model="categoryForm.name"
						class="field-input"
						placeholder="napr. Ľudia zo zahraničia"
						@keyup.enter="saveCategory"
					/>

					<label class="field-label">URL obrázka (voliteľné)</label>
					<input
						v-model="categoryForm.image"
						class="field-input"
						placeholder="https://..."
					/>

					<div v-if="categoryForm.image" class="image-preview-wrap">
						<img
							:src="categoryForm.image"
							class="image-preview"
							@error="onImgError($event)"
						/>
					</div>

					<p v-if="modalError" class="modal-error">{{ modalError }}</p>

					<div class="modal-actions">
						<button class="btn-cancel" @click="closeCategoryModal">
							Zrušiť
						</button>
						<button
							class="btn-save"
							:disabled="savingCategory"
							@click="saveCategory"
						>
							{{
								savingCategory
									? "Ukladám..."
									: editingCategory
										? "Uložiť zmeny"
										: "Vytvoriť"
							}}
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ───── ADD CONTACT MODAL ───── -->
		<Teleport to="body">
			<div
				v-if="showAddContactModal"
				class="modal-overlay"
				@click.self="closeAddContactModal"
			>
				<div class="modal modal-wide">
					<template v-if="addContactView === 'search'">
						<div class="modal-header-row">
							<h2 class="modal-title">
								Pridať kontakt do „{{ targetCategory?.name }}"
							</h2>
						</div>

						<input
							v-model="contactSearch"
							class="field-input"
							placeholder="Hľadaj podľa mena alebo priezviska..."
						/>

						<div class="contacts-list">
							<div
								v-for="c in filteredContacts"
								:key="c.id"
								class="contact-list-item"
								@click="assignContact(c)"
							>
								<div class="contact-avatar">
									{{ initials(c.meno, c.priezvisko) }}
								</div>
								<div class="contact-info">
									<strong>{{ c.meno }} {{ c.priezvisko }}</strong>
									<span>{{ c.cislo || c.email || "—" }}</span>
								</div>
								<span class="assign-icon">→</span>
							</div>
							<p
								v-if="filteredContacts.length === 0 && contactSearch"
								class="no-results"
							>
								Žiadne výsledky pre „{{ contactSearch }}"
							</p>
							<p v-else-if="filteredContacts.length === 0" class="no-results">
								Všetky kontakty sú už priradené
							</p>
						</div>

						<div class="divider-row">
							<span class="divider-line" /><span class="divider-text"
								>alebo</span
							><span class="divider-line" />
						</div>

						<button class="btn-new-contact" @click="addContactView = 'create'">
							<span class="btn-plus">+</span> Vytvoriť nový kontakt
						</button>

						<div class="modal-actions">
							<button class="btn-cancel" @click="closeAddContactModal">
								Zavrieť
							</button>
						</div>
					</template>

					<template v-else-if="addContactView === 'create'">
						<div class="modal-header-row">
							<button class="btn-back" @click="addContactView = 'search'">
								← Späť
							</button>
							<h2 class="modal-title">Nový kontakt</h2>
						</div>

						<div class="form-grid">
							<div class="form-field">
								<label class="field-label">Meno *</label>
								<input
									v-model="newContact.meno"
									class="field-input"
									placeholder="Ján"
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Priezvisko *</label>
								<input
									v-model="newContact.priezvisko"
									class="field-input"
									placeholder="Novák"
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Telefón</label>
								<input
									v-model="newContact.cislo"
									class="field-input"
									placeholder="+421..."
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Email</label>
								<input
									v-model="newContact.email"
									class="field-input"
									placeholder="jan@email.sk"
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Odporúčateľ *</label>
								<input
									v-model="newContact.odporucitel"
									class="field-input"
									placeholder="Kto ho odporučil"
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Vek</label>
								<input
									v-model="newContact.vek"
									class="field-input"
									type="number"
									placeholder="30"
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Zamestnanie</label>
								<input
									v-model="newContact.zamestanie"
									class="field-input"
									placeholder="Programátor"
								/>
							</div>
							<div class="form-field">
								<label class="field-label">Adresa</label>
								<input
									v-model="newContact.adresa"
									class="field-input"
									placeholder="Bratislava"
								/>
							</div>
							<div class="form-field form-field-full">
								<label class="field-label">Poznámka</label>
								<textarea
									v-model="newContact.poznamka"
									class="field-input field-textarea"
									placeholder="Poznámky ku kontaktu..."
								/>
							</div>
						</div>

						<p v-if="createContactError" class="modal-error">
							{{ createContactError }}
						</p>

						<div class="modal-actions">
							<button class="btn-cancel" @click="addContactView = 'search'">
								Zrušiť
							</button>
							<button
								class="btn-save"
								:disabled="creatingContact"
								@click="createAndAssignContact"
							>
								{{ creatingContact ? "Vytváram..." : "Vytvoriť a pridať" }}
							</button>
						</div>
					</template>
				</div>
			</div>
		</Teleport>

		<!-- ───── DELETE CONFIRM MODAL ───── -->
		<Teleport to="body">
			<div
				v-if="showDeleteModal"
				class="modal-overlay"
				@click.self="showDeleteModal = false"
			>
				<div class="modal modal-sm">
					<h2 class="modal-title">Vymazať kategóriu?</h2>
					<p class="delete-desc">
						Kategória <strong>{{ deletingCategory?.name }}</strong> bude
						vymazaná. Kontakty zostanú zachované, len sa im zruší priradenie.
					</p>
					<div class="modal-actions">
						<button class="btn-cancel" @click="showDeleteModal = false">
							Zrušiť
						</button>
						<button
							class="btn-delete"
							:disabled="deletingFlag"
							@click="deleteCategory"
						>
							{{ deletingFlag ? "Mažem..." : "Vymazať" }}
						</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const config = useRuntimeConfig();
const authStore = useAuthStore();

const categories = ref([]);
const allContacts = ref([]);
const loading = ref(true);

const showCategoryModal = ref(false);
const editingCategory = ref(null);
const savingCategory = ref(false);
const modalError = ref("");
const categoryForm = ref({ name: "", image: "" });

const showAddContactModal = ref(false);
const addContactView = ref("search");
const targetCategory = ref(null);
const contactSearch = ref("");

const creatingContact = ref(false);
const createContactError = ref("");
const newContact = ref({
	meno: "",
	priezvisko: "",
	cislo: "",
	email: "",
	odporucitel: "",
	vek: "",
	zamestanie: "",
	adresa: "",
	poznamka: "",
});

const showDeleteModal = ref(false);
const deletingCategory = ref(null);
const deletingFlag = ref(false);

const headers = computed(() => ({
	Authorization: `Bearer ${authStore.token}`,
}));

const initials = (meno, priezvisko) =>
	`${(meno?.[0] ?? "").toUpperCase()}${(priezvisko?.[0] ?? "").toUpperCase()}`;

const onImgError = (e) => {
	e.target.src =
		"https://thumbs.dreamstime.com/b/man-icon-vector-person-symbol-pictogram-illustration-glyph-97085462.jpg?w=768";
};

const filteredContacts = computed(() => {
	const q = contactSearch.value.toLowerCase().trim();
	const assigned = new Set(
		(targetCategory.value?.contacts ?? []).map((c) => c.id),
	);
	return allContacts.value.filter(
		(c) =>
			!assigned.has(c.id) &&
			(!q ||
				c.meno?.toLowerCase().includes(q) ||
				c.priezvisko?.toLowerCase().includes(q)),
	);
});

const resetNewContact = () => {
	newContact.value = {
		meno: "",
		priezvisko: "",
		cislo: "",
		email: "",
		odporucitel: "",
		vek: "",
		zamestanie: "",
		adresa: "",
		poznamka: "",
	};
	createContactError.value = "";
};

const fetchCategories = async () => {
	loading.value = true;
	try {
		const res = await axios.get(`${config.public.apiUrl}categories`, {
			headers: headers.value,
		});
		const cats = res.data.categories;
		await Promise.all(
			cats.map(async (cat) => {
				try {
					const r = await axios.get(
						`${config.public.apiUrl}categories/${cat.id}/contacts`,
						{ headers: headers.value },
					);
					cat.contacts = r.data.contacts;
				} catch {
					cat.contacts = [];
				}
			}),
		);
		categories.value = cats;
	} catch (err) {
		console.error("Chyba pri načítaní kategórií:", err);
	} finally {
		loading.value = false;
	}
};

const fetchAllContacts = async () => {
	try {
		const res = await axios.get(
			`${config.public.apiUrl}contacts-without-pagination`,
			{
				headers: headers.value,
			},
		);
		allContacts.value = res.data.contacts ?? res.data ?? [];
	} catch (err) {
		console.error("Chyba pri načítaní kontaktov:", err);
	}
};

const openCreateModal = () => {
	editingCategory.value = null;
	categoryForm.value = { name: "", image: "" };
	modalError.value = "";
	showCategoryModal.value = true;
};
const openEditModal = (cat) => {
	editingCategory.value = cat;
	categoryForm.value = { name: cat.name, image: cat.image ?? "" };
	modalError.value = "";
	showCategoryModal.value = true;
};
const closeCategoryModal = () => {
	showCategoryModal.value = false;
};

const saveCategory = async () => {
	modalError.value = "";
	if (!categoryForm.value.name.trim()) {
		modalError.value = "Názov je povinný";
		return;
	}
	savingCategory.value = true;
	try {
		if (editingCategory.value) {
			await axios.put(
				`${config.public.apiUrl}categories/${editingCategory.value.id}`,
				categoryForm.value,
				{ headers: headers.value },
			);
		} else {
			await axios.post(
				`${config.public.apiUrl}categories`,
				categoryForm.value,
				{ headers: headers.value },
			);
		}
		closeCategoryModal();
		await fetchCategories();
	} catch (err) {
		modalError.value = err.response?.data?.message ?? "Chyba pri ukladaní";
	} finally {
		savingCategory.value = false;
	}
};

const confirmDelete = (cat) => {
	deletingCategory.value = cat;
	showDeleteModal.value = true;
};
const deleteCategory = async () => {
	deletingFlag.value = true;
	try {
		await axios.delete(
			`${config.public.apiUrl}categories/${deletingCategory.value.id}`,
			{ headers: headers.value },
		);
		showDeleteModal.value = false;
		await fetchCategories();
	} catch (err) {
		console.error(err);
	} finally {
		deletingFlag.value = false;
	}
};

const openAddContactModal = async (cat) => {
	targetCategory.value = cat;
	contactSearch.value = "";
	addContactView.value = "search";
	resetNewContact();
	showAddContactModal.value = true;
	if (allContacts.value.length === 0) await fetchAllContacts();
};
const closeAddContactModal = () => {
	showAddContactModal.value = false;
	targetCategory.value = null;
	addContactView.value = "search";
	resetNewContact();
};

const assignContact = async (contact) => {
	try {
		await axios.post(
			`${config.public.apiUrl}categories/${targetCategory.value.id}/contacts`,
			{ contact_id: contact.id },
			{ headers: headers.value },
		);
		targetCategory.value.contacts = [
			...(targetCategory.value.contacts ?? []),
			contact,
		];
		const idx = categories.value.findIndex(
			(c) => c.id === targetCategory.value.id,
		);
		if (idx !== -1) categories.value[idx] = { ...targetCategory.value };
	} catch (err) {
		console.error(err);
	}
};

const createAndAssignContact = async () => {
	createContactError.value = "";
	if (!newContact.value.meno.trim()) {
		createContactError.value = "Meno je povinné";
		return;
	}
	if (!newContact.value.priezvisko.trim()) {
		createContactError.value = "Priezvisko je povinné";
		return;
	}
	if (!newContact.value.odporucitel.trim()) {
		createContactError.value = "Odporúčateľ je povinný";
		return;
	}
	creatingContact.value = true;
	try {
		const res = await axios.post(
			`${config.public.apiUrl}post-create-contact`,
			{
				meno: newContact.value.meno,
				priezvisko: newContact.value.priezvisko,
				cislo: newContact.value.cislo || null,
				email: newContact.value.email || null,
				odporucitel: newContact.value.odporucitel,
				vek: newContact.value.vek || null,
				zamestanie: newContact.value.zamestanie || null,
				adresa: newContact.value.adresa || null,
				poznamka: newContact.value.poznamka || null,
				isNew: true,
				isContact: true,
				isCoWorker: false,
			},
			{ headers: headers.value },
		);
		const createdContact = res.data.contact;
		await axios.post(
			`${config.public.apiUrl}categories/${targetCategory.value.id}/contacts`,
			{ contact_id: createdContact.id },
			{ headers: headers.value },
		);
		targetCategory.value.contacts = [
			...(targetCategory.value.contacts ?? []),
			createdContact,
		];
		const idx = categories.value.findIndex(
			(c) => c.id === targetCategory.value.id,
		);
		if (idx !== -1) categories.value[idx] = { ...targetCategory.value };
		allContacts.value = [...allContacts.value, createdContact];
		addContactView.value = "search";
		resetNewContact();
	} catch (err) {
		createContactError.value =
			err.response?.status === 409
				? (err.response?.data?.message ?? "Kontakt už existuje")
				: (err.response?.data?.message ?? "Chyba pri vytváraní kontaktu");
	} finally {
		creatingContact.value = false;
	}
};

const removeContactFromCategory = async (categoryId, contactId) => {
	try {
		await axios.delete(
			`${config.public.apiUrl}categories/${categoryId}/contacts/${contactId}`,
			{ headers: headers.value },
		);
		const cat = categories.value.find((c) => c.id === categoryId);
		if (cat) cat.contacts = cat.contacts.filter((c) => c.id !== contactId);
	} catch (err) {
		console.error(err);
	}
};

onMounted(() => {
	fetchCategories();
});
</script>

<style scoped>
/* ── Base ───────────────────────────────────────────────── */
.categories-page {
	min-height: 100vh;
	padding: 2rem 2.5rem;
	background: #f4f6fb;
	color: #111827;
	font-family: "Segoe UI", system-ui, sans-serif;
}

/* ── Header ─────────────────────────────────────────────── */
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin-bottom: 2.5rem;
}
.page-title {
	font-size: 2rem;
	font-weight: 800;
	letter-spacing: -0.5px;
	margin: 0;
	color: #111827;
}
.page-subtitle {
	font-size: 0.85rem;
	color: #9ca3af;
	margin: 0.25rem 0 0;
}

/* ── Buttons ────────────────────────────────────────────── */
.btn-create {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: #4f46e5;
	color: #fff;
	border: none;
	border-radius: 10px;
	padding: 0.65rem 1.25rem;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.2s,
		transform 0.15s;
	box-shadow: 0 2px 8px #4f46e530;
}
.btn-create:hover {
	background: #4338ca;
	transform: translateY(-1px);
}
.btn-icon {
	font-size: 1.2rem;
	line-height: 1;
}

/* ── Grid ───────────────────────────────────────────────── */
.categories-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
}

/* ── Card ───────────────────────────────────────────────── */
.category-card {
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 16px;
	padding: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	transition:
		border-color 0.2s,
		box-shadow 0.2s;
	box-shadow: 0 1px 4px #0000000a;
}
.category-card:hover {
	border-color: #c7d2fe;
	box-shadow: 0 6px 24px #4f46e514;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.category-image-wrap {
	width: 96px;
	height: 96px;
	border-radius: 12px;
	overflow: hidden;
	background: #f3f4f6;
	flex-shrink: 0;
	border: 1px solid #e5e7eb;
}
.category-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.card-actions {
	display: flex;
	gap: 0.4rem;
}
.icon-btn {
	background: #f3f4f6;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	width: 32px;
	height: 32px;
	cursor: pointer;
	font-size: 0.85rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.15s;
}
.icon-btn:hover {
	background: #e5e7eb;
}
.icon-btn.danger:hover {
	background: #fee2e2;
	border-color: #fca5a5;
}

.card-meta {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}
.category-name {
	margin: 0;
	font-size: 1.05rem;
	font-weight: 700;
	color: #111827;
}
.contact-count {
	font-size: 0.78rem;
	color: #9ca3af;
}

/* ── Bubbles ────────────────────────────────────────────── */
.contacts-bubbles {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
.contact-bubble {
	position: relative;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366f1, #8b5cf6);
	color: #fff;
	font-size: 0.72rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: default;
	transition: transform 0.15s;
	box-shadow: 0 2px 6px #6366f130;
}
.contact-bubble:hover {
	transform: scale(1.1);
}
.contact-bubble:hover .bubble-remove {
	opacity: 1;
}

.bubble-remove {
	position: absolute;
	top: -4px;
	right: -4px;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #ef4444;
	border: none;
	color: #fff;
	font-size: 10px;
	cursor: pointer;
	opacity: 0;
	transition: opacity 0.15s;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	box-shadow: 0 1px 4px #0000002a;
}
.bubble-more {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: #f3f4f6;
	color: #6366f1;
	font-size: 0.7rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1.5px dashed #c7d2fe;
}
.no-contacts-hint {
	font-size: 0.8rem;
	color: #d1d5db;
	font-style: italic;
}

/* ── Add contact btn ────────────────────────────────────── */
.btn-add-contact {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	background: transparent;
	border: 1.5px dashed #c7d2fe;
	border-radius: 10px;
	color: #6366f1;
	padding: 0.5rem;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s,
		border-color 0.15s;
	margin-top: auto;
}
.btn-add-contact:hover {
	background: #eef2ff;
	border-color: #6366f1;
}

/* ── Empty & Loading ────────────────────────────────────── */
.empty-state {
	text-align: center;
	padding: 5rem 2rem;
	color: #9ca3af;
}
.empty-icon {
	font-size: 3rem;
	margin-bottom: 1rem;
}
.empty-state h3 {
	color: #374151;
	margin-bottom: 0.5rem;
}
.empty-state p {
	margin-bottom: 1.5rem;
}

.loading-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
}
.skeleton-card {
	height: 220px;
	border-radius: 16px;
	background: linear-gradient(90deg, #f3f4f6 25%, #e9eaf0 50%, #f3f4f6 75%);
	background-size: 200% 100%;
	animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}

/* ── Modal overlay ──────────────────────────────────────── */
.modal-overlay {
	position: fixed;
	inset: 0;
	background: #00000040;
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}
.modal {
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 16px;
	padding: 2rem;
	width: 100%;
	max-width: 440px;
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 60px #0000001a;
}
.modal-wide {
	max-width: 580px;
}
.modal-sm {
	max-width: 360px;
}

.modal::-webkit-scrollbar {
	width: 4px;
}
.modal::-webkit-scrollbar-track {
	background: transparent;
}
.modal::-webkit-scrollbar-thumb {
	background: #e5e7eb;
	border-radius: 4px;
}

.modal-header-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.25rem;
}
.modal-title {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 700;
	color: #111827;
}

.btn-back {
	background: #f3f4f6;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	color: #6b7280;
	padding: 0.35rem 0.75rem;
	font-size: 0.82rem;
	cursor: pointer;
	transition: background 0.15s;
	white-space: nowrap;
	flex-shrink: 0;
}
.btn-back:hover {
	background: #e5e7eb;
	color: #111827;
}

.field-label {
	font-size: 0.82rem;
	color: #6b7280;
	margin-bottom: -0.4rem;
	font-weight: 500;
}
.field-input {
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	color: #111827;
	padding: 0.65rem 0.85rem;
	font-size: 0.9rem;
	outline: none;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
	width: 100%;
	box-sizing: border-box;
}
.field-input:focus {
	border-color: #6366f1;
	box-shadow: 0 0 0 3px #6366f118;
}
.field-input::placeholder {
	color: #d1d5db;
}
.field-textarea {
	resize: vertical;
	min-height: 72px;
	font-family: inherit;
}

.form-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;
}
.form-field {
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
}
.form-field-full {
	grid-column: 1 / -1;
}

.image-preview-wrap {
	display: flex;
	justify-content: center;
}
.image-preview {
	width: 72px;
	height: 72px;
	object-fit: cover;
	border-radius: 12px;
	border: 1px solid #e5e7eb;
}

.modal-error {
	color: #ef4444;
	font-size: 0.82rem;
	margin: 0;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 0.5rem;
}
.btn-cancel {
	background: #f3f4f6;
	color: #6b7280;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 0.6rem 1.1rem;
	cursor: pointer;
	font-size: 0.88rem;
	transition: background 0.15s;
}
.btn-cancel:hover {
	background: #e5e7eb;
}

.btn-save {
	background: #4f46e5;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 0.6rem 1.2rem;
	font-size: 0.88rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
	box-shadow: 0 2px 8px #4f46e530;
}
.btn-save:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.btn-save:hover:not(:disabled) {
	background: #4338ca;
}

.btn-delete {
	background: #dc2626;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 0.6rem 1.2rem;
	font-size: 0.88rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.btn-delete:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.btn-delete:hover:not(:disabled) {
	background: #b91c1c;
}

.delete-desc {
	color: #6b7280;
	font-size: 0.9rem;
	margin: 0;
}

.divider-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}
.divider-line {
	flex: 1;
	height: 1px;
	background: #e5e7eb;
}
.divider-text {
	font-size: 0.78rem;
	color: #9ca3af;
	white-space: nowrap;
}

.btn-new-contact {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	background: #fafafa;
	border: 1.5px dashed #c7d2fe;
	border-radius: 10px;
	color: #6366f1;
	padding: 0.7rem;
	font-size: 0.88rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s,
		border-color 0.15s;
	width: 100%;
}
.btn-new-contact:hover {
	background: #eef2ff;
	border-color: #6366f1;
}
.btn-plus {
	font-size: 1.1rem;
}

.contacts-list {
	max-height: 260px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
	padding-right: 0.25rem;
}
.contacts-list::-webkit-scrollbar {
	width: 4px;
}
.contacts-list::-webkit-scrollbar-track {
	background: transparent;
}
.contacts-list::-webkit-scrollbar-thumb {
	background: #e5e7eb;
	border-radius: 4px;
}

.contact-list-item {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.65rem 0.85rem;
	border-radius: 10px;
	cursor: pointer;
	transition: background 0.15s;
	border: 1px solid transparent;
}
.contact-list-item:hover {
	background: #f5f3ff;
	border-color: #e0e7ff;
}

.contact-avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366f1, #8b5cf6);
	color: #fff;
	font-size: 0.75rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.contact-info {
	display: flex;
	flex-direction: column;
	flex: 1;
}
.contact-info strong {
	font-size: 0.88rem;
	color: #111827;
}
.contact-info span {
	font-size: 0.78rem;
	color: #9ca3af;
}
.assign-icon {
	color: #6366f1;
	font-size: 1rem;
}
.no-results {
	color: #9ca3af;
	font-size: 0.85rem;
	text-align: center;
	padding: 1rem 0;
}
</style>
