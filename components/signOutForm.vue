<script setup>
const emit = defineEmits(["cancelSignOut"], ["confirmSignOut"]);
const auth = useFirebaseAuth();
const user = useCurrentUser();
import { signOut } from "firebase/auth";

function cancelSignOut() {
	emit("cancelSignOut");
}

function confirmSignOut() {
	signOut(auth);
	emit("cancelSignOut");
}
</script>

<template>
	<div
		class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center"
	>
		<div class="bg-white p-4 w-[300px] h-[150px] rounded-lg shadow-lg">
			<h3 class="text-black text-lg font-semibold text-center">
				{{ user.displayName.split(" ")[0] }}
			</h3>
			<p class="text-lg font-semibold mb-4 text-black text-center mt-1">
				Do you want to sign out?
			</p>
			<div class="flex justify-center mt-18">
				<button
					@click="confirmSignOut"
					class="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-400"
				>
					Yes
				</button>
				<button
					@click="cancelSignOut"
					class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-800"
				>
					No
				</button>
			</div>
		</div>
	</div>
</template>
