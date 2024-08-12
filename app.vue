<script setup>
const user = useCurrentUser();
const router = useRouter();
const auth = useFirebaseAuth();

onMounted(() => {
	watch(user, (currentUser, prevUser) => {
		if (prevUser && !currentUser) {
			return router.replace("/login");
		}
	});
});
</script>

<template>
	<div>
		<NuxtLayout :user="user" :auth="auth">
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
