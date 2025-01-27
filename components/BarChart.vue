<!-- components/BarChart.vue -->
<template>
	<div class="w-full h-64">
		<Bar :data="chartData" :options="chartOptions" />
	</div>
</template>

<script setup>
import { Bar } from "vue-chartjs";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const props = defineProps({
	data: {
		type: Object,
		required: true,
	},
});

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false,
		},
	},
};

const chartData = computed(() => props.data);
</script>
