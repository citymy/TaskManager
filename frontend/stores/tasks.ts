import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import { $fetch } from 'ofetch';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskFilters {
    status?: 'pending' | 'in_progress' | 'completed' | '';
    sortBy?: 'dueDate' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export const useTaskStore = defineStore('tasks', () => {
    const tasks = ref<Task[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const config = useRuntimeConfig();


    const fetchTasks = async (filters: TaskFilters = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const query = new URLSearchParams();
            if (filters.status) query.append('status', filters.status);
            if (filters.sortBy) query.append('sortBy', filters.sortBy);
            if (filters.sortOrder) query.append('sortOrder', filters.sortOrder);

            const url = `${config.public.apiBaseUrl}/api/tasks${query.toString() ? `?${query.toString()}` : ''}`;
            console.log('URL:', config.public.apiBaseUrl, url);

            const data = await $fetch<Task[]>(url);


            /*if(data && data.data && Array.isArray(data.data)){
                data.data = data.data.map(row => ({
                    ...row,
                    dueDate: row.due_date,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }));
            }*/
            tasks.value = data;

        } catch (err) {
            error.value = 'Failed to fetch tasks';
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const createTask = async (
        taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
        loading.value = true;
        error.value = null;

        try {
            const newTask = await $fetch<Task>(`${config.public.apiBaseUrl}/api/tasks`, {
                method: 'POST',
                body: taskData
            });
            tasks.value.data.push(newTask);
            return newTask;
        } catch (err: any) {
            if (err.data && err.data.errors && err.data.errors.length > 0) {
                error.value = err.data.errors[0].message;
            }
            else {
                error.value = 'Failed to create task';
            }
            //console.error(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const updateTask = async (
        id: number,
        taskData: Partial<Task>
    ) => {
        loading.value = true;
        error.value = null;

        try {
            const updatedTask = await $fetch<Task>(`${config.public.apiBaseUrl}/api/tasks/${id}`, {
                method: 'PUT',
                body: taskData
            });
            const index = tasks.value.data.findIndex(task => task.id === id);
            if (index !== -1) tasks.value.data[index] = updatedTask.data;

            return updatedTask;
        } catch (err: any) {
            if (err.data && err.data.errors && err.data.errors.length > 0) {
                error.value = err.data.errors[0].message;
            }
            else {
                error.value = 'Failed to update task (2)';
                if(err.response && err.response._data && err.response._data.message) {
                    error.value = err.response._data.message;
                }
            }
            //console.error(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const deleteTask = async (id: number) => {
        loading.value = true;
        error.value = null;

        try {
            await $fetch(`${config.public.apiBaseUrl}/api/tasks/${id}`, { method: 'DELETE' });
            tasks.value.data = tasks.value.data.filter(task => task.id !== id);
        } catch (err) {
            error.value = 'Failed to delete task';
            console.error(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        tasks: readonly(tasks),
        loading: readonly(loading),
        error: readonly(error),
        fetchTasks,
        createTask,
        updateTask,
        deleteTask
    };
});
