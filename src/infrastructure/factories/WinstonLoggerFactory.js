
import { WinstonLoggerAdapter } from '../adapters/WinstonLoggerAdapter.js';

/**
 * Winston logger factory implementation
 */
export class WinstonLoggerFactory {
  /**
   * @param {Object} configProvider - Configuration provider
   */
  constructor(configProvider) {
    this.configProvider = configProvider;
    this.loggers = new Map();
  }

  /**
   * Create logger by name
   * @param {string} name - Logger name
   * @returns {Object} Logger instance
   */
  createLogger(name = 'default') {
    if (this.loggers.has(name)) {
      return this.loggers.get(name);
    }

    const config = this.configProvider.getConfigurationSync(name);
    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    
    this.loggers.set(name, logger);
    return logger;
  }

  /**
   * Create logger with specific configuration
   * @param {Object} config - Logger configuration
   * @returns {Object} Logger instance
   */
  createLoggerWithConfig(config) {
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
   * Create logger asynchronously
   * @param {string} name - Logger name
   * @returns {Promise<Object>} Logger instance
   */
  async createLoggerAsync(name = 'default') {
    if (this.loggers.has(name)) {
      return this.loggers.get(name);
    }

    const config = await this.configProvider.getConfiguration(name);
    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    
    this.loggers.set(name, logger);
    return logger;
  }

  /**
   * Get existing logger
   * @param {string} name - Logger name
   * @returns {Object|null} Logger instance or null
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
   * Remove logger
   * @param {string} name - Logger name
   * @returns {boolean} True if logger was removed
   */
  removeLogger(name) {
    const logger = this.loggers.get(name);
    if (logger) {
      logger.close().catch(console.error);
      return this.loggers.delete(name);
    }
    return false;
  }

  /**
   * Clear all loggers
   */
  clearLoggers() {
    for (const [name, logger] of this.loggers) {
      logger.close().catch(console.error);
    }
    this.loggers.clear();
  }
}
