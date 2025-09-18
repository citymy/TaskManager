<template>
	<v-card class="mb-4" elevation="2" v-if="task">
		<v-card-text>
			<div class="d-flex justify-space-between align-start mb-2">
				<h3 class="text-h6">{{ task.title }}</h3>
				<div class="d-flex gap-2">
					<TaskForm :task="task" @success="$emit('refresh')" />
					<v-btn
						icon="mdi-delete"
						size="small"
						variant="text"
						color="error"
						@click="deleteTask"
						:loading="taskStore.loading"
					/>
				</div>
			</div>

			<p class="text-body-2 mb-3">{{ task.description }}</p>

			<div class="d-flex justify-space-between align-center">
				<v-chip
					:color="getStatusColor(task.status)"
					size="small"
					variant="flat"
				>
					{{ getStatusText(task.status) }}
				</v-chip>

				<div class="text-body-2 text-medium-emphasis">
					Due: {{ formatDate(task.due_date) }}
				</div>
			</div>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">

import type { Task } from '~/stores/tasks'
import TaskForm from './TaskForm.vue'

interface Props {
	task: Task
}

interface Emits {
	(e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const taskStore = useTaskStore()

const getStatusColor = (status: Task['status']) => {
	const colors = {
		'pending': 'orange',
		'in_progress': 'blue',
		'completed': 'green'
	}
	return colors[status]
}

const getStatusText = (status: Task['status']) => {
	const texts = {
		'pending': 'Pending',
		'in_progress': 'In Progress',
		'completed': 'Completed'
	}
	return texts[status]
}

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})
}

const deleteTask = async () => {
	if (confirm('Are you sure you want to delete this task?')) {
		try {
			await taskStore.deleteTask(props.task.id)
			emit('refresh')
		} catch (error) {
			console.error('Error deleting task:', error)
		}
	}
}
</script>