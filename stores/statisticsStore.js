import { defineStore } from "pinia";

// Filters and loaded data of pages/statistics.vue, kept while navigating
// between pages so the page does not reset or reload every time it is opened
export const useStatisticsStore = defineStore("statistics", {
	state: () => ({
		// ── Filters ──
		dateRange: { from: "", to: "" },
		selectedPeriod: "month",
		selectedUserIds: [],
		includeMyStats: true,

		// ── Loaded data ──
		statistics: { called: 0, reached: 0, scheduled: 0 },
		responseData: {},
		dataPohovory: null,
		otherActivies: {},
		otherActiviesNames: {},
		seminarActivitesStatistics: {},
		seminarActivitesNames: {},
		zaujatiKandidati: [],

		// Filters the loaded data belongs to (null = nothing loaded yet)
		loadedKey: null,
		loadedAt: null,
	}),

	getters: {
		// Identifies one combination of filters
		filtersKey: (state) =>
			JSON.stringify({
				from: state.dateRange.from,
				to: state.dateRange.to,
				me: state.includeMyStats,
				users: [...state.selectedUserIds].sort((a, b) => a - b),
			}),

		// Loaded data matches the current filters
		isLoadedForFilters() {
			return this.loadedKey !== null && this.loadedKey === this.filtersKey;
		},
	},
});
