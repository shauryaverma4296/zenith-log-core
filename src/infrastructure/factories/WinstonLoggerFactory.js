import { injectable } from 'tsyringe';
import { WinstonLoggerAdapter } from '../adapters/WinstonLoggerAdapter.js';

/**
 * Winston logger factory implementation
 */
@injectable()
export class WinstonLoggerFactory {
  constructor() {
    /** @type {Map<string, import('../../domain/interfaces/ILogger.js').ILogger>} */
    this.loggers = new Map();
  }

  /**
   * Create logger with optional name
   * @param {string} [name] - Logger name
   * @returns {import('../../domain/interfaces/ILogger.js').ILogger} Logger instance
   */
  createLogger(name) {
    if (name && this.loggers.has(name)) {
      return this.loggers.get(name);
    }

    const logger = new WinstonLoggerAdapter();
    if (name) {
      this.loggers.set(name, logger);
    }
    return logger;
  }

  /**
   * Create logger with configuration
   * @param {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} config - Logger configuration
   * @returns {import('../../domain/interfaces/ILogger.js').ILogger} Logger instance
   */
  createLoggerWithConfig(config) {
    // Create a unique key for this configuration to allow multiple configs with same name
    const configKey = `${config.name}_${JSON.stringify({
      level: config.level,
      transports: config.transports,
      format: config.format,
      silent: config.silent
    })}`;
    
    const existingLogger = this.loggers.get(configKey);
    if (existingLogger) {
      return existingLogger;
    }

    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    this.loggers.set(configKey, logger);
    return logger;
  }

  /**
   * Get existing logger by name
   * @param {string} name - Logger name
   * @returns {import('../../domain/interfaces/ILogger.js').ILogger|null} Logger instance or null
   */
  getLogger(name) {
    return this.loggers.get(name) || null;
  }

  /**
   * Check if logger exists
   * @param {string} name - Logger name
   * @returns {boolean} True if logger exists
   */
  hasLogger(name) {
    return this.loggers.has(name);
  }

  /**
   * Remove logger by name
   * @param {string} name - Logger name
   * @returns {boolean} True if logger was removed
   */
  removeLogger(name) {
    return this.loggers.delete(name);
  }

  /**
   * Clear all loggers
   */
  clearLoggers() {
    this.loggers.clear();
  }
}