// Logger Utility - Winston-based logging for CodeAnalyst Backend
import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs')

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

winston.addColors(logColors)

// Create custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`
    }
    
    return msg
  })
)

// Create custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat
  })
]

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  )
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  transports,
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
  
  // Exit on handled exceptions
  exitOnError: false
})

// Create a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim())
  }
}

// Add helper methods for structured logging
logger.logAnalysis = (type, data) => {
  logger.info(`Analysis ${type}`, {
    type,
    analysisId: data.analysisId,
    userId: data.userId,
    url: data.url || data.source,
    duration: data.duration,
    status: data.status
  })
}

logger.logError = (operation, error, context = {}) => {
  logger.error(`${operation} failed`, {
    operation,
    error: error.message,
    stack: error.stack,
    ...context
  })
}

logger.logPerformance = (operation, duration, context = {}) => {
  logger.debug(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...context
  })
}

logger.logAI = (provider, model, tokens, duration, context = {}) => {
  logger.info(`AI Request: ${provider}/${model}`, {
    provider,
    model,
    tokens,
    duration: `${duration}ms`,
    ...context
  })
}

logger.logDatabase = (operation, table, duration, context = {}) => {
  logger.debug(`DB: ${operation} on ${table}`, {
    operation,
    table,
    duration: `${duration}ms`,
    ...context
  })
}

// Development logging helpers
if (process.env.NODE_ENV === 'development') {
  logger.dev = (message, data) => {
    logger.debug(`[DEV] ${message}`, data)
  }
  
  logger.trace = (message, data) => {
    logger.debug(`[TRACE] ${message}`, data)
  }
} else {
  // No-op in production
  logger.dev = () => {}
  logger.trace = () => {}
}

export { logger }
export default logger 