import { LogLevel } from '../enums/LogLevel.js';

/**
 * @typedef {Object} TransportConfiguration
 * @property {'console'|'file'|'http'|'mongodb'|'mysql'|'custom'} type - Transport type
 * @property {string} [level] - Log level for this transport
 * @property {string} [format] - Format for this transport
 * @property {Object} [options] - Transport-specific options
 */

/**
 * @typedef {Object} FormatterConfiguration
 * @property {'json'|'text'|'structured'|'custom'} type - Formatter type
 * @property {Object} [options] - Formatter-specific options
 */

export class LoggerConfiguration {
  /**
   * @param {Object} config - Configuration options
   * @param {string} [config.name] - Logger name
   * @param {string} [config.level] - Log level
   * @param {TransportConfiguration[]} [config.transports] - Transport configurations
   * @param {FormatterConfiguration} [config.format] - Formatter configuration
   * @param {boolean} [config.silent] - Silent mode
   * @param {boolean} [config.exitOnError] - Exit on error
   * @param {boolean} [config.handleExceptions] - Handle exceptions
   * @param {boolean} [config.handleRejections] - Handle rejections
   * @param {Object} [config.defaultMetadata] - Default metadata
   */
  constructor(config = {}) {
    this.name = config.name || 'default';
    this.level = config.level || LogLevel.INFO;
    this.transports = config.transports || [{ type: 'console' }];
    this.format = config.format || { type: 'json' };
    this.silent = config.silent || false;
    this.exitOnError = config.exitOnError || false;
    this.handleExceptions = config.handleExceptions || true;
    this.handleRejections = config.handleRejections || true;
    this.defaultMetadata = config.defaultMetadata || {};
  }

  static fromEnvironment() {
    return new LoggerConfiguration({
      level: process.env.LOG_LEVEL || LogLevel.INFO,
      silent: process.env.LOG_SILENT === 'true',
      name: process.env.LOG_NAME || 'app'
    });
  }
}