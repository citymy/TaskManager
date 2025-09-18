const { Task, TaskStatus } = require('../models/Task');
const { Op } = require('sequelize');
const { getCache, setCache, clearCachePattern } = require('../config/redis');
const logger = require('../utils/logger');

//generate cache key
const generateCacheKey = (status, sortBy, sortOrder, page = 1, limit = 10) => {
  return `tasks:${status || 'all'}:${sortBy || 'created_at'}:${sortOrder || 'desc'}:${page}:${limit}`;
};

//clear task cache
const clearTaskCache = async () => {
  try {
    await clearCachePattern('tasks:*');
  } catch (error) {
    logger.error('Failed to clear task cache:', error);
  }
};

/**
 * Create a new task  */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status: status || TaskStatus.PENDING,
      due_date: dueDate
    });

    await clearTaskCache();

    logger.info(`Task created: ${task.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all tasks with filtering and sorting */
const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Validate parameters
    const validSortFields = ['created_at', 'updated_at', 'due_date', 'title', 'status'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`
      });
    }

    if (!validSortOrders.includes(sortOrder.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order. Must be "asc" or "desc"'
      });
    }

    if (status && !Task.isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Task.getValidStatuses().join(', ')}`
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 100); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    const cacheKey = generateCacheKey(status, sortBy, sortOrder, pageNum, limitNum);

    let cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      logger.info(`Cache hit for key: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedResult.tasks,
        pagination: cachedResult.pagination,
        cached: true
      });
    }

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limitNum,
      offset: offset
    });

    // Prepare pagination info
    const totalPages = Math.ceil(count / limitNum);
    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalItems: count,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
      hello: 11
    };

    const result = { tasks, pagination };

    // Cache the result for 5 minutes
    await setCache(cacheKey, result, 300);

    logger.info(`Tasks retrieved: ${tasks.length} items, page ${pageNum}`);

    res.json({
      success: true,
      data: tasks,
      pagination,
      cached: false
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get a single task by ID  */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
};

/***
 * Update a task
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    console.log(123, id);

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields if provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.due_date = dueDate;

    console.log(333, updateData);
    await task.update(updateData);

    // Clear cache when task is updated
    await clearTaskCache();

    logger.info(`Task updated: ${task.id}`);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });

  } catch (error) {
    next(error);
  }
};

/****
 * Delete a task
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    await clearTaskCache();

    logger.info(`Task deleted: ${id}`);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get task statistics  */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const total = await Task.count();

    const formattedStats = {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {}),
      overdue: 0
    };

    // Get overdue tasks count
    const overdueCount = await Task.count({
      where: {
        due_date: {
          [Op.lt]: new Date()
        },
        status: {
          [Op.ne]: TaskStatus.COMPLETED
        }
      }
    });

    formattedStats.overdue = overdueCount;

    res.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats
};