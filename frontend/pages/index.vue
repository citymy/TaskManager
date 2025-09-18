<template>
	<div>
		<div class="d-flex justify-space-between align-center mb-6">
			<h1 class="text-h4 font-weight-bold">Tasks</h1>
			<TaskForm @success="refreshTasks" />
		</div>

		<!--<TaskFilters @update:filters="handleFiltersUpdate" :task="currentTask" />-->

		<v-alert
			v-if="taskStore.error"
			type="error"
			closable
			class="mb-4"
			@click:close="clearError"
		>
			{{ taskStore.error }}
		</v-alert>

		<div v-if="taskStore && taskStore.tasks">
			<div v-if="taskStore.loading" class="text-center py-8">
				<v-progress-circular indeterminate color="primary" size="64" />
			</div>
			<div v-else-if="taskStore.tasks.data">
				<TaskCard
					v-for="task in taskStore.tasks.data"
					:key="task.id"
					:task="task"
					@refresh="refreshTasks"
				></TaskCard>
			</div>
			<div v-else class="text-center py-8">
				<v-icon size="64" color="grey-lighten-1" class="mb-4">
					mdi-clipboard-text-outline
				</v-icon>
				<h3 class="text-h6 text-grey-darken-1 mb-2">No tasks found</h3>
				<p class="text-body-2 text-grey-darken-1">
					Create your first task to get started
				</p>
			</div>
		</div>


	</div>
</template>

<script setup lang="ts">
import type { Task } from '~/stores/tasks';
import TaskForm from '~/components/TaskForm.vue';
import TaskFilters from '~/components/TaskFilters.vue';
import TaskCard from '~/components/TaskCard.vue';

const taskStore = useTaskStore();
const currentFilters = ref<TaskFilters>({});

useHead({
	title: 'Task Manager'
});

onMounted(() => {
	refreshTasks();
});
const currentTask = ref({
	//title: 'new task 1'
});
const handleFiltersUpdate = (filters: TaskFilters) => {
	currentFilters.value = filters;
	refreshTasks();
}

const refreshTasks = async () => {
	await taskStore.fetchTasks(currentFilters.value);
}

const clearError = () => {
	refreshTasks();
}
</script>