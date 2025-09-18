const Joi = require('joi');
const { TaskStatus } = require('../models/Task');

// Task creation validation schema
const createTaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  status: Joi.string()
    .valid(...Object.values(TaskStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    }),
  
  dueDate: Joi.date()
    .iso()
    .min('now')
    .allow(null)
    .optional()
    .messages({
      'date.format': 'Due date must be a valid ISO 8601 date',
      'date.min': 'Due date cannot be in the past'
    })
});

// Task update validation schema
const updateTaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 255 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  status: Joi.string()
    .valid(...Object.values(TaskStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    }),
  
  dueDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .messages({
      'date.format': 'Due date must be a valid ISO 8601 date'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// UUID validation schema
const uuidSchema = Joi.string().uuid().required().messages({
  'string.guid': 'Invalid task ID format',
  'any.required': 'Task ID is required'
});

// Query parameters validation schema
const queryParamsSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(TaskStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    }),
  
  sortBy: Joi.string()
    .valid('created_at', 'updated_at', 'due_date', 'title', 'status')
    .optional()
    .default('created_at')
    .messages({
      'any.only': 'sortBy must be one of: created_at, updated_at, due_date, title, status'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
    .messages({
      'any.only': 'sortOrder must be either "asc" or "desc"'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.min': 'Page must be greater than 0',
      'number.integer': 'Page must be an integer'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.min': 'Limit must be greater than 0',
      'number.max': 'Limit cannot exceed 100',
      'number.integer': 'Limit must be an integer'
    })
});

// Validation middleware for task creation
const validateTask = (req, res, next) => {
  const { error, value } = createTaskSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body = value;
  next();
};

// Validation middleware for task update
const validateTaskUpdate = (req, res, next) => {
  // First validate the ID parameter
  const { error: idError } = uuidSchema.validate(req.params.id);
  if (idError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID format'
    });
  }

  // Then validate the request body
  const { error, value } = updateTaskSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body = value;
  next();
};

// Validation middleware for task ID parameter
const validateTaskId = (req, res, next) => {
  const { error } = uuidSchema.validate(req.params.id);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID format'
    });
  }

  next();
};

// Validation middleware for query parameters
const validateQueryParams = (req, res, next) => {
  const { error, value } = queryParamsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors
    });
  }

  // Replace query params with validated and converted values
  req.query = value;
  next();
};

// Helper function to create custom validation middleware
const createValidator = (schema, target = 'body') => {
  return (req, res, next) => {
    const dataToValidate = target === 'query' ? req.query : req[target];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: target === 'query'
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: `Validation failed for ${target}`,
        errors
      });
    }

    req[target] = value;
    next();
  };
};

// Export validation schemas for potential reuse
const schemas = {
  createTask: createTaskSchema,
  updateTask: updateTaskSchema,
  uuid: uuidSchema,
  queryParams: queryParamsSchema
};

module.exports = {
  validateTask,
  validateTaskUpdate,
  validateTaskId,
  validateQueryParams,
  createValidator,
  schemas
};