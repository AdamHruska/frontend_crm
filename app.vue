<script setup>
import axios from "axios";
axios.defaults.withCredentials = false;
const router = useRouter();
</script>

<template>
	<div>
		<NuxtLayout :user="user" :auth="auth">
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
