<template>
	<div class="categories-page">
		<div class="page-header">
			<div class="flex gap-4">
				<div class="header-left mr-10">
					<h1 class="page-title">Kategórie</h1>
					<p class="page-subtitle">{{ categories.length }} kategórií</p>
				</div>

				<!-- Odporúčateľ (klient) -->
				<div class="header-field">
					<label class="header-field-label">Odporúčateľ</label>
					<input
						v-model="globalOdporucitel"
						class="header-field-input"
						placeholder="Meno klienta..."
					/>
				</div>

				<!-- Poradca (majiteľ kontaktu) -->
				<div class="header-field">
					<label class="header-field-label">Poradca</label>
					<select
						v-model="selectedAdvisor"
						class="header-field-input header-field-select"
					>
						<option v-for="u in advisors" :key="u.id" :value="u.id">
							{{ u.name }}
						</option>
					</select>
				</div>
			</div>

			<div class="header-controls">
				<button class="btn-create" @click="openCreateModal">
					<span class="btn-icon">+</span>
					Nová kategória
				</button>
			</div>
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

		<!-- ── Category blocks ── -->
		<div v-else class="categories-list">
			<div
				v-for="category in categories"
				:key="category.id"
				class="category-block"
			>
				<!-- Category header bar -->
				<div class="category-bar">
					<div class="category-bar-left">
						<div class="category-image-wrap">
							<img
								:src="category.image"
								:alt="category.name"
								class="category-image"
								@error="onImgError($event)"
							/>
						</div>
						<div>
							<h2 class="category-name">{{ category.name }}</h2>
							<span class="contact-count"
								>{{ category.contacts?.length ?? 0 }} kontaktov</span
							>
						</div>
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

				<!-- Contacts table -->
				<div class="contacts-table-wrap">
					<table class="contacts-table">
						<thead>
							<tr>
								<th>Meno</th>
								<th>Priezvisko</th>
								<th>Telefón</th>
								<th>Email</th>
								<th>Vek</th>
								<th>Zamestnanie</th>
								<th>Adresa</th>
								<th>Poznámka</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<!-- Existing contacts -->
							<tr
								v-for="contact in category.contacts"
								:key="contact.id"
								class="contact-row existing-row"
							>
								<td>{{ contact.meno }}</td>
								<td>{{ contact.priezvisko }}</td>
								<td>{{ contact.cislo || "—" }}</td>
								<td>{{ contact.email || "—" }}</td>
								<td>
									{{
										contact.rok_narodenia
											? new Date().getFullYear() - contact.rok_narodenia
											: "—"
									}}
								</td>
								<td>{{ contact.zamestanie || "—" }}</td>
								<td>{{ contact.adresa || "—" }}</td>
								<td>{{ contact.poznamka || "—" }}</td>
								<td>
									<button
										class="row-remove-btn"
										title="Odobrať z kategórie"
										@click="removeContactFromCategory(category.id, contact.id)"
									>
										×
									</button>
								</td>
							</tr>

							<!-- New contact input rows -->
							<tr
								v-for="(row, idx) in category.newRows"
								:key="`new-${idx}`"
								class="contact-row new-row"
							>
								<td>
									<input
										v-model="row.meno"
										class="row-input"
										placeholder="Meno"
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.priezvisko"
										class="row-input"
										placeholder="Priezvisko"
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.cislo"
										class="row-input"
										placeholder="+421..."
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.email"
										class="row-input"
										placeholder="email@..."
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.vek"
										class="row-input"
										placeholder="30"
										type="number"
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.zamestanie"
										class="row-input"
										placeholder="Povolanie"
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.adresa"
										class="row-input"
										placeholder="Mesto"
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<input
										v-model="row.poznamka"
										class="row-input"
										placeholder="Poznámka"
										@input="onRowInput(category, idx)"
									/>
								</td>
								<td>
									<button
										v-if="category.newRows.length > 1"
										class="row-remove-btn"
										@click="removeNewRow(category, idx)"
									>
										×
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- ── Single global save button ── -->
		<div v-if="!loading && categories.length > 0" class="global-footer">
			<p v-if="globalSaveError" class="save-error">{{ globalSaveError }}</p>
			<button
				class="btn-save-contacts"
				:disabled="globalSaving || !hasAnyFilledRows"
				@click="saveAllNewContacts"
			>
				{{ globalSaving ? "Ukladám..." : "Uložiť kontakty" }}
			</button>
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

		<!-- ── Toast notification ── -->
		<Teleport to="body">
			<Transition name="toast">
				<div v-if="toast" :class="['toast', `toast--${toast.type}`]">
					{{ toast.message }}
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "#imports";

const config = useRuntimeConfig();
const authStore = useAuthStore();
const userStore = useUserStore();

const categories = ref([]);
const loading = ref(true);

// ── Global header fields ──────────────────────────────────
const globalOdporucitel = ref("");
const selectedAdvisor = ref(null);
const advisors = ref([]);

// ── Global save state ─────────────────────────────────────
const globalSaving = ref(false);
const globalSaveError = ref("");

const fetchAdvisors = async () => {
	try {
		const res = await axios.get(`${config.public.apiUrl}users`, {
			headers: headers.value,
		});
		advisors.value = res.data.users ?? res.data ?? [];

		if (!selectedAdvisor.value && authStore.user) {
			const me = advisors.value.find((u) => u.id === authStore.user.id);
			if (me) selectedAdvisor.value = me.id;
			else if (advisors.value.length)
				selectedAdvisor.value = advisors.value[0].id;
		}
	} catch {
		if (authStore.user) {
			advisors.value = [
				{
					id: authStore.user.id,
					name: authStore.user.name ?? authStore.user.email,
				},
			];
			selectedAdvisor.value = authStore.user.id;
		}
	}
};

// ── Modal state ───────────────────────────────────────────
const showCategoryModal = ref(false);
const editingCategory = ref(null);
const savingCategory = ref(false);
const modalError = ref("");
const categoryForm = ref({ name: "", image: "" });

const showDeleteModal = ref(false);
const deletingCategory = ref(null);
const deletingFlag = ref(false);

const headers = computed(() => ({
	Authorization: `Bearer ${authStore.token}`,
}));

const onImgError = (e) => {
	e.target.src =
		"https://thumbs.dreamstime.com/b/man-icon-vector-person-symbol-pictogram-illustration-glyph-97085462.jpg?w=768";
};

// ── Empty new row factory ─────────────────────────────────
const emptyRow = () => ({
	meno: "",
	priezvisko: "",
	cislo: "",
	email: "",
	vek: "",
	zamestanie: "",
	adresa: "",
	poznamka: "",
});

// ── Row logic ─────────────────────────────────────────────
const hasFilledRows = (cat) =>
	cat.newRows.some((r) => r.meno.trim() || r.priezvisko.trim());

const hasAnyFilledRows = computed(() =>
	categories.value.some((cat) => hasFilledRows(cat)),
);

const onRowInput = (cat, idx) => {
	if (idx === cat.newRows.length - 1) {
		const row = cat.newRows[idx];
		const hasContent = Object.values(row).some((v) => String(v).trim() !== "");
		if (hasContent) cat.newRows.push(emptyRow());
	}
};

const removeNewRow = (cat, idx) => {
	cat.newRows.splice(idx, 1);
};

// ── Fetch ─────────────────────────────────────────────────
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
				cat.newRows = [emptyRow()];
				cat.saving = false;
				cat.saveError = "";
			}),
		);
		categories.value = cats;
	} catch (err) {
		console.error("Chyba pri načítaní kategórií:", err);
	} finally {
		loading.value = false;
	}
};

// ── Save new contacts for a single category ───────────────
const saveNewContacts = async (cat) => {
	cat.saveError = "";
	const rowsToSave = cat.newRows.filter(
		(r) => r.meno.trim() && r.priezvisko.trim(),
	);
	if (!rowsToSave.length) return;

	for (const row of rowsToSave) {
		const res = await axios.post(
			`${config.public.apiUrl}post-create-category-contact`, // ← new endpoint
			{
				meno: row.meno,
				priezvisko: row.priezvisko,
				cislo: row.cislo || null,
				email: row.email || null,
				odporucitel: globalOdporucitel.value || null,
				vek: row.vek || null,
				zamestanie: row.zamestanie || null,
				adresa: row.adresa || null,
				poznamka: row.poznamka || null,
				owner_id: selectedAdvisor.value || null,
			},
			{ headers: headers.value },
		);

		const created = res.data.contact;

		// Show toast if duplicate
		if (res.data.duplicate) {
			showToast(
				`Kontakt ${created.meno} ${created.priezvisko} už existuje v databáze poradcu: ${res.data.owner_name}. Informácie boli doplnené.`,
				"info",
			);
		} else {
			showToast(
				`Kontakt ${created.meno} ${created.priezvisko} bol úspešne pridaný.`,
				"success",
			);
		}
		await axios.post(
			`${config.public.apiUrl}categories/${cat.id}/contacts`,
			{ contact_id: created.id },
			{ headers: headers.value },
		);
		cat.contacts = [...(cat.contacts ?? []), created];
	}
	cat.newRows = [emptyRow()];
};

// ── Save all categories at once ───────────────────────────
const saveAllNewContacts = async () => {
	globalSaveError.value = "";
	globalSaving.value = true;
	try {
		const catsWithRows = categories.value.filter((cat) => hasFilledRows(cat));
		for (const cat of catsWithRows) {
			await saveNewContacts(cat);
		}
	} catch (err) {
		globalSaveError.value =
			err.response?.status === 409
				? (err.response?.data?.message ?? "Niektorý kontakt už existuje")
				: (err.response?.data?.message ?? "Chyba pri ukladaní");
	} finally {
		globalSaving.value = false;
	}
};

// ── Remove existing contact ───────────────────────────────
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

// ── Category modal ────────────────────────────────────────
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

// ── Delete ────────────────────────────────────────────────
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

const toast = ref(null); // { message, type: 'info'|'error'|'success' }
let toastTimer = null;

const showToast = (message, type = "info") => {
	clearTimeout(toastTimer);
	toast.value = { message, type };
	toastTimer = setTimeout(() => (toast.value = null), 5000);
};

onMounted(async () => {
	await fetchCategories();

	if (!userStore.user) {
		await userStore.fetchUser();
	}

	if (userStore.allUsersAdmin.length === 0) {
		await userStore.fetchAllUsersAdmin();
	}

	advisors.value = userStore.allUsersAdmin.map((u) => ({
		id: u.id,
		name: u.first_name ? `${u.first_name} ${u.last_name}` : u.email,
	}));

	// Default to the currently logged-in user
	if (userStore.user) {
		selectedAdvisor.value = userStore.user.id;
	}

	console.log("Advisors loaded:", advisors.value);
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
	gap: 1rem;
	flex-wrap: wrap;
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

.header-controls {
	display: flex;
	align-items: flex-end;
	gap: 1rem;
	flex-wrap: wrap;
}

.header-field {
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
}
.header-field-label {
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.header-field-input {
	background: #fff;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	color: #111827;
	padding: 0.55rem 0.85rem;
	font-size: 0.88rem;
	outline: none;
	min-width: 180px;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
	font-family: inherit;
}
.header-field-input:focus {
	border-color: #6366f1;
	box-shadow: 0 0 0 3px #6366f118;
}
.header-field-select {
	cursor: pointer;
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
	white-space: nowrap;
}
.btn-create:hover {
	background: #4338ca;
	transform: translateY(-1px);
}
.btn-icon {
	font-size: 1.2rem;
	line-height: 1;
}

/* ── Categories list ────────────────────────────────────── */
.categories-list {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

/* ── Category block ─────────────────────────────────────── */
.category-block {
	background: #fff;
	border: 1px solid #e5e7eb;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 1px 4px #0000000a;
	transition:
		box-shadow 0.2s,
		border-color 0.2s;
}
.category-block:hover {
	border-color: #c7d2fe;
	box-shadow: 0 6px 24px #4f46e514;
}

/* Category header bar */
.category-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 1.25rem;
	border-bottom: 1px solid #f3f4f6;
	background: #fafbff;
}
.category-bar-left {
	display: flex;
	align-items: center;
	gap: 0.85rem;
}
.category-image-wrap {
	width: 52px;
	height: 52px;
	border-radius: 10px;
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
.category-name {
	margin: 0 0 0.15rem;
	font-size: 1rem;
	font-weight: 700;
	color: #111827;
}
.contact-count {
	font-size: 0.75rem;
	color: #9ca3af;
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

/* ── Contacts table ─────────────────────────────────────── */
.contacts-table-wrap {
	overflow-x: auto;
}
.contacts-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.83rem;
}
.contacts-table thead tr {
	background: #f9fafb;
	border-bottom: 1px solid #e5e7eb;
}
.contacts-table th {
	padding: 0.6rem 0.85rem;
	text-align: left;
	font-size: 0.72rem;
	font-weight: 700;
	color: #9ca3af;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	white-space: nowrap;
}
.contact-row td {
	padding: 0.5rem 0.85rem;
	border-bottom: 1px solid #f3f4f6;
	vertical-align: middle;
	color: #374151;
}
.existing-row:hover td {
	background: #fafbff;
}
.new-row td {
	background: #f9fafb;
	padding: 0.35rem 0.5rem;
}
.new-row:last-child td {
	border-bottom: none;
}

.row-input {
	width: 100%;
	min-width: 90px;
	background: #fff;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 0.4rem 0.6rem;
	font-size: 0.82rem;
	color: #111827;
	font-family: inherit;
	outline: none;
	box-sizing: border-box;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
}
.row-input:focus {
	border-color: #6366f1;
	box-shadow: 0 0 0 2px #6366f118;
}
.row-input::placeholder {
	color: #d1d5db;
}

.row-remove-btn {
	background: none;
	border: none;
	color: #d1d5db;
	cursor: pointer;
	font-size: 1.1rem;
	line-height: 1;
	padding: 0.1rem 0.4rem;
	border-radius: 4px;
	transition:
		color 0.15s,
		background 0.15s;
}
.row-remove-btn:hover {
	color: #ef4444;
	background: #fee2e2;
}

/* ── Global footer (single save button) ─────────────────── */
.global-footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 1rem;
	padding: 1.25rem 0;
	margin-top: 0.5rem;
}
.save-error {
	color: #ef4444;
	font-size: 0.8rem;
	margin: 0;
}
.btn-save-contacts {
	background: #4f46e5;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 0.65rem 1.5rem;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
	box-shadow: 0 2px 8px #4f46e530;
}
.btn-save-contacts:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
.btn-save-contacts:hover:not(:disabled) {
	background: #4338ca;
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
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}
.skeleton-card {
	height: 180px;
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

.modal-title {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 700;
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

/* ── Toast ──────────────────────────────────────────────── */
.toast {
	position: fixed;
	bottom: 2rem;
	right: 2rem;
	z-index: 2000;
	padding: 0.9rem 1.4rem;
	border-radius: 12px;
	font-size: 0.88rem;
	font-weight: 500;
	max-width: 420px;
	box-shadow: 0 8px 32px #0000001a;
	line-height: 1.5;
}
.toast--success {
	background: #dcfce7;
	color: #166534;
	border: 1px solid #bbf7d0;
}
.toast--info {
	background: #eff6ff;
	color: #1d4ed8;
	border: 1px solid #bfdbfe;
}
.toast--error {
	background: #fee2e2;
	color: #991b1b;
	border: 1px solid #fca5a5;
}

.toast-enter-active,
.toast-leave-active {
	transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateY(1rem);
}
</style>
