import { defineStore } from "pinia";

function formatLocalDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const today = new Date();
const DEFAULT_FROM = formatLocalDate(
	new Date(today.getFullYear(), today.getMonth(), 1),
);
const DEFAULT_TO = formatLocalDate(today);

const LS_KEY = "ohrievac_prefs";

function loadPrefs() {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (raw) return JSON.parse(raw);
	} catch {}
	return null;
}

function savePrefs(prefs) {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(prefs));
	} catch {}
}

export const useOhrievacStore = defineStore("ohrievac", {
	state: () => {
		const prefs = loadPrefs();
		return {
			// Persisted preferences
			dateFrom: prefs?.dateFrom ?? DEFAULT_FROM,
			dateTo: prefs?.dateTo ?? DEFAULT_TO,
			hideDiscardedStretnutie: prefs?.hideDiscardedStretnutie ?? false,

			// In-memory cache: key → { data }
			// Key format: `${userId}__${dateFrom}__${dateTo}`
			_cache: {},

			loading: false,
		};
	},

	getters: {
		/**
		 * Build the cache key for a given userId + date range.
		 */
		cacheKey: (state) => (userId, dateFrom, dateTo) => {
			const f = dateFrom ?? state.dateFrom;
			const t = dateTo ?? state.dateTo;
			return `${userId}__${f}__${t}`;
		},

		/**
		 * Return cached data for a key, or null if not cached.
		 */
		getCached: (state) => (key) => {
			return state._cache[key]?.data ?? null;
		},

		/**
		 * Whether a key is already in cache.
		 */
		isCached: (state) => (key) => {
			return key in state._cache;
		},
	},

	actions: {
		/**
		 * Store fetched data in cache.
		 */
		setCache(key, data) {
			this._cache[key] = { data };
		},

		/**
		 * Invalidate all cache entries for a userId (called when date changes).
		 */
		invalidateUser(userId) {
			const prefix = `${userId}__`;
			for (const key of Object.keys(this._cache)) {
				if (key.startsWith(prefix)) {
					delete this._cache[key];
				}
			}
		},

		/**
		 * Update dateFrom, persist, and invalidate cache for the given user.
		 */
		setDateFrom(value, userId) {
			this.dateFrom = value;
			this._persistPrefs();
			if (userId != null) this.invalidateUser(userId);
		},

		/**
		 * Update dateTo, persist, and invalidate cache for the given user.
		 */
		setDateTo(value, userId) {
			this.dateTo = value;
			this._persistPrefs();
			if (userId != null) this.invalidateUser(userId);
		},

		/**
		 * Toggle/set the "hide discarded stretnutie" filter and persist.
		 */
		setHideDiscarded(value) {
			this.hideDiscardedStretnutie = value;
			this._persistPrefs();
		},

		_persistPrefs() {
			savePrefs({
				dateFrom: this.dateFrom,
				dateTo: this.dateTo,
				hideDiscardedStretnutie: this.hideDiscardedStretnutie,
			});
		},
	},
});
