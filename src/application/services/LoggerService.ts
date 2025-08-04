import { injectable, inject } from 'tsyringe';
import { ILogger } from '../../domain/interfaces/ILogger';
import { ILoggerFactory } from '../../domain/interfaces/ILoggerFactory';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';
import { LogLevel } from '../../domain/enums/LogLevel';
import { LogMetadata, LogContext } from '../../domain/entities/LogEntry';

@injectable()
export class LoggerService implements ILogger {
  private readonly logger: ILogger;

  constructor(
    @inject('ILoggerFactory') private readonly loggerFactory: ILoggerFactory,
    @inject('LoggerConfiguration') private readonly config: LoggerConfiguration
  ) {
    this.logger = this.loggerFactory.createLoggerWithConfig(this.config);
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
      this.logger.error(message, metadataOrError, metadataOrContext as LogMetadata, context);
    } else {
      this.logger.error(message, metadataOrError, metadataOrContext as LogContext);
    }
  }

  warn(message: string, metadata?: LogMetadata, context?: LogContext): void {
    this.logger.warn(message, metadata, context);
  }

  info(message: string, metadata?: LogMetadata, context?: LogContext): void {
    this.logger.info(message, metadata, context);
  }

  http(message: string, metadata?: LogMetadata, context?: LogContext): void {
    this.logger.http(message, metadata, context);
  }

  verbose(message: string, metadata?: LogMetadata, context?: LogContext): void {
    this.logger.verbose(message, metadata, context);
  }

  debug(message: string, metadata?: LogMetadata, context?: LogContext): void {
    this.logger.debug(message, metadata, context);
  }

  silly(message: string, metadata?: LogMetadata, context?: LogContext): void {
    this.logger.silly(message, metadata, context);
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
      this.logger.log(level, message, metadataOrError, metadataOrContext as LogMetadata, context);
    } else {
      this.logger.log(level, message, metadataOrError, metadataOrContext as LogContext);
    }
  }

  logEntry(entry: any): void {
    this.logger.logEntry(entry);
  }

  child(context: LogContext): ILogger {
    return this.logger.child(context);
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.logger.isLevelEnabled(level);
  }

  async close(): Promise<void> {
    return this.logger.close();
  }
}