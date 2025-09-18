<template>
	<v-app>
		<v-app-bar elevation="1" color="primary" dark>
			<v-toolbar-title>Task Manager</v-toolbar-title>
		</v-app-bar>

		<v-main>
			<v-container fluid class="pa-6">
				<slot />
			</v-container>
		</v-main>
	</v-app>
</template>

<script setup lang="ts">
// Layout setup
</script>