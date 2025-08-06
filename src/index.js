
// Main entry point for the logger package

// Export all domain interfaces and entities
export * from './domain/index.js';

// Export application services and use cases
export * from './application/index.js';

// Export infrastructure implementations
export * from './infrastructure/index.js';

// Export presentation layer (decorators, middleware)
export * from './presentation/index.js';

// Export container configuration
export * from './container/index.js';

// Export types
export * from './types/index.js';

// Main logger initialization
import { ContainerConfig } from './container/ContainerConfig.js';
import { LoggerConfiguration } from './domain/entities/LoggerConfiguration.js';

/**
 * Initialize the logger with default configuration
 * @param {Object} options - Initialization options
 * @param {'file'|'environment'} [options.configProvider] - Configuration provider type
 * @param {string} [options.configPath] - Configuration file path
 * @param {string} [options.envPrefix] - Environment variable prefix
 * @param {LoggerConfiguration} [options.defaultConfig] - Default configuration
 * @returns {Object} Logger instance
 */
export function initializeLogger(options = {}) {
  ContainerConfig.configure(options);
  return ContainerConfig.getLogger();
}

/**
 * Create a logger with a specific name
 * @param {string} name - Logger name
 * @returns {Object} Logger instance
 */
export function createLogger(name) {
  const factory = ContainerConfig.getLoggerFactory();
  return factory.createLogger(name);
}

/**
 * Create a logger with specific configuration
 * @param {LoggerConfiguration} config - Logger configuration
 * @returns {Object} Logger instance
 */
export function createLoggerWithConfig(config) {
  const factory = ContainerConfig.getLoggerFactory();
  return factory.createLoggerWithConfig(config);
}

/**
 * Get an existing logger by name
 * @param {string} name - Logger name
 * @returns {Object|null} Logger instance or null
 */
export function getLogger(name) {
  const factory = ContainerConfig.getLoggerFactory();
  return factory.getLogger(name);
}

// Default exports for convenience
export { ContainerConfig as Logger } from './container/ContainerConfig.js';
export { LogLevel } from './domain/enums/LogLevel.js';
export { LoggerConfiguration } from './domain/entities/LoggerConfiguration.js';
export { LogEntry } from './domain/entities/LogEntry.js';
