import { injectable, inject } from 'tsyringe';
import { LogEntry } from '../../domain/entities/LogEntry.js';

/**
 * Logger service implementation
 */
@injectable()
export class LoggerService {
  /**
   * @param {Object} loggerFactory - Logger factory
   * @param {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} config - Logger configuration
   */
  constructor(
    @inject('ILoggerFactory') loggerFactory,
    @inject('LoggerConfiguration') config
  ) {
    this.logger = loggerFactory.createLoggerWithConfig(config);
  }

  error(message, errorOrMetadata, metadataOrContext, context) {
    if (arguments[1] instanceof Error) {
      this.logger.error(message, arguments[1], metadataOrContext, context);
    } else {
      this.logger.error(message, errorOrMetadata, metadataOrContext);
    }
  }

  warn(message, metadata, context) {
    this.logger.warn(message, metadata, context);
  }

  info(message, metadata, context) {
    this.logger.info(message, metadata, context);
  }

  http(message, metadata, context) {
    this.logger.http(message, metadata, context);
  }

  verbose(message, metadata, context) {
    this.logger.verbose(message, metadata, context);
  }

  debug(message, metadata, context) {
    this.logger.debug(message, metadata, context);
  }

  silly(message, metadata, context) {
    this.logger.silly(message, metadata, context);
  }

  log(levelOrMessage, messageOrMetadata, metadataOrContext, contextOrError, error) {
    if (arguments[1] instanceof Error) {
      this.logger.log(levelOrMessage, messageOrMetadata, arguments[1], metadataOrContext, contextOrError);
    } else {
      this.logger.log(levelOrMessage, messageOrMetadata, metadataOrContext, contextOrError, error);
    }
  }

  /**
   * Log entry directly
   * @param {LogEntry|Object} entry - Log entry
   */
  logEntry(entry) {
    this.logger.logEntry(entry);
  }

  /**
   * Create child logger with context
   * @param {Object} context - Log context
   * @returns {Object} Child logger
   */
  child(context) {
    return this.logger.child(context);
  }

  /**
   * Check if level is enabled
   * @param {string} level - Log level
   * @returns {boolean} True if level is enabled
   */
  isLevelEnabled(level) {
    return this.logger.isLevelEnabled(level);
  }

  /**
   * Close logger
   * @returns {Promise<void>}
   */
  async close() {
    return this.logger.close();
  }
}