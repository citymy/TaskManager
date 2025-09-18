<template>
	<v-dialog v-model="dialog" max-width="600px" @click:outside="closeDialog">
		<template v-slot:activator="{ props }">
			<v-btn
				v-if="!task"
				color="primary"
				v-bind="props"
				prepend-icon="mdi-plus"
			>
				Add Task
			</v-btn>
			<v-btn
				v-else
				icon="mdi-pencil"
				size="small"
				variant="text"
				v-bind="props"
			/>
		</template>

		<v-card>
			<v-card-title>
				{{ task ? 'Edit Task' : 'Create Task' }}
			</v-card-title>

			<v-card-text>
				<v-form ref="form" v-model="valid" @submit.prevent="submitForm">
					<v-text-field
						v-model="formData.title"
						label="Title"
						:rules="titleRules"
						variant="outlined"
						class="mb-4"
					/>

					<v-textarea
						v-model="formData.description"
						label="Description"
						:rules="descriptionRules"
						variant="outlined"
						rows="3"
						class="mb-4"
					/>

					<v-select
						v-model="formData.status"
						label="Status"
						:items="statusOptions"
						:rules="statusRules"
						variant="outlined"
						class="mb-4"
					/>

					<v-text-field
						v-model="formData.dueDate"
						label="Due Date"
						type="date"
						:rules="dueDateRules"
						variant="outlined"
						class="mb-4"
					/>
				</v-form>
			</v-card-text>

			<v-card-actions>
				<v-spacer />
				<v-btn @click="closeDialog">Cancel</v-btn>
				<v-btn
					color="primary"
					:loading="loading"
					@click="submitForm"
					:disabled="!valid"
				>
					{{ task ? 'Update' : 'Create' }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import type { Task } from '~/stores/tasks'

interface Props {
	task?: Task
}

interface Emits {
	(e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const taskStore = useTaskStore()
const dialog = ref(false)
const valid = ref(false)
const form = ref()

const statusOptions = [
	{ title: 'Pending', value: 'pending' },
	{ title: 'In Progress', value: 'in_progress' },
	{ title: 'Completed', value: 'completed' }
]

const formData = ref({
	title: '',
	description: '',
	status: 'pending' as 'pending' | 'in_progress' | 'completed',
	dueDate: ''
})

const loading = computed(() => taskStore.loading)

// Validation rules
const titleRules = [
	(v: string) => !!v || 'Title is required',
	(v: string) => v.length >= 3 || 'Title must be at least 3 characters'
]

const descriptionRules = [
	(v: string) => !!v || 'Description is required',
	(v: string) => v.length >= 10 || 'Description must be at least 10 characters'
]

const statusRules = [
	(v: string) => !!v || 'Status is required'
]

const dueDateRules = [
	(v: string) => !!v || 'Due date is required'
]

// Initialize form data when editing
watch(dialog, (newVal) => {
	if (newVal && props.task) {
		formData.value = {
			title: props.task.title,
			description: props.task.description,
			status: props.task.status,
			dueDate: props.task.due_date.split('T')[0]
		}
	}
})

const resetForm = () => {
	formData.value = {
		title: '',
		description: '',
		status: 'pending',
		dueDate: ''
	}
	form.value?.resetValidation()
}

const closeDialog = () => {
	dialog.value = false
	if (!props.task) {
		resetForm()
	}
}

const submitForm = async () => {
	const { valid } = await form.value.validate()

	if (!valid) return

	try {
		const taskData = {
			...formData.value,
			dueDate: new Date(formData.value.dueDate).toISOString()
		}
		if (props.task) {
			await taskStore.updateTask(props.task.id, taskData)
		} else {
			await taskStore.createTask(taskData)
		}
		emit('success')
		closeDialog()
	} catch (err: any) {
		console.error('Failed to update task (1)');
	}
}
</script>