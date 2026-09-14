<script setup>
import { ref, onMounted, watch } from "vue";
import { format, parseISO, add } from "date-fns";
import { Icon } from "@iconify/vue";
import axios from "axios";
import { useToast } from "vue-toastification";

const config = useRuntimeConfig();
const toast = useToast();

const emit = defineEmits(["close"]);

// ── Form fields ──
const aktivita = ref("Telefonát klient");
const ina_aktivita = ref("");
const importance = ref("normal");
const datum_cas = ref("");
const koniec = ref("");
const poznamka = ref("");
const miesto_stretnutia = ref("");
const onlineMeeting = ref(false);
const volane = ref(false);
const dovolane = ref(false);
const dohodnute = ref(false);
const active = ref([]);

// ── Contact search ──
const contacts = ref([]);
const contactSearch = ref("");
const selectedContact = ref(null);
const showContactDropdown = ref(false);

// ── Office ──
const selectedOffice = ref({ id: null, name: "Kancelárie" });
const showOffices = ref(false);

// ── localStorage key ──
const STORAGE_KEY = "freebuff_batch_activities";

const storedActivities = ref([]);

// Load stored activities from localStorage on mount
onMounted(async () => {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			storedActivities.value = JSON.parse(stored);
		} catch {
			storedActivities.value = [];
		}
	}

	// Set default datetime to now
	const now = new Date();
	datum_cas.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
	const startPlusHour = add(parseISO(datum_cas.value), { hours: 1 });
	koniec.value = format(startPlusHour, "yyyy-MM-dd'T'HH:mm");

	// Fetch contacts
	try {
		const response = await axios.get(`${config.public.apiUrl}all-contacts`, {
			headers: { Authorization: `Bearer ${authStore.token}` },
		});
		const ownContacts = response.data.contacts || [];
		try {
			const sharedRes = await axios.get(
				`${config.public.apiUrl}contacts-without-pagination`,
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			const sharedContacts = sharedRes.data.contacts || [];
			const merged = [...ownContacts];
			const ownIds = new Set(ownContacts.map((c) => c.id));
			for (const c of sharedContacts) {
				if (!ownIds.has(c.id)) merged.push(c);
			}
			contacts.value = merged;
		} catch {
			contacts.value = ownContacts;
		}
	} catch (err) {
		console.error("Error fetching contacts:", err);
	}
});

import { useAuthStore } from "@/stores/authStore";
const authStore = useAuthStore();
authStore.loadToken();

// ── Contact filtering ──
const filteredContacts = computed(() => {
	if (!contactSearch.value) return [];
	const search = contactSearch.value.toLowerCase();
	return contacts.value.filter(
		(c) =>
			(c.meno || "").toLowerCase().includes(search) ||
			(c.priezvisko || "").toLowerCase().includes(search) ||
			(c.email || "").toLowerCase().includes(search) ||
			`${c.meno} ${c.priezvisko}`.toLowerCase().includes(search),
	);
});

const selectContact = (contact) => {
	selectedContact.value = contact;
	contactSearch.value = `${contact.meno} ${contact.priezvisko}`;
	showContactDropdown.value = false;
};

// ── VDD logic ──
const ineBool = computed(() => aktivita.value === "ine");
const showVDD = computed(() => {
	return (aktivita.value || "").toLowerCase().startsWith("telefonát");
});

// ── Auto-set end time based on activity type ──
watch(datum_cas, (newValue) => {
	if (!newValue) return;
	const addedTime =
		aktivita.value === "Telefonát klient" ? { minutes: 5 } : { hours: 1 };
	const newEnd = add(parseISO(newValue), addedTime);
	koniec.value = format(newEnd, "yyyy-MM-dd'T'HH:mm");
});

watch([aktivita], () => {
	if (showVDD.value && datum_cas.value) {
		const newEnd = add(parseISO(datum_cas.value), { minutes: 5 });
		koniec.value = format(newEnd, "yyyy-MM-dd'T'HH:mm");
	}
});

// ── VDD toggle logic ──
watch(dovolane, (val) => {
	if (val) volane.value = true;
});
watch(dohodnute, (val) => {
	if (val) {
		volane.value = true;
		dovolane.value = true;
	}
});

const setActive = (n) => {
	if (active.value.includes(n)) {
		active.value = active.value.filter((item) => item !== n);
	} else {
		active.value.push(n);
	}
};

// ── Save activity to localStorage ──
const saveToStorage = () => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(storedActivities.value));
};

// ── Add another activity (saves current and resets form) ──
const addAnother = () => {
	if (!selectedContact.value) {
		toast.error("Vyberte kontakt");
		return;
	}

	const activity = {
		id: Date.now(),
		contact_id: selectedContact.value.id,
		contact_name: `${selectedContact.value.meno} ${selectedContact.value.priezvisko}`,
		aktivita: aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
		importance: importance.value,
		datum_cas: datum_cas.value,
		koniec: koniec.value,
		poznamka: poznamka.value,
		miesto_stretnutia: miesto_stretnutia.value,
		online_meeting: onlineMeeting.value ? 1 : 0,
		volane: volane.value ? 1 : 0,
		dovolane: dovolane.value ? 1 : 0,
		dohodnute: dohodnute.value ? 1 : 0,
		send_notification_15: active.value.includes(15) ? 1 : 0,
		send_notification_30: active.value.includes(30) ? 1 : 0,
		send_notification_60: active.value.includes(60) ? 1 : 0,
	};

	storedActivities.value.push(activity);
	saveToStorage();
	toast.success(`Aktivita pridaná pre ${activity.contact_name}`);

	// Reset form fields (keep contact selection for convenience)
	resetForm();
};

// ── Close: save current + close ──
const saveAndClose = () => {
	if (selectedContact.value && (aktivita.value || datum_cas.value)) {
		const activity = {
			id: Date.now(),
			contact_id: selectedContact.value.id,
			contact_name: `${selectedContact.value.meno} ${selectedContact.value.priezvisko}`,
			aktivita: aktivita.value === "ine" ? ina_aktivita.value : aktivita.value,
			importance: importance.value,
			datum_cas: datum_cas.value,
			koniec: koniec.value,
			poznamka: poznamka.value,
			miesto_stretnutia: miesto_stretnutia.value,
			online_meeting: onlineMeeting.value ? 1 : 0,
			volane: volane.value ? 1 : 0,
			dovolane: dovolane.value ? 1 : 0,
			dohodnute: dohodnute.value ? 1 : 0,
			send_notification_15: active.value.includes(15) ? 1 : 0,
			send_notification_30: active.value.includes(30) ? 1 : 0,
			send_notification_60: active.value.includes(60) ? 1 : 0,
		};
		storedActivities.value.push(activity);
		saveToStorage();
	}
	emit("close");
};

// ── Just close without saving ──
const justClose = () => {
	emit("close");
};

// ── Remove a stored activity ──
const removeStored = (id) => {
	storedActivities.value = storedActivities.value.filter((a) => a.id !== id);
	saveToStorage();
};

// ── Submit all stored activities ──
const submitAll = async () => {
	if (!storedActivities.value.length) {
		toast.error("Žiadne aktivity na odoslanie");
		return;
	}

	let successCount = 0;
	for (const activity of storedActivities.value) {
		try {
			await axios.post(
				`${config.public.apiUrl}add-activity`,
				{
					contact_id: activity.contact_id,
					aktivita: activity.aktivita,
					datumCas: activity.datum_cas,
					koniec: activity.koniec,
					poznamka: activity.poznamka,
					volane: activity.volane ? 1 : 0,
					dovolane: activity.dovolane ? 1 : 0,
					dohodnute: activity.dohodnute ? 1 : 0,
					online_meeting: activity.online_meeting ? 1 : 0,
					miesto_stretnutia: activity.miesto_stretnutia,
					send_notification_15: activity.send_notification_15 ? 1 : 0,
					send_notification_30: activity.send_notification_30 ? 1 : 0,
					send_notification_60: activity.send_notification_60 ? 1 : 0,
				},
				{ headers: { Authorization: `Bearer ${authStore.token}` } },
			);
			successCount++;
		} catch (err) {
			console.error("Error adding activity:", err);
		}
	}

	if (successCount > 0) {
		toast.success(`Úspešne odoslané ${successCount} aktivít`);
		storedActivities.value = [];
		saveToStorage();
	} else {
		toast.error("Nepodarilo sa odoslať žiadne aktivity");
	}
};

const resetForm = () => {
	aktivita.value = "Telefonát klient";
	ina_aktivita.value = "";
	importance.value = "normal";
	poznamka.value = "";
	miesto_stretnutia.value = "";
	onlineMeeting.value = false;
	volane.value = false;
	dovolane.value = false;
	dohodnute.value = false;
	active.value = [];

	// Set next datetime (after current end time)
	if (koniec.value) {
		datum_cas.value = koniec.value;
		const newEnd = add(parseISO(koniec.value), { hours: 1 });
		koniec.value = format(newEnd, "yyyy-MM-dd'T'HH:mm");
	}
};
</script>

<template>
	<div class="batch-form-wrap">
		<!-- Header with stored count and close -->
		<div class="batch-header">
			<div class="batch-title">
				<Icon
					icon="ic:round-add-circle"
					width="20"
					height="20"
					class="text-[#2563eb]"
				/>
				<span>Pridať aktivity</span>
				<span v-if="storedActivities.length" class="batch-badge">
					{{ storedActivities.length }}
				</span>
			</div>
			<button class="btn-close" @click="justClose" title="Zavrieť">
				<Icon icon="fa6-solid:xmark" width="16" height="16" />
			</button>
		</div>

		<!-- Stored activities preview -->
		<div v-if="storedActivities.length" class="stored-activities">
			<div class="stored-label">Pridané aktivity</div>
			<div class="stored-list">
				<div v-for="act in storedActivities" :key="act.id" class="stored-item">
					<div class="stored-item-info">
						<span class="stored-item-type">{{ act.aktivita }}</span>
						<span class="stored-item-contact">{{ act.contact_name }}</span>
						<span class="stored-item-date">
							{{ act.datum_cas ? act.datum_cas.replace("T", " ") : "" }}
						</span>
					</div>
					<button class="btn-remove" @click="removeStored(act.id)">
						<Icon icon="fa6-solid:trash" width="12" height="12" />
					</button>
				</div>
			</div>
			<div class="stored-actions">
				<button class="btn-submit-all" @click="submitAll">
					Odoslať všetko ({{ storedActivities.length }})
				</button>
			</div>
		</div>

		<!-- Activity form -->
		<div class="batch-form">
			<div class="form-grid">
				<!-- Contact search -->
				<div class="form-field span-2">
					<label class="field-label">Kontakt</label>
					<div class="contact-search-wrap">
						<input
							v-model="contactSearch"
							type="text"
							class="field-input"
							placeholder="Hľadať kontakt..."
							@focus="showContactDropdown = true"
							@blur="setTimeout(() => (showContactDropdown = false), 200)"
						/>
						<div
							v-if="showContactDropdown && filteredContacts.length"
							class="contact-dropdown"
						>
							<div
								v-for="c in filteredContacts.slice(0, 20)"
								:key="c.id"
								class="contact-option"
								@mousedown="selectContact(c)"
							>
								{{ c.meno }} {{ c.priezvisko }}
								<span v-if="c.firma" class="contact-firma">{{ c.firma }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Aktivita -->
				<div class="form-field">
					<label class="field-label">Aktivita</label>
					<select v-model="aktivita" class="field-input">
						<option value="Telefonát klient">Telefonát klient</option>
						<option value="Telefonát nábor">Telefonát nábor</option>
						<option value="Telefonát">Telefonát</option>
						<option value="Pohovor">Pohovor</option>
						<option value="Prvé stretnutie">Prvé stretnutie</option>
						<option value="Analýza osobných financí">
							Analýza osobných financí
						</option>
						<option value="Servisná analýza">Analýza servisná</option>
						<option value="poradenstvo nové">Poradenstvo nové</option>
						<option value="servisné poradenstvo">Poradenstvo servisné</option>
						<option value="realizácia nová">Realizácia nová</option>
						<option value="realizácia servisná">Realizácia servisná</option>
						<option value="welcome seminár">Welcome seminár</option>
						<option value="basic 1">Basic 1</option>
						<option value="basic 2">Basic 2</option>
						<option value="basic 3">Basic 3</option>
						<option value="basic 4">Basic 4</option>
						<option value="Post info">Post info</option>
						<option value="konfirmačný servis">Konfirmačný servis</option>
						<option value="servis">Servis</option>
						<option value="bringer bonus">Bringer bonus</option>
						<option value="káva">Káva</option>
						<option value="porada">Porada</option>
						<option value="vzdelávanie">Vzdelávanie</option>
						<option value="stretnutie na zistenie stavu">
							Stretnutie na zistenie stavu
						</option>
						<option value="súkromné">Súkromné</option>
						<option value="ine">Iné vypíšem sám</option>
					</select>
					<input
						v-if="ineBool"
						v-model="ina_aktivita"
						type="text"
						class="field-input mt-2"
						placeholder="Zadajte aktivitu..."
					/>
				</div>

				<!-- Importance / Online Meeting -->
				<div class="form-field">
					<div v-if="onlineMeeting" class="mb-2">
						<label class="field-label">Dôležitosť</label>
						<select v-model="importance" class="field-input">
							<option value="low">Nízka</option>
							<option value="normal">Normálna</option>
							<option value="high">Vysoká</option>
						</select>
					</div>
					<label class="flex items-center gap-2 mt-1 cursor-pointer">
						<input
							v-model="onlineMeeting"
							type="checkbox"
							class="accent-[#2563eb]"
						/>
						<span class="field-label mb-0">Online Meeting</span>
					</label>
				</div>

				<!-- Datum zacatia -->
				<div class="form-field">
					<label class="field-label">Dátum a čas začatia</label>
					<input
						v-model="datum_cas"
						type="datetime-local"
						step="900"
						class="field-input"
					/>
				</div>

				<!-- Datum ukoncenia -->
				<div class="form-field">
					<label class="field-label">Dátum a čas ukončenia</label>
					<input
						v-model="koniec"
						type="datetime-local"
						step="900"
						class="field-input"
					/>
				</div>

				<!-- Poznamka -->
				<div class="form-field span-2">
					<label class="field-label">Poznámka k aktivite</label>
					<textarea
						v-model="poznamka"
						rows="2"
						class="field-input"
						placeholder="Poznámka..."
					></textarea>
				</div>

				<!-- Miesto stretnutia -->
				<div v-if="!onlineMeeting" class="form-field">
					<label class="field-label">Miesto stretnutia</label>
					<input
						v-model="miesto_stretnutia"
						type="text"
						class="field-input"
						placeholder="Zadajte miesto..."
					/>
				</div>

				<!-- VDD toggles -->
				<div v-if="showVDD" class="form-field">
					<label class="field-label">Volané / Dovolané / Dohodnuté</label>
					<div class="vdd-toggles">
						<label class="vdd-toggle">
							<span>Volané</span>
							<input
								type="checkbox"
								v-model="volane"
								class="accent-[#2563eb]"
							/>
						</label>
						<label class="vdd-toggle">
							<span>Dovolané</span>
							<input
								type="checkbox"
								v-model="dovolane"
								class="accent-[#2563eb]"
							/>
						</label>
						<label class="vdd-toggle">
							<span>Dohodnuté</span>
							<input
								type="checkbox"
								v-model="dohodnute"
								class="accent-[#2563eb]"
							/>
						</label>
					</div>
				</div>

				<!-- Notifications -->
				<div class="form-field">
					<label class="field-label">Notifikácie</label>
					<div class="flex items-center gap-2">
						<button
							v-for="n in [15, 30, 60]"
							:key="n"
							type="button"
							class="notif-btn"
							:class="{ active: active.includes(n) }"
							@click="setActive(n)"
						>
							{{ n }}m
						</button>
					</div>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="batch-actions">
				<button class="btn-primary" @click="addAnother">
					<Icon icon="ic:round-add" width="16" height="16" />
					Pridať a ďalšia
				</button>
				<button class="btn-outline" @click="saveAndClose">
					Uložiť a zavrieť
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.batch-form-wrap {
	border: 1px solid #dbeafe;
	border-radius: 12px;
	background: #fff;
	overflow: hidden;
	margin-top: 0.75rem;
}

.batch-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1.25rem;
	background: #f0f5ff;
	border-bottom: 1px solid #dbeafe;
}

.batch-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.9rem;
	font-weight: 600;
	color: #1e3a8a;
}

.batch-badge {
	background: #2563eb;
	color: #fff;
	font-size: 0.7rem;
	font-weight: 700;
	padding: 1px 7px;
	border-radius: 10px;
}

.btn-close {
	background: none;
	border: none;
	cursor: pointer;
	color: #64748b;
	padding: 4px;
	border-radius: 4px;
	transition: color 0.15s;
}
.btn-close:hover {
	color: #dc2626;
}

/* ── Stored activities ── */
.stored-activities {
	padding: 0.75rem 1.25rem;
	border-bottom: 1px solid #eff6ff;
	background: #f8faff;
}

.stored-label {
	font-size: 0.7rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: #64748b;
	margin-bottom: 0.5rem;
}

.stored-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.stored-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.4rem 0.6rem;
	background: #fff;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	font-size: 0.8rem;
}

.stored-item-info {
	display: flex;
	align-items: center;
	gap: 10px;
	flex: 1;
	min-width: 0;
}

.stored-item-type {
	font-weight: 600;
	color: #1e40af;
	white-space: nowrap;
}

.stored-item-contact {
	color: #1e293b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.stored-item-date {
	color: #64748b;
	font-size: 0.75rem;
	white-space: nowrap;
}

.btn-remove {
	background: none;
	border: none;
	cursor: pointer;
	color: #94a3b8;
	padding: 2px 4px;
	border-radius: 4px;
	transition: color 0.15s;
	flex-shrink: 0;
}
.btn-remove:hover {
	color: #dc2626;
}

.stored-actions {
	margin-top: 0.5rem;
	text-align: right;
}

.btn-submit-all {
	padding: 0.4rem 1rem;
	background: #16a34a;
	color: #fff;
	border: none;
	border-radius: 8px;
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.btn-submit-all:hover {
	background: #15803d;
}

/* ── Form ── */
.batch-form {
	padding: 1rem 1.25rem;
}

.form-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px 20px;
}

.form-field {
	margin-bottom: 0;
}

.span-2 {
	grid-column: 1 / -1;
}

.field-label {
	display: block;
	font-size: 0.75rem;
	font-weight: 600;
	color: #475569;
	margin-bottom: 0.25rem;
}

.field-input {
	width: 100%;
	padding: 0.45rem 0.7rem;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	background: #f8faff;
	font-size: 0.85rem;
	color: #1e293b;
	outline: none;
	font-family: inherit;
	resize: vertical;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
}
.field-input:focus {
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
	background: #fff;
}
.field-input::placeholder {
	color: #94a3b8;
}

textarea.field-input {
	min-height: 40px;
}

/* ── Contact search ── */
.contact-search-wrap {
	position: relative;
}

.contact-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #fff;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 50;
	max-height: 200px;
	overflow-y: auto;
}

.contact-option {
	padding: 0.5rem 0.75rem;
	cursor: pointer;
	font-size: 0.85rem;
	color: #1e293b;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.contact-option:hover {
	background: #eff6ff;
}

.contact-firma {
	font-size: 0.75rem;
	color: #64748b;
	margin-left: 8px;
}

/* ── VDD ── */
.vdd-toggles {
	display: flex;
	gap: 12px;
}

.vdd-toggle {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.8rem;
	color: #1e293b;
	cursor: pointer;
}

/* ── Notifications ── */
.notif-btn {
	padding: 0.3rem 0.7rem;
	border: 1px solid #dbeafe;
	border-radius: 6px;
	background: #f8faff;
	font-size: 0.78rem;
	font-weight: 600;
	color: #475569;
	cursor: pointer;
	transition: all 0.15s;
}
.notif-btn:hover {
	background: #eff6ff;
}
.notif-btn.active {
	background: #2563eb;
	color: #fff;
	border-color: #2563eb;
}

/* ── Action buttons ── */
.batch-actions {
	display: flex;
	gap: 10px;
	margin-top: 1rem;
	justify-content: flex-end;
}

.btn-primary {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0.5rem 1.25rem;
	background: #2563eb;
	color: #fff;
	border: none;
	border-radius: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.btn-primary:hover {
	background: #1d4ed8;
}

.btn-outline {
	padding: 0.5rem 1.25rem;
	background: #fff;
	color: #2563eb;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.btn-outline:hover {
	background: #eff6ff;
}

/* ── Responsive ── */
@media (max-width: 520px) {
	.form-grid {
		grid-template-columns: 1fr;
	}
	.span-2 {
		grid-column: 1;
	}
	.stored-item-info {
		flex-wrap: wrap;
	}
}
</style>
