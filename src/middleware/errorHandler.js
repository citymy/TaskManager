const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`Error ${err.message}`, err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'Duplicate entry'
    });
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
      error: 'Foreign key constraint failed'
    });
  }

  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: 'Service temporarily unavailable'
    });
  }

  // JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'Malformed request body'
    });
  }

  // Request entity too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      error: 'Payload exceeds size limit'
    });
  }

  // Cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format',
      error: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
};

module.exports = errorHandler;