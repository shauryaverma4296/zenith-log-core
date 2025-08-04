// Main entry point for the logger package
import 'reflect-metadata';

// Export all domain interfaces and entities
export * from './domain';

// Export application services and use cases
export * from './application';

// Export infrastructure implementations
export * from './infrastructure';

// Export presentation layer (decorators, middleware)
export * from './presentation';

// Export container configuration
export * from './container';

// Export types
export * from './types';

// Main logger initialization
import { ContainerConfig } from './container/ContainerConfig';
import { ILogger } from './domain/interfaces/ILogger';
import { LoggerConfiguration } from './domain/entities/LoggerConfiguration';

/**
 * Initialize the logger with default configuration
 */
export function initializeLogger(options: {
  configProvider?: 'file' | 'environment';
  configPath?: string;
  envPrefix?: string;
  defaultConfig?: LoggerConfiguration;
} = {}): ILogger {
  ContainerConfig.configure(options);
  return ContainerConfig.getLogger();
}

/**
 * Create a logger with a specific name
 */
export function createLogger(name: string): ILogger {
  const factory = ContainerConfig.getLoggerFactory();
  return factory.createLogger(name);
}

/**
 * Create a logger with specific configuration
 */
export function createLoggerWithConfig(config: LoggerConfiguration): ILogger {
  const factory = ContainerConfig.getLoggerFactory();
  return factory.createLoggerWithConfig(config);
}

/**
 * Get an existing logger by name
 */
export function getLogger(name: string): ILogger | null {
  const factory = ContainerConfig.getLoggerFactory();
  return factory.getLogger(name);
}

// Default exports for convenience
export { ContainerConfig as Logger } from './container/ContainerConfig';
export { LogLevel } from './domain/enums/LogLevel';
export { LoggerConfiguration } from './domain/entities/LoggerConfiguration';
export { LogEntry } from './domain/entities/LogEntry';
export type { LogMetadata, LogContext } from './domain/entities/LogEntry';