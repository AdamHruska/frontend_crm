import { defineStore } from "pinia";

export const useDeleteActivities = defineStore("deletedActivities", {
	state: () => ({
		selectedMonth: null,
		selectedYear: null,
	}),

	actions: {
		setMonth(month) {
			this.selectedMonth = month;
		},

		setYear(year) {
			this.selectedYear = year;
		},

		setMonthAndYear(month, year) {
			this.selectedMonth = month;
			this.selectedYear = year;
		},
	},

	getters: {
		hasStoredValues: (state) => {
			return state.selectedMonth !== null && state.selectedYear !== null;
		},
	},
});
