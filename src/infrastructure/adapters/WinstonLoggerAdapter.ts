import winston from 'winston';
import 'winston-mongodb';
import 'winston-mysql';
import { ILogger } from '../../domain/interfaces/ILogger';
import { LogLevel, LOG_LEVELS } from '../../domain/enums/LogLevel';
import { LogEntry, LogMetadata, LogContext } from '../../domain/entities/LogEntry';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';
import { CorrelationMiddleware } from '../../presentation/middleware/CorrelationMiddleware';

export class WinstonLoggerAdapter implements ILogger {
  private readonly winstonLogger: winston.Logger;
  private readonly defaultContext: LogContext;

  constructor(
    winstonLogger: winston.Logger,
    defaultContext: LogContext = {}
  ) {
    this.winstonLogger = winstonLogger;
    this.defaultContext = { ...defaultContext };
  }

  static fromConfiguration(config: LoggerConfiguration): WinstonLoggerAdapter {
    const transports: winston.transport[] = [];
    
    for (const transportConfig of config.transports) {
      switch (transportConfig.type) {
        case 'console':
          transports.push(new winston.transports.Console({
            level: transportConfig.level || config.level,
            ...transportConfig.options
          }));
          break;
        case 'file':
          transports.push(new winston.transports.File({
            level: transportConfig.level || config.level,
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
          transports.push(new (winston.transports as any).MongoDB({
            level: transportConfig.level || config.level,
            db: transportConfig.options?.connectionString || 'mongodb://localhost:27017/logs',
            collection: transportConfig.options?.collection || 'logs',
            ...transportConfig.options
          }));
          break;
        case 'mysql':
          transports.push(new (winston.transports as any).MySQL({
            level: transportConfig.level || config.level,
            host: transportConfig.options?.host || 'localhost',
            user: transportConfig.options?.user || 'root',
            password: transportConfig.options?.password || '',
            database: transportConfig.options?.database || 'logs',
            table: transportConfig.options?.table || 'logs',
            ...transportConfig.options
          }));
          break;
      }
    }

    const winstonLogger = winston.createLogger({
      level: config.level,
      levels: LOG_LEVELS,
      transports,
      silent: config.silent,
      exitOnError: config.exitOnError,
      handleExceptions: config.handleExceptions,
      handleRejections: config.handleRejections,
      defaultMeta: config.defaultMetadata
    });

    return new WinstonLoggerAdapter(winstonLogger);
  }

  error(message: string, metadata?: LogMetadata, context?: LogContext): void;
  error(message: string, error: Error, metadata?: LogMetadata, context?: LogContext): void;
  error(
    message: string,
    metadataOrError?: LogMetadata | Error,
    metadataOrContext?: LogMetadata | LogContext,
    context?: LogContext
  ): void {
    if (metadataOrError instanceof Error) {
      const logData = this.buildLogData(metadataOrContext as LogMetadata, context, metadataOrError);
      this.winstonLogger.error(message, logData);
    } else {
      const logData = this.buildLogData(metadataOrError, metadataOrContext as LogContext);
      this.winstonLogger.error(message, logData);
    }
  }

  warn(message: string, metadata?: LogMetadata, context?: LogContext): void {
    const logData = this.buildLogData(metadata, context);
    this.winstonLogger.warn(message, logData);
  }

  info(message: string, metadata?: LogMetadata, context?: LogContext): void {
    const logData = this.buildLogData(metadata, context);
    this.winstonLogger.info(message, logData);
  }

  http(message: string, metadata?: LogMetadata, context?: LogContext): void {
    const logData = this.buildLogData(metadata, context);
    this.winstonLogger.http(message, logData);
  }

  verbose(message: string, metadata?: LogMetadata, context?: LogContext): void {
    const logData = this.buildLogData(metadata, context);
    this.winstonLogger.verbose(message, logData);
  }

  debug(message: string, metadata?: LogMetadata, context?: LogContext): void {
    const logData = this.buildLogData(metadata, context);
    this.winstonLogger.debug(message, logData);
  }

  silly(message: string, metadata?: LogMetadata, context?: LogContext): void {
    const logData = this.buildLogData(metadata, context);
    this.winstonLogger.silly(message, logData);
  }

  log(level: LogLevel, message: string, metadata?: LogMetadata, context?: LogContext): void;
  log(level: LogLevel, message: string, error: Error, metadata?: LogMetadata, context?: LogContext): void;
  log(
    level: LogLevel,
    message: string,
    metadataOrError?: LogMetadata | Error,
    metadataOrContext?: LogMetadata | LogContext,
    context?: LogContext
  ): void {
    if (metadataOrError instanceof Error) {
      const logData = this.buildLogData(metadataOrContext as LogMetadata, context, metadataOrError);
      this.winstonLogger.log(level, message, logData);
    } else {
      const logData = this.buildLogData(metadataOrError, metadataOrContext as LogContext);
      this.winstonLogger.log(level, message, logData);
    }
  }

  logEntry(entry: LogEntry): void {
    const logData = this.buildLogData(entry.metadata, entry.context, entry.error);
    this.winstonLogger.log(entry.level, entry.message, logData);
  }

  child(context: LogContext): ILogger {
    const mergedContext = { ...this.defaultContext, ...context };
    return new WinstonLoggerAdapter(this.winstonLogger, mergedContext);
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.winstonLogger.isLevelEnabled(level);
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.winstonLogger.close();
      resolve();
    });
  }

  private buildLogData(
    metadata: LogMetadata = {},
    context: LogContext = {},
    error?: Error
  ): Record<string, any> {
    // Automatically include correlation context if available
    const correlationContext = CorrelationMiddleware.getContext();
    const enrichedContext = {
      ...this.defaultContext,
      ...context
    };

    // Add correlation data if available
    if (correlationContext) {
      enrichedContext.correlationId = correlationContext.correlationId;
      enrichedContext.requestId = correlationContext.requestId;
      enrichedContext.userId = correlationContext.userId;
      enrichedContext.sessionId = correlationContext.sessionId;
      
      // Add correlation metadata
      Object.assign(metadata, correlationContext.metadata);
    }

    const logData: Record<string, any> = {
      ...metadata,
      context: enrichedContext
    };

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