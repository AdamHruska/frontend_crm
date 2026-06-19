<template>
	<div class="categories-page">
		<!-- ── Tab bar ── -->
		<div class="tab-bar">
			<div
				v-for="page in pages"
				:key="page.id"
				:class="['tab', { 'tab--active': page.id === activePageId }]"
				@click="switchPage(page.id)"
			>
				<span class="tab-dot" v-if="page.id === activePageId" />
				<span class="tab-name">{{ page.name }}</span>
				<button
					v-if="pages.length > 1"
					class="tab-close"
					title="Odstrániť záložku"
					@click.stop="confirmDeletePage(page)"
				>
					×
				</button>
			</div>
			<button class="tab-add" title="Nová záložka" @click="openAddPageModal">
				+
			</button>
		</div>

		<!-- ── Page header ── -->
		<template v-if="activePage">
			<div class="page-header">
				<div class="flex gap-4">
					<div class="header-left mr-10">
						<h1 class="page-title">{{ activePage.name }}</h1>
						<p class="page-subtitle">
							{{ activePage.categories.length }} kategórií
						</p>
					</div>

					<div class="header-field">
						<label class="header-field-label">Odporúčateľ</label>
						<input
							v-model="activePage.globalOdporucitel"
							class="header-field-input"
							placeholder="Meno klienta..."
						/>
					</div>

					<div class="header-field">
						<label class="header-field-label">Poradca</label>
						<select
							v-model="activePage.selectedAdvisor"
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

			<!-- ── Loading / Empty / Categories ── -->
			<div v-if="pagesLoading" class="loading-grid">
				<div v-for="n in 4" :key="n" class="skeleton-card" />
			</div>

			<div v-else-if="activePage.loading" class="loading-grid">
				<div v-for="n in 4" :key="n" class="skeleton-card" />
			</div>

			<div v-else-if="activePage.categories.length === 0" class="empty-state">
				<div class="empty-icon">📂</div>
				<h3>Žiadne kategórie</h3>
				<p>Vytvor svoju prvú kategóriu a začni organizovať kontakty.</p>
				<button class="btn-create" @click="openCreateModal">
					Vytvoriť kategóriu
				</button>
			</div>

			<div v-else class="categories-list">
				<div
					v-for="category in activePage.categories"
					:key="category.id"
					class="category-block"
				>
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
								<span class="contact-count">
									{{ category.contacts?.length ?? 0 }} kontaktov
								</span>
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

					<div class="contacts-table-wrap">
						<table class="contacts-table">
							<thead>
								<tr>
									<th>Meno</th>
									<th>Priezvisko</th>
									<th>Telefón</th>
									<th>Vek</th>
									<th>Zamestnanie</th>
									<th>Adresa</th>
									<th class="col-poznamka">Poznámka</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
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
									<td class="col-poznamka">
										<input
											v-model="row.poznamka"
											class="row-input row-input--wide"
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

			<div
				v-if="
					!pagesLoading &&
					!activePage.loading &&
					activePage.categories.length > 0
				"
				class="global-footer"
			>
				<p v-if="activePage.globalSaveError" class="save-error">
					{{ activePage.globalSaveError }}
				</p>
				<button
					class="btn-save-contacts"
					:disabled="activePage.globalSaving || !hasAnyFilledRows"
					@click="saveAllNewContacts"
				>
					{{ activePage.globalSaving ? "Ukladám..." : "Uložiť kontakty" }}
				</button>
			</div>
		</template>

		<!-- ── Initial pages loading ── -->
		<div v-else class="loading-grid">
			<div v-for="n in 4" :key="n" class="skeleton-card" />
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

		<!-- ───── DELETE CATEGORY MODAL ───── -->
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

		<!-- ───── ADD PAGE (TAB) MODAL ───── -->
		<Teleport to="body">
			<div
				v-if="showAddPageModal"
				class="modal-overlay"
				@click.self="showAddPageModal = false"
			>
				<div class="modal modal-sm">
					<h2 class="modal-title">Nová záložka</h2>
					<label class="field-label">Názov záložky *</label>
					<input
						v-model="newPageName"
						class="field-input"
						placeholder="napr. Firmy, Rodina..."
						@keyup.enter="addPage"
						ref="newPageInput"
					/>
					<p v-if="addPageError" class="modal-error">{{ addPageError }}</p>
					<div class="modal-actions">
						<button class="btn-cancel" @click="showAddPageModal = false">
							Zrušiť
						</button>
						<button class="btn-save" :disabled="addingPage" @click="addPage">
							{{ addingPage ? "Vytváram..." : "Vytvoriť" }}
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ───── DELETE PAGE (TAB) CONFIRM MODAL ───── -->
		<Teleport to="body">
			<div
				v-if="showDeletePageModal"
				class="modal-overlay"
				@click.self="showDeletePageModal = false"
			>
				<div class="modal modal-sm">
					<h2 class="modal-title">Odstrániť záložku?</h2>
					<p class="delete-desc">
						Záložka <strong>{{ deletingPage?.name }}</strong> bude odstránená.
						Dáta v tejto záložke sa stratia (kategórie a kontakty v databáze
						zostanú).
					</p>
					<div class="modal-actions">
						<button class="btn-cancel" @click="showDeletePageModal = false">
							Zrušiť
						</button>
						<button
							class="btn-delete"
							:disabled="deletingPageFlag"
							@click="deletePage"
						>
							{{ deletingPageFlag ? "Odstraňujem..." : "Odstrániť" }}
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ── Toast ── -->
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
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import { useUserStore } from "#imports";

const config = useRuntimeConfig();
const authStore = useAuthStore();
const userStore = useUserStore();

// ── Pages (tabs) — DB-backed ──────────────────────────────
const pagesLoading = ref(true);

const createPageState = (dbPage) => ({
	id: dbPage.id,
	name: dbPage.name,
	categories: [],
	loading: true,
	globalOdporucitel: "",
	selectedAdvisor: null,
	globalSaving: false,
	globalSaveError: "",
});

const pages = ref([]);
const activePageId = ref(null);

const activePage = computed(
	() => pages.value.find((p) => p.id === activePageId.value) ?? null,
);

// ── Advisors ──────────────────────────────────────────────
const advisors = ref([]);

// ── Auth headers ──────────────────────────────────────────
const headers = computed(() => ({
	Authorization: `Bearer ${authStore.token}`,
}));

// ── LocalStorage helpers (draft rows only) ────────────────
const lsKey = (pageId) => `categories_draft_rows_${pageId}`;

const saveDraftToLocalStorage = (page) => {
	try {
		const draft = {};
		for (const cat of page.categories) {
			const filledOrPartial = cat.newRows.filter((r) =>
				Object.values(r).some((v) => String(v).trim() !== ""),
			);
			if (filledOrPartial.length > 0) draft[cat.id] = filledOrPartial;
		}
		if (Object.keys(draft).length > 0) {
			localStorage.setItem(lsKey(page.id), JSON.stringify(draft));
		} else {
			localStorage.removeItem(lsKey(page.id));
		}
	} catch (e) {
		console.warn("Could not save draft:", e);
	}
};

const loadDraftFromLocalStorage = (pageId) => {
	try {
		const raw = localStorage.getItem(lsKey(pageId));
		if (!raw) return {};
		return JSON.parse(raw);
	} catch {
		return {};
	}
};

const clearDraftFromLocalStorage = (pageId) => {
	try {
		localStorage.removeItem(lsKey(pageId));
	} catch {
		/* ignore */
	}
};

// ── Fetch all pages from DB ───────────────────────────────
const fetchPages = async () => {
	pagesLoading.value = true;
	try {
		const res = await axios.get(`${config.public.apiUrl}category-pages`, {
			headers: headers.value,
		});
		let dbPages = res.data.pages;

		// First-time user: auto-create a default page
		if (dbPages.length === 0) {
			const createRes = await axios.post(
				`${config.public.apiUrl}category-pages`,
				{ name: "Hlavná stránka" },
				{ headers: headers.value },
			);
			dbPages = [createRes.data.page];
		}

		pages.value = dbPages.map((p) => createPageState(p));
		activePageId.value = pages.value[0].id;
	} catch (err) {
		console.error("Chyba pri načítaní záložiek:", err);
	} finally {
		pagesLoading.value = false;
	}
};

// ── Add page modal ────────────────────────────────────────
const showAddPageModal = ref(false);
const newPageName = ref("");
const addPageError = ref("");
const addingPage = ref(false);
const newPageInput = ref(null);

const openAddPageModal = () => {
	newPageName.value = "";
	addPageError.value = "";
	showAddPageModal.value = true;
	nextTick(() => newPageInput.value?.focus());
};

const addPage = async () => {
	addPageError.value = "";
	if (!newPageName.value.trim()) {
		addPageError.value = "Názov je povinný";
		return;
	}
	addingPage.value = true;
	try {
		const res = await axios.post(
			`${config.public.apiUrl}category-pages`,
			{ name: newPageName.value.trim() },
			{ headers: headers.value },
		);
		const newPage = createPageState(res.data.page);
		newPage.selectedAdvisor = userStore.user?.id ?? null;
		pages.value.push(newPage);
		activePageId.value = newPage.id;
		showAddPageModal.value = false;
		await fetchCategoriesForPage(newPage);
	} catch (err) {
		addPageError.value =
			err.response?.data?.message ?? "Chyba pri vytváraní záložky";
	} finally {
		addingPage.value = false;
	}
};

// ── Delete page modal ─────────────────────────────────────
const showDeletePageModal = ref(false);
const deletingPage = ref(null);
const deletingPageFlag = ref(false);

const confirmDeletePage = (page) => {
	deletingPage.value = page;
	showDeletePageModal.value = true;
};

const deletePage = async () => {
	deletingPageFlag.value = true;
	try {
		await axios.delete(
			`${config.public.apiUrl}category-pages/${deletingPage.value.id}`,
			{ headers: headers.value },
		);
		clearDraftFromLocalStorage(deletingPage.value.id);
		const idx = pages.value.findIndex((p) => p.id === deletingPage.value.id);
		pages.value.splice(idx, 1);
		if (activePageId.value === deletingPage.value.id) {
			activePageId.value =
				pages.value[Math.min(idx, pages.value.length - 1)]?.id ?? null;
		}
		showDeletePageModal.value = false;
	} catch (err) {
		showToast(
			err.response?.data?.message ?? "Chyba pri odstraňovaní záložky",
			"error",
		);
	} finally {
		deletingPageFlag.value = false;
	}
};

// ── Switch page ───────────────────────────────────────────
const switchPage = (id) => {
	activePageId.value = id;
	const page = pages.value.find((p) => p.id === id);
	// Re-fetch only if categories haven't loaded yet for this page
	if (page && page.categories.length === 0 && page.loading) {
		fetchCategoriesForPage(page);
	}
};

// ── Misc helpers ──────────────────────────────────────────
const onImgError = (e) => {
	e.target.src =
		"https://thumbs.dreamstime.com/b/man-icon-vector-person-symbol-pictogram-illustration-glyph-97085462.jpg?w=768";
};

const emptyRow = () => ({
	meno: "",
	priezvisko: "",
	cislo: "",
	vek: "",
	zamestanie: "",
	adresa: "",
	poznamka: "",
});

// ── Row logic ─────────────────────────────────────────────
const hasFilledRows = (cat) =>
	cat.newRows.some((r) => r.meno.trim() || r.priezvisko.trim());

const hasAnyFilledRows = computed(
	() => activePage.value?.categories.some((cat) => hasFilledRows(cat)) ?? false,
);

const onRowInput = (cat, idx) => {
	if (idx === cat.newRows.length - 1) {
		const row = cat.newRows[idx];
		const hasContent = Object.values(row).some((v) => String(v).trim() !== "");
		if (hasContent) cat.newRows.push(emptyRow());
	}
	saveDraftToLocalStorage(activePage.value);
};

const removeNewRow = (cat, idx) => {
	cat.newRows.splice(idx, 1);
	saveDraftToLocalStorage(activePage.value);
};

// ── Fetch categories for a page (filtered by page_id) ────
const fetchCategoriesForPage = async (page) => {
	page.loading = true;
	const savedDraft = loadDraftFromLocalStorage(page.id);
	try {
		const res = await axios.get(
			`${config.public.apiUrl}categories?page_id=${page.id}`,
			{ headers: headers.value },
		);
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

				if (savedDraft[cat.id] && savedDraft[cat.id].length > 0) {
					const restoredRows = savedDraft[cat.id];
					const lastRow = restoredRows[restoredRows.length - 1];
					const lastIsEmpty = Object.values(lastRow).every(
						(v) => String(v).trim() === "",
					);
					if (!lastIsEmpty) restoredRows.push(emptyRow());
					cat.newRows = restoredRows;
				} else {
					cat.newRows = [emptyRow()];
				}
				cat.saving = false;
				cat.saveError = "";
			}),
		);
		page.categories = cats;
	} catch (err) {
		console.error("Chyba pri načítaní kategórií:", err);
	} finally {
		page.loading = false;
	}
};

// ── Save contacts ─────────────────────────────────────────
const saveNewContacts = async (cat) => {
	cat.saveError = "";
	const rowsToSave = cat.newRows.filter(
		(r) => r.meno.trim() && r.priezvisko.trim(),
	);
	if (!rowsToSave.length) return;

	for (const row of rowsToSave) {
		const res = await axios.post(
			`${config.public.apiUrl}post-create-category-contact`,
			{
				meno: row.meno,
				priezvisko: row.priezvisko,
				cislo: row.cislo || null,
				email: row.email || null,
				odporucitel: activePage.value.globalOdporucitel || null,
				vek: row.vek || null,
				zamestanie: row.zamestanie || null,
				adresa: row.adresa || null,
				poznamka: row.poznamka || null,
				category_name: cat.name,
				owner_id: activePage.value.selectedAdvisor || null,
			},
			{ headers: headers.value },
		);

		const created = res.data.contact;
		const dupType = res.data.duplicate_type;
		const ownerName = res.data.owner_name;

		if (res.data.duplicate) {
			if (dupType === "other_advisor") {
				showToast(
					`Kontakt ${created.meno} ${created.priezvisko} už má iný poradca: ${ownerName}. Kontakt bol napriek tomu uložený.`,
					"warning",
				);
			} else if (dupType === "target_advisor") {
				showToast(
					`Kontakt ${created.meno} ${created.priezvisko} už existuje u poradcu. Poznámka doplnená a kontakt uložený.`,
					"info",
				);
			} else {
				showToast(
					`Kontakt ${created.meno} ${created.priezvisko} už existuje – poznámka bola doplnená.`,
					"info",
				);
			}
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

const saveAllNewContacts = async () => {
	activePage.value.globalSaveError = "";
	activePage.value.globalSaving = true;
	try {
		const catsWithRows = activePage.value.categories.filter((cat) =>
			hasFilledRows(cat),
		);
		for (const cat of catsWithRows) {
			await saveNewContacts(cat);
		}
		clearDraftFromLocalStorage(activePage.value.id);
	} catch (err) {
		activePage.value.globalSaveError =
			err.response?.status === 409
				? (err.response?.data?.message ?? "Niektorý kontakt už existuje")
				: (err.response?.data?.message ?? "Chyba pri ukladaní");
	} finally {
		activePage.value.globalSaving = false;
	}
};

// ── Category CRUD ─────────────────────────────────────────
const showCategoryModal = ref(false);
const editingCategory = ref(null);
const savingCategory = ref(false);
const modalError = ref("");
const categoryForm = ref({ name: "", image: "" });

const showDeleteModal = ref(false);
const deletingCategory = ref(null);
const deletingFlag = ref(false);

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
			// Send the active page's DB id so the category is scoped to this tab
			await axios.post(
				`${config.public.apiUrl}categories`,
				{
					...categoryForm.value,
					category_page_id: activePage.value.id,
				},
				{ headers: headers.value },
			);
		}
		closeCategoryModal();
		await fetchCategoriesForPage(activePage.value);
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
		await fetchCategoriesForPage(activePage.value);
	} catch (err) {
		console.error(err);
		showToast("Chyba pri mazaní kategórie", "error");
	} finally {
		deletingFlag.value = false;
	}
};

// ── Toast ─────────────────────────────────────────────────
const toast = ref(null);
let toastTimer = null;
const showToast = (message, type = "info") => {
	clearTimeout(toastTimer);
	toast.value = { message, type };
	toastTimer = setTimeout(() => (toast.value = null), 5000);
};

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
	if (!userStore.user) await userStore.fetchUser();
	if (userStore.allUsersAdmin.length === 0)
		await userStore.fetchAllUsersAdmin();

	advisors.value = userStore.allUsersAdmin
		.filter((u) => u.hidden === 0)
		.map((u) => ({
			id: u.id,
			name: u.first_name ? `${u.first_name} ${u.last_name}` : u.email,
		}));

	const defaultAdvisorId = userStore.user?.id ?? null;

	// 1. Load pages from DB
	await fetchPages();

	// 2. Load categories for all pages in parallel, set default advisor
	await Promise.all(
		pages.value.map((page) => {
			page.selectedAdvisor = defaultAdvisorId;
			return fetchCategoriesForPage(page);
		}),
	);
});
</script>

<style scoped>
/* ── Tab bar ─────────────────────────────────────────────── */
.tab-bar {
	display: flex;
	align-items: flex-end;
	gap: 0;
	padding: 0.75rem 2.5rem 0;
	background: #fff;
	border-bottom: 1px solid #e5e7eb;
	overflow-x: auto;
	scrollbar-width: none;
	position: sticky;
	top: 0;
	z-index: 10;
}
.tab-bar::-webkit-scrollbar {
	display: none;
}
.tab {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0.5rem 1rem 0.5rem 1.1rem;
	border: 1px solid #e5e7eb;
	border-bottom: none;
	border-radius: 8px 8px 0 0;
	background: #f3f4f6;
	cursor: pointer;
	font-size: 0.82rem;
	font-weight: 500;
	color: #6b7280;
	white-space: nowrap;
	position: relative;
	bottom: -1px;
	transition:
		background 0.15s,
		color 0.15s;
	max-width: 200px;
	min-width: 0;
	user-select: none;
}
.tab--active {
	background: #f4f6fb;
	color: #111827;
	border-color: #e5e7eb;
	z-index: 2;
}
.tab:hover:not(.tab--active) {
	background: #e9eaf0;
	color: #374151;
}
.tab-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #6366f1;
	flex-shrink: 0;
}
.tab-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	min-width: 0;
}
.tab-close {
	width: 18px;
	height: 18px;
	border-radius: 4px;
	border: none;
	background: transparent;
	color: #9ca3af;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	line-height: 1;
	flex-shrink: 0;
	transition:
		background 0.12s,
		color 0.12s;
	padding: 0;
}
.tab-close:hover {
	background: #fee2e2;
	color: #dc2626;
}
.tab-add {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 6px;
	border: 1px dashed #d1d5db;
	background: transparent;
	color: #9ca3af;
	cursor: pointer;
	font-size: 20px;
	margin-left: 6px;
	margin-bottom: 1px;
	flex-shrink: 0;
	transition:
		border-color 0.15s,
		color 0.15s,
		background 0.15s;
	align-self: center;
}
.tab-add:hover {
	border-color: #6366f1;
	color: #6366f1;
	background: #eef2ff;
}

/* ── Page ────────────────────────────────────────────────── */
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
.contacts-table th:nth-child(3),
.contacts-table td:nth-child(3) {
	width: 120px;
	min-width: 120px;
}
.contacts-table th:nth-child(4),
.contacts-table td:nth-child(4) {
	width: 70px;
	min-width: 70px;
}
.contacts-table th.col-poznamka,
.contacts-table td.col-poznamka {
	width: 32%;
	min-width: 320px;
}
.contact-row td {
	padding: 0.5rem 0.85rem;
	border-bottom: 1px solid #f3f4f6;
	vertical-align: middle;
	color: #374151;
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
.row-input--wide {
	min-width: 200px;
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

/* ── Global footer ───────────────────────────────────────── */
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

/* ── Modals ──────────────────────────────────────────────── */
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
.toast--warning {
	background: #fef9c3;
	color: #854d0e;
	border: 1px solid #fde047;
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
