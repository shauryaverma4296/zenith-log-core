import { LogLevel } from '../domain/enums/LogLevel.js';

/**
 * Type guard for LogLevel
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a valid LogLevel
 */
export function isLogLevel(value) {
  return Object.values(LogLevel).includes(value);
}

/**
 * Type guard for LogMetadata
 * @param {*} value - Value to check
 * @returns {boolean} True if value is valid LogMetadata
 */
export function isLogMetadata(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for LogContext
 * @param {*} value - Value to check
 * @returns {boolean} True if value is valid LogContext
 */
export function isLogContext(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @typedef {Function} LogMethod
 * @param {string} message - Log message
 * @param {Object} [metadata] - Log metadata
 * @param {Object} [context] - Log context
 */

/**
 * @typedef {Function} LogMethodWithError
 * @param {string} message - Log message
 * @param {Error} error - Error object
 * @param {Object} [metadata] - Log metadata
 * @param {Object} [context] - Log context
 */

/**
 * @typedef {Function} GenericLogMethod
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [metadata] - Log metadata
 * @param {Object} [context] - Log context
 */

/**
 * @typedef {Object} LoggerModuleOptions
 * @property {'file'|'environment'} [configProvider] - Configuration provider type
 * @property {string} [configPath] - Configuration file path
 * @property {string} [envPrefix] - Environment variable prefix
 * @property {boolean} [isGlobal] - Whether logger is global
 * @property {boolean} [autoConfiguration] - Whether to auto-configure
 */

/**
 * Logger error class
 */
export class LoggerError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} [code] - Error code
   */
  constructor(message, code) {
    super(message);
    this.name = 'LoggerError';
    this.code = code;
  }
}

/**
 * Configuration error class
 */
export class ConfigurationError extends LoggerError {
  /**
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Transport error class
 */
export class TransportError extends LoggerError {
  /**
   * @param {string} message - Error message
   * @param {string} transportType - Transport type
   */
  constructor(message, transportType) {
    super(message, 'TRANSPORT_ERROR');
    this.name = 'TransportError';
    this.transportType = transportType;
  }
}

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} duration - Duration in milliseconds
 * @property {Object} [memoryUsage] - Memory usage statistics
 * @property {Object} [cpuUsage] - CPU usage statistics
 */

/**
 * @typedef {Object} TimingContext
 * @property {number} startTime - Start time timestamp
 * @property {Object} [startCpuUsage] - Start CPU usage
 * @property {Object} [startMemoryUsage] - Start memory usage
 */

/**
 * @typedef {Object} StructuredLogData
 * @property {string} @timestamp - Timestamp in ISO format
 * @property {string} @version - Log format version
 * @property {string} message - Log message
 * @property {string} level - Log level
 * @property {Object} service - Service information
 * @property {Object} [labels] - Log labels/metadata
 * @property {Object} [context] - Log context
 * @property {Object} [error] - Error information
 * @property {Object} [trace] - Trace information
 * @property {Object} [user] - User information
 * @property {Object} [performance] - Performance metrics
 */

/**
 * @typedef {Object} AsyncLogEntry
 * @property {string} level - Log level
 * @property {string} message - Log message
 * @property {Object} [metadata] - Log metadata
 * @property {Object} [context] - Log context
 * @property {Error} [error] - Error object
 * @property {Date} timestamp - Log timestamp
 */

/**
 * @typedef {Object} BatchLogOptions
 * @property {number} batchSize - Batch size for log entries
 * @property {number} flushInterval - Flush interval in milliseconds
 * @property {number} maxRetries - Maximum retry attempts
 * @property {number} retryDelay - Retry delay in milliseconds
 */