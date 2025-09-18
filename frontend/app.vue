<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
	titleTemplate: '%s - Task Manager',
	meta: [
		{ name: 'description', content: 'Simple task management application' }
	]
});
</script>

<style>
html {
	font-family: 'Roboto', sans-serif;
}

.v-application {
	font-family: 'Roboto', sans-serif !important;
}



::-webkit-scrollbar {
	width: 8px;
}

::-webkit-scrollbar-track {
	background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}
</style>