<script setup>
import { Icon } from "@iconify/vue";
</script>

<template>
	<div class="blured-background"></div>
	<div class="modal-container">
		<div class="close-btn-container">
			<Icon
				icon="fa6-solid:xmark"
				class="absolute top-4 right-6 cursor-pointer"
				@click="$emit('close')"
			/>
		</div>
		<h1 class="heading">Chcete vytvoriť Analýzu osobných financií?</h1>
		<div class="btn-container">
			<button class="btn btn-primary" @click="$emit('confirm')">Áno</button>
			<button class="btn btn-secondary" @click="$emit('close')">Nie</button>
		</div>
	</div>
</template>

<style scoped>
.blured-background {
	background-color: rgba(0, 0, 0, 0.5);
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1000;
}

.modal-container {
	background-color: #fff;
	position: absolute;
	top: 30%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 30px;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	z-index: 1001;
}

.heading {
	margin-top: 30px;
	font-size: 1.3rem;
	font-weight: 500;
	margin-bottom: 20px;
	text-align: center;
}

.btn-container {
	display: flex;
	justify-content: center;
	gap: 40px;
}

.btn {
	color: white;
	padding: 10px 20px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

.btn-primary {
	background-color: #2563eb; /* blue */
}

.btn-primary:hover {
	background-color: #1d4ed8; /* darker blue */
}

.btn-secondary {
	background-color: #f3f4f6;
	color: #111827;
}

.btn-secondary:hover {
	background-color: #e5e7eb;
	color: #1f2937;
}
</style>
