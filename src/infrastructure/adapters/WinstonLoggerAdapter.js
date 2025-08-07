const winston = require('winston');
const { CorrelationMiddleware } = require('../../presentation/middleware/CorrelationMiddleware.js');

class WinstonLoggerAdapter {
  constructor(winstonLogger, defaultContext = {}) {
    this.winston = winstonLogger;
    this.defaultContext = defaultContext;
  }

  static fromConfiguration(config) {
    const transports = [];

    for (const transportConfig of config.transports) {
      switch (transportConfig.type) {
        case 'console':
          transports.push(
            new winston.transports.Console({
              level: transportConfig.level || config.level,
              format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
              ...transportConfig.options,
            })
          );
          break;

        case 'mongodb':
          try {
            const MongoDB = require('winston-mongodb').MongoDB;
            transports.push(
              new MongoDB({
                level: transportConfig.level || config.level,
                db: transportConfig.options?.connectionString || 'mongodb://localhost:27017/logs',
                collection: transportConfig.options?.collection || 'logs',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                  winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const logEntry = {
                      timestamp,
                      level,
                      message,
                      event: meta.event || 'general',
                      correlationId: meta.correlationId || null,
                      tibicoTransactionId: meta.correlationId || null,
                      ...meta,
                    };
                    return JSON.stringify(logEntry);
                  })
                ),
                ...transportConfig.options,
              })
            );
          } catch (error) {
            console.warn('MongoDB transport not available:', error.message);
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
      handleRejections: config.handleRejections,
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
    let level,
      message,
      metadata = {},
      context = {};

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

  async close() {
    return new Promise(resolve => {
      this.winston.close(resolve);
    });
  }

  buildLogData(metadata = {}, context = {}, error) {
    const logData = {
      ...metadata,
      ...this.defaultContext,
      ...context,
    };

    // Add event field if not present
    if (!logData.event) {
      logData.event = 'general';
    }

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
        stack: error.stack,
      };
    }

    return logData;
  }
}

module.exports = { WinstonLoggerAdapter };
