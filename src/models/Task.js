const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Task status enum
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title cannot be empty'
      },
      len: {
        args: [1, 255],
        msg: 'Title must be between 1 and 255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Description cannot exceed 2000 characters'
      }
    }
  },
  status: {
    type: DataTypes.ENUM(Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.PENDING,
    validate: {
      isIn: {
        args: [Object.values(TaskStatus)],
        msg: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
      }
    }
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Due date must be a valid date'
      }
    }
  }
}, {
  tableName: 'tasks',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    // Validation due_date
    beforeCreate: (task) => {
      if (task.due_date && new Date(task.due_date) < new Date()) {
        throw new Error('Due date cannot be in the past');
      }
    },
    beforeUpdate: (task) => {
      if (task.changed('due_date') && 
          task.due_date && 
          task.status !== TaskStatus.COMPLETED &&
          new Date(task.due_date) < new Date()) {
        throw new Error('Due date cannot be in the past');
      }
    }
  }
});

// Instance methods
Task.prototype.toJSON = function() {
  const values = { ...this.get() };

  if (values.due_date) {
    values.due_date = values.due_date.toISOString();
  }
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  if (values.updated_at) {
    values.updated_at = values.updated_at.toISOString();
  }
  
  return values;
};

// Class methods
Task.getValidStatuses = () => Object.values(TaskStatus);

Task.isValidStatus = (status) => Object.values(TaskStatus).includes(status);

module.exports = { Task, TaskStatus };