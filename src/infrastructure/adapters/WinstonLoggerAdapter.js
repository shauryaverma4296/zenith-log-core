import winston from 'winston';
import { LogEntry } from '../../domain/entities/LogEntry.js';
import { CorrelationMiddleware } from '../../presentation/middleware/CorrelationMiddleware.js';

/**
 * Winston logger adapter implementation
 */
export class WinstonLoggerAdapter {
  /**
   * @param {winston.Logger} winstonLogger - Winston logger instance
   * @param {Object} defaultContext - Default context for all logs
   */
  constructor(winstonLogger, defaultContext = {}) {
    this.winston = winstonLogger;
    this.defaultContext = defaultContext;
  }

  /**
   * Create logger from configuration
   * @param {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} config - Logger configuration
   * @returns {WinstonLoggerAdapter} Logger instance
   */
  static fromConfiguration(config) {
    const transports = [];

    // Configure transports based on configuration
    for (const transportConfig of config.transports) {
      switch (transportConfig.type) {
        case 'console':
          transports.push(new winston.transports.Console({
            level: transportConfig.level || config.level,
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
            ...transportConfig.options
          }));
          break;

        case 'file':
          transports.push(new winston.transports.File({
            level: transportConfig.level || config.level,
            filename: transportConfig.options?.filename || 'app.log',
            format: winston.format.json(),
            ...transportConfig.options
          }));
          break;

        case 'http':
          transports.push(new winston.transports.Http({
            level: transportConfig.level || config.level,
            ...transportConfig.options
          }));
          break;

        case 'mongodb':
          // Requires winston-mongodb package
          try {
            const MongoDB = require('winston-mongodb').MongoDB;
            transports.push(new MongoDB({
              level: transportConfig.level || config.level,
              db: transportConfig.options?.connectionString || 'mongodb://localhost:27017/logs',
              collection: transportConfig.options?.collection || 'logs',
              format: winston.format.json(),
              ...transportConfig.options
            }));
          } catch (error) {
            console.warn('MongoDB transport not available:', error.message);
          }
          break;

        case 'mysql':
          // Requires winston-mysql package
          try {
            const MySQL = require('winston-mysql');
            transports.push(new MySQL({
              level: transportConfig.level || config.level,
              ...transportConfig.options
            }));
          } catch (error) {
            console.warn('MySQL transport not available:', error.message);
          }
          break;
      }
    }

    const winstonLogger = winston.createLogger({
      level: config.level,
      levels: winston.config.npm.levels,
      format: winston.format.json(),
      defaultMeta: config.defaultMetadata,
      transports,
      silent: config.silent,
      exitOnError: config.exitOnError,
      handleExceptions: config.handleExceptions,
      handleRejections: config.handleRejections
    });

    return new WinstonLoggerAdapter(winstonLogger);
  }

  error(message, errorOrMetadata, metadataOrContext, context) {
    if (errorOrMetadata instanceof Error) {
      this.log('error', message, metadataOrContext, context, errorOrMetadata);
    } else {
      this.log('error', message, errorOrMetadata, metadataOrContext);
    }
  }

  warn(message, metadata, context) {
    this.log('warn', message, metadata, context);
  }

  info(message, metadata, context) {
    this.log('info', message, metadata, context);
  }

  http(message, metadata, context) {
    this.log('http', message, metadata, context);
  }

  verbose(message, metadata, context) {
    this.log('verbose', message, metadata, context);
  }

  debug(message, metadata, context) {
    this.log('debug', message, metadata, context);
  }

  silly(message, metadata, context) {
    this.log('silly', message, metadata, context);
  }

  log(levelOrMessage, messageOrMetadata, metadataOrContext, contextOrError, error) {
    let level, message, metadata = {}, context = {};

    if (typeof levelOrMessage === 'string' && typeof messageOrMetadata === 'string') {
      // log(level, message, metadata?, context?, error?)
      level = levelOrMessage;
      message = messageOrMetadata;
      metadata = metadataOrContext || {};
      context = contextOrError || {};
      if (error instanceof Error) {
        // error parameter provided
      } else if (contextOrError instanceof Error) {
        // error in context position
        error = contextOrError;
        context = {};
      }
    } else {
      // Fallback for other signatures
      level = levelOrMessage;
      message = messageOrMetadata;
      metadata = metadataOrContext || {};
      context = contextOrError || {};
    }

    const logData = this.buildLogData(metadata, context, error);
    this.winston.log(level, message, logData);
  }

  logEntry(entry) {
    const logData = this.buildLogData(entry.metadata, entry.context, entry.error);
    this.winston.log(entry.level, entry.message, logData);
  }

  child(context) {
    const extendedContext = { ...this.defaultContext, ...context };
    return new WinstonLoggerAdapter(this.winston, extendedContext);
  }

  isLevelEnabled(level) {
    return this.winston.isLevelEnabled(level);
  }

  async close() {
    return new Promise((resolve) => {
      this.winston.close(resolve);
    });
  }

  /**
   * Build log data with correlation context
   * @private
   */
  buildLogData(metadata = {}, context = {}, error) {
    const logData = {
      ...metadata,
      ...this.defaultContext,
      ...context
    };

    // Add correlation context if available
    try {
      const correlationContext = CorrelationMiddleware.getContext();
      if (correlationContext) {
        if (correlationContext.correlationId) {
          logData.correlationId = correlationContext.correlationId;
        }
        if (correlationContext.requestId) {
          logData.requestId = correlationContext.requestId;
        }
        if (correlationContext.metadata) {
          Object.assign(logData, correlationContext.metadata);
        }
      }
    } catch (err) {
      // Ignore correlation context errors
    }

    // Add error information
    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return logData;
  }
}