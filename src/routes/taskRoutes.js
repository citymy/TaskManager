const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');
const { validateTask, validateTaskUpdate } = require('../middleware/validation');

const router = express.Router();

router.get('/stats', getTaskStats);

// CRUD operations
router.post('/', validateTask, createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', validateTaskUpdate, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;