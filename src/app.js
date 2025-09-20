require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./config/database');
//prizma const { prisma } = require('./config/database_prizma');
const { initRedis } = require('./config/redis');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT_API || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.API_BASE_URL, process.env.FRONT_BASE_URL],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Task Manager API'
  });
});

// API routes
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});


app.use(errorHandler);
/*process.on('beforeExit', async () => {
  await prisma.$disconnect();
});*/

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established successfully');

    await sequelize.sync();
    logger.info('Database synchronized');

    await initRedis();
    logger.info('Redis connection established successfully');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;