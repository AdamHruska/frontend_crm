<script setup>
const config = useRuntimeConfig();
import { ref, watch } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";

import { useContactsStore } from "@/stores/contactsStore";
import { useToast } from "vue-toastification";
const toast = useToast();
const contactsStore = useContactsStore();

const authStore = useAuthStore();
authStore.loadToken();

const users = ref([
	{
		meno: "",
		priezvisko: "",
		cislo: "",
		email: "",
		odporucitel: "",
		adresa: "",
		vek: "",
		zamestanie: "",
		poznamka: "",
		isNew: true,
		isContact: true,
		isCoWorker: false,
	},
]);

const peopleFromResposne = ref([]);
const odporucitelInput = ref("");
const emit = defineEmits(["cancelAdd", "addPeople"]);

function addRow() {
	if (users.value.length < 10) {
		users.value.push({
			meno: "",
			priezvisko: "",
			cislo: "",
			email: "",
			odporucitel: "",
			adresa: "",
			vek: "",
			zamestanie: "",
			poznamka: "",
			isNew: true,
			isContact: true,
			isCoWorker: false,
		});
	}
}

function resetForm() {
	users.value = [
		{
			meno: "",
			priezvisko: "",
			cislo: "",
			email: "",
			odporucitel: "",
			adresa: "",
			vek: "",
			zamestanie: "",
			poznamka: "",
			isNew: true,
			isContact: true,
			isCoWorker: false,
		},
	];
}

function formatDate(dateString) {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return dateString;
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	return `${day}.${month}.${year}`;
}

function cancelAdd() {
	resetForm();
	emit("cancelAdd");
}

function saveToCookies() {
	Cookies.set("users", JSON.stringify(users.value));
}

watch(users, saveToCookies, { deep: true });

watch(odporucitelInput, (newVal) => {
	users.value.forEach((user) => {
		user.odporucitel = newVal;
	});
});

const duplicates = ref([]);

const addPeople = async () => {
	contactsStore.loadingState = true;

	const people = users.value.filter(
		(person) => person.meno && person.priezvisko && person.odporucitel,
	);

	for (let user of users.value) {
		if (!user.meno || !user.priezvisko || !user.odporucitel) {
			alert(
				"Meno, priezvisko a odporúčiteľ sú povinné pre každý riadok. Prosím, vyplňte ich.",
			);
			contactsStore.loadingState = false;
			return;
		}
		if (user.vek && isNaN(Number(user.vek))) {
			alert(
				`Vek musí byť číslo. Skontrolujte riadok s menom ${user.meno || "bez mena"}.`,
			);
			contactsStore.loadingState = false;
			return;
		}
		if (user.cislo && isNaN(Number(user.cislo))) {
			alert(
				`Číslo musí byť platné číslo. Skontrolujte riadok s menom ${user.meno || "bez mena"}.`,
			);
			contactsStore.loadingState = false;
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (user.email && !emailRegex.test(user.email)) {
			alert(`Email "${user.email}" nemá platný formát. Skontrolujte prosím.`);
			contactsStore.loadingState = false;
			return;
		}
	}

	if (people.length === 0) {
		alert("Vyplňte povinné polia pre aspoň jeden riadok.");
		contactsStore.loadingState = false;
		return;
	}

	try {
		for (let person of people) {
			try {
				const response = await axios.post(
					`${config.public.apiUrl}post-create-contact`,
					person,
					{ headers: { Authorization: `Bearer ${authStore.token}` } },
				);

				if (response.data.message.includes("ako duplikát")) {
					toast.warning(
						`${person.meno} ${person.priezvisko} bol pridaný ako duplikát (existuje v inej databáze)`,
						{
							position: "top-center",
							timeout: 8000,
							closeOnClick: true,
							pauseOnHover: true,
							draggable: true,
							icon: "⚠️",
						},
					);
				}

				peopleFromResposne.value.push(response.data.contact);
			} catch (error) {
				if (error.response && error.response.status === 409) {
					toast.error(
						`${person.meno} ${person.priezvisko} wasn't added - ${error.response.data.message}` +
							(error.response.data.existing_contact.last_activity
								? ` (last activity: ${formatDate(error.response.data.existing_contact.last_activity)})`
								: ""),
						{
							position: "top-center",
							timeout: 10000,
							closeOnClick: true,
							pauseOnHover: true,
							draggable: true,
							draggablePercent: 60,
							showCloseButtonOnHover: false,
							hideProgressBar: false,
						},
					);
					duplicates.value.push({
						attempted: person,
						existing: error.response.data.existing_contact,
						message: error.response.data.message,
					});
					continue;
				} else {
					throw error;
				}
			}
		}

		Cookies.remove("users");

		if (duplicates.value.length === 0) {
			emit("addPeople", peopleFromResposne.value);
			resetForm();
		}
	} catch (error) {
		console.error("Error adding people:", error);
		alert("An error occurred while adding contacts. Please try again.");
	}
	contactsStore.loadingState = false;
};

function removeRow(index) {
	if (users.value.length > 1) {
		users.value.splice(index, 1);
	}
}

function toggleType(user, type) {
	if (type === "contact") {
		user.isContact = true;
		user.isCoWorker = false;
	} else if (type === "coworker") {
		user.isContact = false;
		user.isCoWorker = true;
	}
}

// 10 columns in the main row (meta, meno, priezvisko, cislo, email, odporucitel, adresa, vek, zamestanie, remove)
const TOTAL_COLS = 10;
</script>

<template>
	<div class="modal-backdrop">
		<div class="modal-panel">
			<!-- Header -->
			<div class="modal-header">
				<div class="header-left">
					<span class="header-label">Odporúčiteľ</span>
					<input
						class="odporucitel-input"
						v-model="odporucitelInput"
						placeholder="Meno odporúčiteľa..."
					/>
				</div>
				<h2 class="modal-title">Pridať kontakty</h2>
				<div class="header-right">
					<button
						class="add-row-btn"
						@click="addRow"
						:disabled="users.length >= 10"
					>
						<Icon icon="fa6-solid:plus" class="btn-icon" /> Pridať riadok
					</button>
					<button class="close-btn" @click="cancelAdd()">
						<Icon icon="fa6-solid:xmark" />
					</button>
				</div>
			</div>

			<!-- Scrollable table -->
			<div class="table-scroll">
				<table class="contacts-table">
					<thead>
						<tr>
							<th class="col-meta">Nový / Typ</th>
							<th class="col-meno">Meno</th>
							<th class="col-priezvisko">Priezvisko</th>
							<th class="col-cislo">Číslo</th>
							<th class="col-email">Email</th>
							<th class="col-odporucitel">Odporúčiteľ</th>
							<th class="col-adresa">Adresa</th>
							<th class="col-vek">Vek</th>
							<th class="col-zamestanie">Zamestnanie</th>
							<th class="col-remove"></th>
						</tr>
					</thead>
					<tbody>
						<template v-for="(user, index) in users" :key="index">
							<!-- ── Main row ── -->
							<tr class="data-row">
								<td class="col-meta td-meta">
									<div class="meta-cell">
										<label class="custom-check" title="Nový kontakt">
											<input type="checkbox" v-model="user.isNew" />
											<span class="check-box">
												<svg
													width="10"
													height="8"
													viewBox="0 0 10 8"
													fill="none"
												>
													<path
														d="M1 4L3.5 6.5L9 1"
														stroke="white"
														stroke-width="1.8"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
												</svg>
											</span>
											<span class="check-label">Nový</span>
										</label>
										<div class="type-toggle">
											<button
												:class="[
													'toggle-btn',
													user.isContact ? 'active-contact' : '',
												]"
												@click="toggleType(user, 'contact')"
											>
												Klient
											</button>
											<button
												:class="[
													'toggle-btn',
													user.isCoWorker ? 'active-coworker' : '',
												]"
												@click="toggleType(user, 'coworker')"
											>
												Spol.
											</button>
										</div>
									</div>
								</td>
								<td class="col-meno">
									<input
										v-model="user.meno"
										class="cell-input"
										placeholder="Meno"
									/>
								</td>
								<td class="col-priezvisko">
									<input
										v-model="user.priezvisko"
										class="cell-input"
										placeholder="Priezvisko"
									/>
								</td>
								<td class="col-cislo">
									<input
										v-model="user.cislo"
										class="cell-input"
										placeholder="+421..."
									/>
								</td>
								<td class="col-email">
									<input
										v-model="user.email"
										class="cell-input"
										placeholder="email@..."
									/>
								</td>
								<td class="col-odporucitel">
									<input
										v-model="user.odporucitel"
										class="cell-input"
										placeholder="Odporúčiteľ"
									/>
								</td>
								<td class="col-adresa">
									<input
										v-model="user.adresa"
										class="cell-input"
										placeholder="Adresa"
									/>
								</td>
								<td class="col-vek">
									<input
										v-model="user.vek"
										class="cell-input"
										placeholder="1990"
									/>
								</td>
								<td class="col-zamestanie">
									<input
										v-model="user.zamestanie"
										class="cell-input"
										placeholder="Zamestnanie"
									/>
								</td>
								<td class="col-remove td-remove">
									<button
										class="remove-btn"
										@click="removeRow(index)"
										:disabled="users.length === 1"
										title="Odstrániť riadok"
									>
										<Icon icon="fa6-solid:xmark" />
									</button>
								</td>
							</tr>

							<!-- ── Poznámka sub-row: spans ALL columns ── -->
							<tr class="sub-row">
								<td :colspan="TOTAL_COLS" class="sub-cell-full">
									<input
										v-model="user.poznamka"
										class="cell-input poznamka-input"
										placeholder="Poznámka..."
									/>
								</td>
							</tr>
						</template>
					</tbody>
				</table>
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button class="cancel-btn" @click="cancelAdd()">Zrušiť</button>
				<button class="submit-btn" @click="addPeople">
					<Icon icon="fa6-solid:user-plus" class="btn-icon" />
					Pridať používateľov
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* ── Backdrop ── */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 20, 30, 0.65);
	display: flex;
	align-items: flex-start;
	justify-content: center;
	z-index: 40;
	padding: 24px 16px;
	overflow-y: auto;
}

/* ── Panel ── */
.modal-panel {
	background: #f4f6f9;
	border-radius: 14px;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
	width: 100%;
	max-height: calc(100vh - 48px);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* ── Header ── */
.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 20px;
	background: #fff;
	border-bottom: 1px solid #e4e8ef;
	border-radius: 14px 14px 0 0;
	flex-shrink: 0;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-shrink: 0;
}

.header-label {
	font-size: 13px;
	font-weight: 600;
	color: #6b7280;
	white-space: nowrap;
}

.odporucitel-input {
	padding: 7px 11px;
	border-radius: 7px;
	border: 1px solid #d1d5db;
	background: #f8f9fb;
	font-size: 13.5px;
	color: #111827;
	outline: none;
	min-width: 160px;
	transition: border-color 0.15s;
}
.odporucitel-input:focus {
	border-color: #2563eb;
	background: #fff;
}

.modal-title {
	font-size: 18px;
	font-weight: 700;
	color: #111827;
	white-space: nowrap;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-shrink: 0;
}

.add-row-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	background: #16a34a;
	color: #fff;
	border: none;
	border-radius: 8px;
	font-size: 13.5px;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.add-row-btn:hover {
	background: #15803d;
}
.add-row-btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
}

.close-btn {
	width: 34px;
	height: 34px;
	border-radius: 8px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	color: #6b7280;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 15px;
	transition: all 0.15s;
}
.close-btn:hover {
	background: #fee2e2;
	color: #b91c1c;
	border-color: #fca5a5;
}

.btn-icon {
	font-size: 12px;
}

/* ── Table scroll area ── */
.table-scroll {
	overflow: auto;
	flex: 1 1 auto;
	-webkit-overflow-scrolling: touch;
}

/* ── Table ── */
.contacts-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
	table-layout: fixed;
}

/* Column widths */
.col-meta {
	width: 100px;
}
.col-meno {
	width: 110px;
}
.col-priezvisko {
	width: 120px;
}
.col-cislo {
	width: 110px;
}
.col-email {
	width: 150px;
}
.col-odporucitel {
	width: 120px;
}
.col-adresa {
	width: 130px;
}
.col-vek {
	width: 60px;
}
.col-zamestanie {
	width: 130px;
}
.col-remove {
	width: 40px;
}

.contacts-table thead tr {
	background: #fff;
	border-bottom: 2px solid #e4e8ef;
	position: sticky;
	top: 0;
	z-index: 10;
}

.contacts-table th {
	padding: 10px 10px;
	text-align: left;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #6b7280;
	white-space: nowrap;
}

/* ── Main data row ── */
.data-row {
	background: #fff;
}
.data-row:hover {
	background: #f8f9fb;
}

.contacts-table td {
	padding: 8px 10px;
	vertical-align: middle;
}

/* ── Meta cell ── */
.td-meta {
	padding: 8px 10px;
}

.meta-cell {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
}

/* Nový checkbox */
.custom-check {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
}
.custom-check input {
	display: none;
}

.check-box {
	width: 17px;
	height: 17px;
	border-radius: 5px;
	border: 1.5px solid #d1d5db;
	background: #f3f4f6;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.15s;
}
.check-box svg {
	display: none;
}
.custom-check input:checked + .check-box {
	background: #2563eb;
	border-color: #2563eb;
}
.custom-check input:checked + .check-box svg {
	display: block;
}
.custom-check:hover .check-box {
	border-color: #2563eb;
}

.check-label {
	font-size: 12px;
	font-weight: 600;
	color: #374151;
}

/* Type toggle */
.type-toggle {
	display: inline-flex;
	gap: 3px;
	background: #e5e7eb;
	border-radius: 7px;
	padding: 2px;
}
.toggle-btn {
	font-size: 11px;
	font-weight: 600;
	padding: 3px 8px;
	border-radius: 5px;
	cursor: pointer;
	color: #6b7280;
	border: none;
	background: transparent;
	transition: all 0.15s;
}
.toggle-btn.active-contact {
	background: #2563eb;
	color: #fff;
}
.toggle-btn.active-coworker {
	background: #7c3aed;
	color: #fff;
}

/* ── Cell inputs ── */
.cell-input {
	width: 100%;
	padding: 6px 8px;
	border-radius: 6px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	font-size: 13px;
	color: #111827;
	outline: none;
	transition:
		border-color 0.15s,
		background 0.15s;
	box-sizing: border-box;
}
.cell-input:focus {
	border-color: #2563eb;
	background: #fff;
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.cell-input::placeholder {
	color: #c0c4cc;
}

/* ── Poznámka sub-row ── */
.sub-row {
	background: #f8f9fb;
	border-bottom: 2px solid #e4e8ef;
}

.sub-cell-full {
	padding: 4px 10px 8px;
	/* stretch to full table width via colspan=TOTAL_COLS */
}

.sub-label {
	display: block;
	font-size: 10.5px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #9ca3af;
	margin-bottom: 3px;
}

.poznamka-input {
	background: #fff;
}

/* ── Remove button ── */
.td-remove {
	text-align: center;
}

.remove-btn {
	width: 28px;
	height: 28px;
	border-radius: 6px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	color: #9ca3af;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 13px;
	transition: all 0.15s;
	margin: 0 auto;
}
.remove-btn:hover {
	background: #fee2e2;
	color: #b91c1c;
	border-color: #fca5a5;
}
.remove-btn:disabled {
	opacity: 0.3;
	cursor: not-allowed;
}

/* ── Footer ── */
.modal-footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 20px;
	background: #fff;
	border-top: 1px solid #e4e8ef;
	border-radius: 0 0 14px 14px;
	flex-shrink: 0;
}

.cancel-btn {
	padding: 9px 18px;
	border-radius: 8px;
	border: 1px solid #e4e8ef;
	background: #f8f9fb;
	font-size: 14px;
	font-weight: 600;
	color: #374151;
	cursor: pointer;
	transition: all 0.15s;
}
.cancel-btn:hover {
	background: #e4e8ef;
}

.submit-btn {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 9px 20px;
	border-radius: 8px;
	border: none;
	background: #2563eb;
	color: #fff;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.submit-btn:hover {
	background: #1d4ed8;
}
</style>
