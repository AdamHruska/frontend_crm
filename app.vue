<script setup>
const router = useRouter();
</script>

<template>
	<div>
		<NuxtLayout :user="user" :auth="auth">
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
