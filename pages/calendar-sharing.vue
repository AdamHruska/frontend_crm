<script setup>
const config = useRuntimeConfig();
import { useToast } from "vue-toastification";
const toast = useToast();
import axios from "axios";
import { useAuthStore } from "#imports";
const authStore = useAuthStore();

import { useUserStore } from "#imports";

const userStore = useUserStore();

const autoCreateOutlookEvent = ref(false);
const showHistory = ref(false);
const mailSender = ref("asistent");

const menoRef = ref("");
const poziciaRef = ref("");
const emailRef = ref("");
const telRef = ref("");
const textRef = ref("");
const icsLinkRef = ref("");

const icsCalendars = ref([]);
const newCalendarName = ref("");
const newIcsLink = ref("");

const fetchIcsCalendars = async () => {
	try {
		const response = await axios.get(`${config.public.apiUrl}ics-calendars`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
				"Content-Type": "application/json",
			},
		});
		icsCalendars.value = response.data;
	} catch (error) {
		console.error(error);
		toast.error("Nepodarilo sa načítať ICS kalendáre!");
	}
};

const addIcsCalendar = async () => {
	try {
		await axios.post(
			`${config.public.apiUrl}ics-calendars`,
			{ calendar_name: newCalendarName.value, ics_link: newIcsLink.value },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		toast.success("ICS kalendár bol pridaný!");
		newCalendarName.value = "";
		newIcsLink.value = "";
		await fetchIcsCalendars();
	} catch (error) {
		console.error(error);
		toast.error("Nepodarilo sa pridať ICS kalendár!");
	}
};

const deleteIcsCalendar = async (id) => {
	try {
		await axios.delete(`${config.public.apiUrl}ics-calendars/${id}`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
				"Content-Type": "application/json",
			},
		});
		toast.success("ICS kalendár bol odstránený!");
		await fetchIcsCalendars();
	} catch (error) {
		console.error(error);
		toast.error("Nepodarilo sa odstrániť ICS kalendár!");
	}
};

const updateMailSender = async () => {
	try {
		const response = await axios.patch(
			`${config.public.apiUrl}user/mail-sender`,
			{ mail_sender: mailSender.value },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (response.data.success) {
			userStore.user.mail_sender = mailSender.value;
			toast.success(
				`Odosielateľ mailov nastavený na: ${mailSender.value === "asistent" ? "Asistent" : "Môj Microsoft"}`,
			);
		}
	} catch (error) {
		console.error(error);
		toast.error("Nastala chyba pri aktualizácii nastavenia mailov!");
	}
};

const updateVizitka = async () => {
	try {
		const response = await axios.post(
			`${config.public.apiUrl}update-vizitka`,
			{
				vizitka_name: menoRef.value,
				vizitka_position: poziciaRef.value,
				vizitka_email: emailRef.value,
				vizitka_phone_num: telRef.value,
				vizitka_body: textRef.value,
			},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (response.status === 200) {
			toast.success("Vizitka bola úspešne upravená!");
		}
	} catch (error) {
		console.error(error);
		if (error.response?.data?.error) {
			toast.error(error.response.data.error);
		} else {
			toast.error("Nastala chyba pri upravovaní vizitky!");
		}
	}
};

const deleteNotification = async (playerId) => {
	try {
		const response = await axios.post(
			`${config.public.apiUrl}delete-onesignal-id`,
			{ player_id: playerId },
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (response.status === 200) {
			toast.success("Notifikácie boli úspešne vymazané!");
			userStore.user.oneSignal_ID = userStore.user.oneSignal_ID.filter(
				(idObj) => idObj.player_id !== playerId,
			);
		}
	} catch (error) {
		console.error(error);
		toast.error("Nastala chyba pri mazaní notifikácií!");
	}
};

const toggleAutoCreateOutlookEvent = async () => {
	try {
		const response = await axios.patch(
			`${config.public.apiUrl}user/auto-create-outlook-event`,
			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (response.data.success) {
			autoCreateOutlookEvent.value = response.data.auto_create_outlook_event;
			userStore.user.auto_create_outlook_event =
				response.data.auto_create_outlook_event;
			toast.success(
				`Automatické vytváranie Outlook eventu ${response.data.auto_create_outlook_event ? "zapnuté" : "vypnuté"}`,
			);
		}
	} catch (error) {
		console.error(error);
		toast.error("Nastala chyba pri aktualizácii Outlook nastavenia!");
	}
};

const loginWithGoogle = () => {
	const clientId = config.public.GOOGLE_CLIENT_ID;
	const redirectUri = config.public.GOOGLE_REDIRECT_URI;
	const scope = config.public.GOOGLE_SCOPE;
	const userId = userStore.user.id;
	if (!userId) {
		console.error("No user logged in");
		return;
	}
	const state = JSON.stringify({ userId, csrf: authStore.csrfToken });
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: redirectUri,
		scope,
		access_type: "offline",
		prompt: "consent",
		state,
	});
	window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

const logoutWithGoogle = async () => {
	try {
		const response = await $fetch(
			`/api/google/logout?userId=${userStore.user.id}`,
			{ method: "POST" },
		);
		if (response.success) {
			toast.success("Odhlásenie z Google úspešné!");
		} else {
			toast.error("Nepodarilo sa odhlásiť z Google.");
		}
	} catch (error) {
		console.error(error);
		toast.error("Nastala chyba pri odhlasovaní z Google.");
	}
};

const loginWithMicrosoft = () => {
	const clientId = config.public.AZURE_CLIENT_ID;
	const redirectUriRaw = config.public.AZURE_REDIRECT_URI;
	const scope = config.public.AZURE_SCOPE;
	const userId = userStore.user.id;
	if (!userId) {
		console.error("No user logged in");
		return;
	}
	const state = JSON.stringify({ userId, csrf: authStore.csrfToken });
	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUriRaw)}&scope=${encodeURIComponent(scope)}&response_mode=query&state=${encodeURIComponent(state)}`;
	window.location.href = authUrl;
};

const logoutWithMicrosoft = async () => {
	try {
		await axios.post(
			`${config.public.apiUrl}microsoft/logout`,
			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.token}`,
					"Content-Type": "application/json",
				},
			},
		);
		toast.success("Odhlásenie z Microsoft úspešné!");
		location.reload();
	} catch (error) {
		console.error("Microsoft logout failed:", error);
		toast.error("Nastala chyba pri odhlasovaní z Microsoft.");
	}
};

onMounted(async () => {
	await userStore.fetchUser();
	mailSender.value = userStore.user.mail_sender || "asistent";
	autoCreateOutlookEvent.value =
		userStore.user.auto_create_outlook_event === 1 ||
		userStore.user.auto_create_outlook_event === true;

	if (!userStore.user.vizitka_name) {
		const vizitka = await axios.get(`${config.public.apiUrl}vizitka`, {
			headers: {
				Authorization: `Bearer ${authStore.token}`,
				"Content-Type": "application/json",
			},
		});
		userStore.user.vizitka_name = vizitka.data.vizitka_name;
		userStore.user.vizitka_position = vizitka.data.vizitka_position;
		userStore.user.vizitka_email = vizitka.data.vizitka_email;
		userStore.user.vizitka_phone_num = vizitka.data.vizitka_phone_num;
		userStore.user.vizitka_body = vizitka.data.vizitka_body;
	}
	menoRef.value = userStore.user.vizitka_name;
	poziciaRef.value = userStore.user.vizitka_position || "";
	emailRef.value = userStore.user.vizitka_email;
	telRef.value = userStore.user.vizitka_phone_num;
	textRef.value = userStore.user.vizitka_body;
	icsLinkRef.value = userStore.user.ics_link || "";

	await fetchIcsCalendars();
});
</script>

<template>
	<div class="settings-page">
		<!-- Page header -->
		<div class="page-header">
			<h1 class="page-title">Nastavenia & zdieľanie</h1>
		</div>

		<!-- Calendar sharing tables -->
		<section class="page-section">
			<div class="two-col">
				<div>
					<div class="section-label">Koho kalendár vidím</div>
					<MyCalendarShareTable1 :user="userStore.user" />
				</div>
				<div>
					<div class="section-label">Kto vidí môj kalendár</div>
					<SharingTable6 />
				</div>
			</div>
		</section>

		<!-- Share section -->
		<section class="page-section">
			<div class="section-label">Zdieľať kalendár</div>
			<div class="card">
				<div class="card-body">
					<SearchBarSharing class="w-full" />
				</div>
			</div>
		</section>

		<!-- Request history -->
		<section class="page-section">
			<div class="card">
				<div class="card-body">
					<button
						class="history-toggle"
						:class="{ open: showHistory }"
						@click="showHistory = !showHistory"
					>
						<svg
							class="chevron-icon"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M7 10l3 3 3-3"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						História žiadostí
					</button>
					<div v-if="showHistory" class="history-body">
						<RequestsHistoryTable />
					</div>
				</div>
			</div>
		</section>

		<!-- Vizitka -->
		<section class="page-section">
			<div class="section-label">Vizitka</div>
			<div class="card">
				<div class="card-header">
					<svg
						class="card-icon"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="2"
							y="5"
							width="16"
							height="10"
							rx="2"
							stroke="currentColor"
							stroke-width="1.5"
						/>
						<path
							d="M6 10h4M6 13h2"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
						<circle
							cx="14"
							cy="10"
							r="2"
							stroke="currentColor"
							stroke-width="1.5"
						/>
					</svg>
					<h2 class="card-title">Kontaktné údaje</h2>
				</div>
				<div class="card-body">
					<div class="form-field">
						<label class="field-label">Text / popis</label>
						<textarea
							v-model="textRef"
							class="field-input"
							rows="3"
							placeholder="Krátky text o vás..."
						></textarea>
					</div>
					<div class="form-row">
						<div class="form-field">
							<label class="field-label">Meno</label>
							<input
								v-model="menoRef"
								type="text"
								class="field-input"
								placeholder="Vaše meno"
							/>
						</div>
						<div class="form-field">
							<label class="field-label">Pozícia</label>
							<input
								v-model="poziciaRef"
								type="text"
								class="field-input"
								placeholder="Váš titul alebo rola"
							/>
						</div>
					</div>
					<div class="form-row">
						<div class="form-field">
							<label class="field-label">Email</label>
							<input
								v-model="emailRef"
								type="email"
								class="field-input"
								placeholder="email@firma.sk"
							/>
						</div>
						<div class="form-field">
							<label class="field-label">Tel. č.</label>
							<input
								v-model="telRef"
								type="text"
								class="field-input"
								placeholder="+421 900 000 000"
							/>
						</div>
					</div>
					<div class="flex-end">
						<button class="btn-primary" @click="updateVizitka">
							Uložiť vizitku
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Settings toggles -->
		<section class="page-section">
			<div class="section-label">Predvoľby</div>
			<div class="card">
				<div class="card-body">
					<!-- Auto Outlook event -->
					<div class="toggle-row">
						<div class="toggle-info">
							<div class="toggle-label">Automaticky vytvárať Outlook event</div>
							<div class="toggle-desc">
								Pri schválení žiadosti sa vytvorí udalosť v Outlooku
							</div>
						</div>
						<label class="toggle-switch">
							<input
								type="checkbox"
								v-model="autoCreateOutlookEvent"
								@change="toggleAutoCreateOutlookEvent"
							/>
							<span class="toggle-track"></span>
						</label>
					</div>

					<!-- Mail sender -->
					<div class="toggle-row last">
						<div class="toggle-info">
							<div class="toggle-label">
								Odosielateľ pozvánok na online udalosti
							</div>
							<div class="toggle-desc">
								Zvoľte, odkiaľ sa budú odosielať pozvánky
							</div>
						</div>
						<div class="radio-group">
							<label
								class="radio-opt"
								:class="{ active: mailSender === 'asistent' }"
							>
								<input
									type="radio"
									name="mailSender"
									value="asistent"
									v-model="mailSender"
									@change="updateMailSender"
								/>
								<span class="radio-dot"></span>
								Asistent
							</label>
							<label
								class="radio-opt"
								:class="{ active: mailSender === 'microsoft' }"
							>
								<input
									type="radio"
									name="mailSender"
									value="microsoft"
									v-model="mailSender"
									@change="updateMailSender"
								/>
								<span class="radio-dot"></span>
								Môj Microsoft
							</label>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ICS Calendars -->
		<section class="page-section">
			<div class="section-label">ICS Kalendáre</div>
			<div class="card">
				<div class="card-header">
					<svg
						class="card-icon"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="2"
							y="4"
							width="16"
							height="14"
							rx="2"
							stroke="currentColor"
							stroke-width="1.5"
						/>
						<path
							d="M2 8h16M7 2v4M13 2v4M10 12v2m-1-1h2"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
					<h2 class="card-title">Outlook ICS kalendáre</h2>
				</div>
				<div class="card-body">
					<div class="ics-add-row">
						<div class="form-field mb-0">
							<label class="field-label">Názov</label>
							<input
								v-model="newCalendarName"
								type="text"
								class="field-input"
								placeholder="Napr. Firemný kalendár"
							/>
						</div>
						<div class="form-field mb-0 ics-link-field">
							<label class="field-label">ICS link</label>
							<input
								v-model="newIcsLink"
								type="text"
								class="field-input"
								placeholder="https://outlook.office365.com/.../calendar.ics"
							/>
						</div>
						<button class="btn-primary ics-add-btn" @click="addIcsCalendar">
							Pridať
						</button>
					</div>

					<div v-if="icsCalendars.length > 0" class="ics-table-wrap">
						<table class="data-table">
							<thead>
								<tr>
									<th>Názov</th>
									<th>ICS link</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="calendar in icsCalendars" :key="calendar.id">
									<td class="font-medium">{{ calendar.calendar_name }}</td>
									<td class="text-muted text-truncate">
										{{ calendar.ics_link }}
									</td>
									<td class="text-right">
										<button
											class="btn-danger-sm"
											@click="deleteIcsCalendar(calendar.id)"
										>
											Odstrániť
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div v-else class="empty-state">
						Zatiaľ nemáte pridané žiadne ICS kalendáre.
					</div>
				</div>
			</div>
		</section>

		<!-- Devices -->
		<section class="page-section">
			<div class="section-label">Zariadenia</div>
			<div class="card">
				<div class="card-header">
					<svg
						class="card-icon"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="2"
							y="6"
							width="11"
							height="8"
							rx="1.5"
							stroke="currentColor"
							stroke-width="1.5"
						/>
						<path
							d="M13 9h3a2 2 0 012 2v1a2 2 0 01-2 2h-3"
							stroke="currentColor"
							stroke-width="1.5"
						/>
						<path
							d="M7 14v2M5 16h4"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
					<h2 class="card-title">Notifikácie zariadení</h2>
				</div>
				<div class="card-body">
					<div
						v-if="
							userStore.user &&
							userStore.user.oneSignal_ID &&
							userStore.user.oneSignal_ID.length
						"
					>
						<div
							v-for="ClientID in userStore.user.oneSignal_ID"
							:key="ClientID.player_id"
							class="device-row"
						>
							<div class="device-icon">
								<svg
									viewBox="0 0 20 20"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<rect
										x="6"
										y="1"
										width="8"
										height="14"
										rx="2"
										stroke="currentColor"
										stroke-width="1.5"
									/>
									<circle cx="10" cy="13" r="1" fill="currentColor" />
								</svg>
							</div>
							<div class="device-info">
								<div class="device-name">{{ ClientID.device_name }}</div>
								<div class="device-date">{{ ClientID.added_at }}</div>
							</div>
							<button
								class="btn-danger-sm"
								@click="deleteNotification(ClientID.player_id)"
							>
								Odstrániť
							</button>
						</div>
					</div>
					<div v-else class="empty-state">
						Žiadne zariadenia s notifikáciami.
					</div>
				</div>
			</div>
		</section>

		<!-- Linked accounts -->
		<section class="page-section">
			<div class="section-label">Prepojené účty</div>
			<div class="card">
				<div class="card-body">
					<!-- Google -->
					<div class="provider-row">
						<div class="provider-info">
							<div class="provider-logo">
								<img src="/public/google_icon.png" alt="Google" />
							</div>
							<div>
								<div class="provider-name">Google</div>
								<div class="provider-status">
									Spravujte prístup ku Google kalendáru
								</div>
							</div>
						</div>
						<div class="provider-actions">
							<button class="btn-outline" @click="loginWithGoogle">
								Prihlásiť sa
							</button>
							<button class="btn-danger-outline" @click="logoutWithGoogle">
								Odhlásiť
							</button>
						</div>
					</div>
					<!-- Microsoft -->
					<div class="provider-row last">
						<div class="provider-info">
							<div class="provider-logo">
								<img src="/public/icons8-microsoft-48.png" alt="Microsoft" />
							</div>
							<div>
								<div class="provider-name">Microsoft</div>
								<div class="provider-status">
									Spravujte prístup ku Outlook kalendáru
								</div>
							</div>
						</div>
						<div class="provider-actions">
							<button class="btn-outline" @click="loginWithMicrosoft">
								Prihlásiť sa
							</button>
							<button class="btn-danger-outline" @click="logoutWithMicrosoft">
								Odhlásiť
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>

		<div class="page-footer">9.2.2026 aktuálna verzia</div>
	</div>
</template>

<style scoped>
/* ── Base ── */
.settings-page {
	max-width: 900px;
	margin: 0 auto;
	padding: 2rem 1.5rem 3rem;
	font-family: "Inter", system-ui, sans-serif;
}

/* ── Page header ── */
.page-header {
	margin-bottom: 2rem;
}
.page-title {
	font-size: 1.5rem;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.01em;
}

/* ── Sections ── */
.page-section {
	margin-bottom: 1.75rem;
}
.section-label {
	font-size: 0.7rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #64748b;
	margin-bottom: 0.5rem;
	padding-left: 0.25rem;
}
.two-col {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
}

/* ── Card ── */
.card {
	background: #ffffff;
	border: 1px solid #dbeafe;
	border-radius: 12px;
	overflow: hidden;
}
.card-header {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0.875rem 1.25rem;
	border-bottom: 1px solid #eff6ff;
	background: #f8faff;
}
.card-icon {
	width: 18px;
	height: 18px;
	color: #2563eb;
	flex-shrink: 0;
}
.card-title {
	font-size: 0.9rem;
	font-weight: 600;
	color: #1e3a8a;
}
.card-body {
	padding: 1.125rem 1.25rem;
}

/* ── History toggle ── */
.history-toggle {
	display: flex;
	align-items: center;
	gap: 8px;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 0.9rem;
	font-weight: 600;
	color: #1e40af;
	padding: 0;
	transition: color 0.15s;
}
.history-toggle:hover {
	color: #1d4ed8;
}
.chevron-icon {
	width: 20px;
	height: 20px;
	transition: transform 0.2s;
	transform: rotate(-90deg);
}
.history-toggle.open .chevron-icon {
	transform: rotate(0deg);
}
.history-body {
	margin-top: 1rem;
}

/* ── Forms ── */
.form-field {
	margin-bottom: 0.875rem;
}
.form-field.mb-0 {
	margin-bottom: 0;
}
.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;
	margin-bottom: 0.875rem;
}
.field-label {
	display: block;
	font-size: 0.75rem;
	font-weight: 600;
	color: #475569;
	margin-bottom: 0.3rem;
}
.field-input {
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	background: #f8faff;
	font-size: 0.875rem;
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
.flex-end {
	display: flex;
	justify-content: flex-end;
	margin-top: 0.25rem;
}

/* ── Buttons ── */
.btn-primary {
	padding: 0.5rem 1.25rem;
	background: #2563eb;
	color: #fff;
	border: none;
	border-radius: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s,
		transform 0.1s;
	white-space: nowrap;
}
.btn-primary:hover {
	background: #1d4ed8;
}
.btn-primary:active {
	transform: scale(0.98);
}

.btn-outline {
	padding: 0.45rem 1rem;
	background: #fff;
	color: #2563eb;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s,
		border-color 0.15s;
}
.btn-outline:hover {
	background: #eff6ff;
	border-color: #93c5fd;
}

.btn-danger-outline {
	padding: 0.45rem 1rem;
	background: #fff;
	color: #dc2626;
	border: 1px solid #fecaca;
	border-radius: 8px;
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.btn-danger-outline:hover {
	background: #fef2f2;
}

.btn-danger-sm {
	padding: 0.35rem 0.875rem;
	background: #fff;
	color: #dc2626;
	border: 1px solid #fecaca;
	border-radius: 7px;
	font-size: 0.78rem;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	transition: background 0.15s;
}
.btn-danger-sm:hover {
	background: #fef2f2;
}

/* ── Toggle switch ── */
.toggle-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.875rem 0;
	border-bottom: 1px solid #eff6ff;
	gap: 1rem;
}
.toggle-row.last {
	border-bottom: none;
}
.toggle-info {
	flex: 1;
	min-width: 0;
}
.toggle-label {
	font-size: 0.875rem;
	font-weight: 600;
	color: #1e293b;
}
.toggle-desc {
	font-size: 0.78rem;
	color: #64748b;
	margin-top: 2px;
}

.toggle-switch {
	position: relative;
	flex-shrink: 0;
}
.toggle-switch input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}
.toggle-track {
	display: block;
	width: 40px;
	height: 22px;
	background: #cbd5e1;
	border-radius: 11px;
	cursor: pointer;
	position: relative;
	transition: background 0.2s;
}
.toggle-track::before {
	content: "";
	position: absolute;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #fff;
	top: 3px;
	left: 3px;
	transition: transform 0.2s;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle-switch input:checked + .toggle-track {
	background: #2563eb;
}
.toggle-switch input:checked + .toggle-track::before {
	transform: translateX(18px);
}

/* ── Radio group ── */
.radio-group {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}
.radio-opt {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0.4rem 0.875rem;
	border: 1px solid #dbeafe;
	border-radius: 20px;
	cursor: pointer;
	font-size: 0.8rem;
	font-weight: 500;
	color: #64748b;
	transition: all 0.15s;
	user-select: none;
}
.radio-opt input {
	display: none;
}
.radio-dot {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 1.5px solid #cbd5e1;
	background: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.15s;
	flex-shrink: 0;
}
.radio-opt.active {
	border-color: #3b82f6;
	color: #1e40af;
	background: #eff6ff;
}
.radio-opt.active .radio-dot {
	background: #2563eb;
	border-color: #2563eb;
}
.radio-opt.active .radio-dot::after {
	content: "";
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: #fff;
}

/* ── ICS ── */
.ics-add-row {
	display: grid;
	grid-template-columns: 1fr 2fr auto;
	gap: 0.75rem;
	align-items: flex-end;
	margin-bottom: 1rem;
}
.ics-add-btn {
	align-self: flex-end;
	height: 36px;
}
.ics-table-wrap {
	margin-top: 0.75rem;
}

/* ── Data table ── */
.data-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.85rem;
}
.data-table th {
	text-align: left;
	font-size: 0.7rem;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid #dbeafe;
	background: #f8faff;
}
.data-table td {
	padding: 0.625rem 0.75rem;
	border-bottom: 1px solid #eff6ff;
	color: #1e293b;
	vertical-align: middle;
}
.data-table tr:last-child td {
	border-bottom: none;
}
.data-table .font-medium {
	font-weight: 600;
}
.data-table .text-muted {
	color: #64748b;
	font-size: 0.78rem;
}
.data-table .text-truncate {
	max-width: 240px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.data-table .text-right {
	text-align: right;
}

/* ── Empty state ── */
.empty-state {
	text-align: center;
	padding: 1.5rem;
	color: #94a3b8;
	font-size: 0.85rem;
}

/* ── Devices ── */
.device-row {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 0.75rem 0;
	border-bottom: 1px solid #eff6ff;
}
.device-row:last-child {
	border-bottom: none;
}
.device-icon {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	border: 1px solid #dbeafe;
	background: #eff6ff;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.device-icon svg {
	width: 18px;
	height: 18px;
	color: #2563eb;
}
.device-info {
	flex: 1;
	min-width: 0;
}
.device-name {
	font-size: 0.875rem;
	font-weight: 600;
	color: #1e293b;
}
.device-date {
	font-size: 0.78rem;
	color: #64748b;
	margin-top: 2px;
}

/* ── Providers ── */
.provider-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.875rem 0;
	border-bottom: 1px solid #eff6ff;
	gap: 1rem;
}
.provider-row.last {
	border-bottom: none;
}
.provider-info {
	display: flex;
	align-items: center;
	gap: 12px;
}
.provider-logo {
	width: 36px;
	height: 36px;
	border-radius: 8px;
	border: 1px solid #dbeafe;
	background: #f8faff;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	flex-shrink: 0;
}
.provider-logo img {
	width: 22px;
	height: 22px;
	object-fit: contain;
}
.provider-name {
	font-size: 0.875rem;
	font-weight: 600;
	color: #1e293b;
}
.provider-status {
	font-size: 0.78rem;
	color: #64748b;
	margin-top: 2px;
}
.provider-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

/* ── Footer ── */
.page-footer {
	text-align: right;
	font-size: 0.75rem;
	color: #94a3b8;
	padding-top: 1rem;
}
</style>
