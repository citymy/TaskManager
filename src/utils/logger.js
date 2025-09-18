const winston = require('winston');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format: logFormat,
  transports: [

    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],

  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

const fs = require('fs');
const path = require('path');
const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;