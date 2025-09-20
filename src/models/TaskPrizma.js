const { prisma } = require('../config/database');

const TaskStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
};

class TaskModel {

    static validateTitle(title) {
        if (!title || typeof title !== 'string') {
            throw new Error('Title is required and must be a string');
        }
        if (title.trim().length === 0) {
            throw new Error('Title cannot be empty');
        }
        if (title.length > 255) {
            throw new Error('Title must be between 1 and 255 characters');
        }
    }

    static validateDescription(description) {
        if (description !== null && description !== undefined) {
            if (typeof description !== 'string') {
                throw new Error('Description must be a string');
            }
            if (description.length > 2000) {
                throw new Error('Description cannot exceed 2000 characters');
            }
        }
    }

    static validateStatus(status) {
        if (!Object.values(TaskStatus).includes(status)) {
            throw new Error(`Status must be one of: ${Object.values(TaskStatus).join(', ')}`);
        }
    }

    static validateDueDate(dueDate, status = null) {
        if (dueDate) {
            const date = new Date(dueDate);
            if (isNaN(date.getTime())) {
                throw new Error('Due date must be a valid date');
            }
            if (status !== TaskStatus.COMPLETED && date < new Date()) {
                throw new Error('Due date cannot be in the past');
            }
        }
    }

    static async create(data) {
        const { title, description, status = TaskStatus.PENDING, dueDate } = data;

        // Validate data
        this.validateTitle(title);
        this.validateDescription(description);
        this.validateStatus(status);
        this.validateDueDate(dueDate, status);

        try {
            const task = await prisma.task.create({
                data: {
                    title: title.trim(),
                    description: description?.trim() || null,
                    status,
                    dueDate: dueDate ? new Date(dueDate) : null
                }
            });

            return this.formatTask(task);
        } catch (error) {
            throw new Error(`Failed to create task: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const task = await prisma.task.findUnique({
                where: { id }
            });

            return task ? this.formatTask(task) : null;
        } catch (error) {
            throw new Error(`Failed to find task: ${error.message}`);
        }
    }

    static async findAll(options = {}) {
        const { status, limit, offset, orderBy = 'createdAt', order = 'desc' } = options;

        try {
            const where = status ? { status } : {};

            const tasks = await prisma.task.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { [orderBy]: order }
            });

            return tasks.map(task => this.formatTask(task));
        } catch (error) {
            throw new Error(`Failed to fetch tasks: ${error.message}`);
        }
    }

    static async update(id, data) {
        const { title, description, status, dueDate } = data;

        // Validate data if provided
        if (title !== undefined) this.validateTitle(title);
        if (description !== undefined) this.validateDescription(description);
        if (status !== undefined) this.validateStatus(status);
        if (dueDate !== undefined) this.validateDueDate(dueDate, status);

        try {
            const updateData = {};
            if (title !== undefined) updateData.title = title.trim();
            if (description !== undefined) updateData.description = description?.trim() || null;
            if (status !== undefined) updateData.status = status;
            if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

            const task = await prisma.task.update({
                where: { id },
                data: updateData
            });

            return this.formatTask(task);
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Task not found');
            }
            throw new Error(`Failed to update task: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            await prisma.task.delete({
                where: { id }
            });
            return true;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Task not found');
            }
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    }

    static async count(options = {}) {
        const { status } = options;
        const where = status ? { status } : {};

        try {
            return await prisma.task.count({ where });
        } catch (error) {
            throw new Error(`Failed to count tasks: ${error.message}`);
        }
    }

    static formatTask(task) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString()
        };
    }

    static getValidStatuses() {
        return Object.values(TaskStatus);
    }

    static isValidStatus(status) {
        return Object.values(TaskStatus).includes(status);
    }
}

module.exports = { TaskModel, TaskStatus };