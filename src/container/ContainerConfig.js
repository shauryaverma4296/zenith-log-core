import 'reflect-metadata';
import { container } from 'tsyringe';

import { FileConfigurationAdapter } from '../infrastructure/adapters/FileConfigurationAdapter.js';
import { EnvironmentConfigurationAdapter } from '../infrastructure/adapters/EnvironmentConfigurationAdapter.js';
import { ConfigurationProviderFactory } from '../infrastructure/factories/ConfigurationProviderFactory.js';
import { WinstonLoggerFactory } from '../infrastructure/factories/WinstonLoggerFactory.js';

import { ConfigurationService } from '../application/services/ConfigurationService.js';
import { LoggerService } from '../application/services/LoggerService.js';
import { CreateLoggerUseCase } from '../application/use-cases/CreateLoggerUseCase.js';
import { ConfigureLoggerUseCase } from '../application/use-cases/ConfigureLoggerUseCase.js';
import { TraceCorrelationUseCase } from '../application/use-cases/TraceCorrelationUseCase.js';

import { LoggerConfiguration } from '../domain/entities/LoggerConfiguration.js';

/**
 * Container configuration for dependency injection
 */
export class ContainerConfig {
  /**
   * Configure the dependency injection container
   * @param {Object} options - Configuration options
   * @param {'file'|'environment'} [options.configProvider] - Configuration provider type
   * @param {string} [options.configPath] - Configuration file path
   * @param {string} [options.envPrefix] - Environment variable prefix
   */
  static configure(options = {}) {
    // Register configuration adapters
    container.registerSingleton('FileConfigurationAdapter', FileConfigurationAdapter);
    container.registerSingleton('EnvironmentConfigurationAdapter', EnvironmentConfigurationAdapter);
    container.registerSingleton(ConfigurationProviderFactory);

    // Create and register configuration provider
    const configFactory = container.resolve(ConfigurationProviderFactory);
    const configProvider = configFactory.create({
      configProvider: options.configProvider || 'environment',
      configPath: options.configPath,
      envPrefix: options.envPrefix
    });
    container.registerInstance('IConfigurationProvider', configProvider);

    // Register default logger configuration
    const defaultConfig = LoggerConfiguration.fromEnvironment();
    container.registerInstance('LoggerConfiguration', defaultConfig);

    // Register logger factory
    container.registerSingleton('ILoggerFactory', WinstonLoggerFactory);

    // Register application services
    container.registerSingleton(ConfigurationService);
    container.registerSingleton(LoggerService);

    // Register use cases
    container.registerSingleton(CreateLoggerUseCase);
    container.registerSingleton(ConfigureLoggerUseCase);
    container.registerSingleton(TraceCorrelationUseCase);

    // Register main logger interface
    container.register('ILogger', { useClass: LoggerService });
  }

  /**
   * Get logger instance
   * @param {string} [name] - Logger name
   * @returns {Object} Logger instance
   */
  static getLogger(name) {
    if (name) {
      const factory = container.resolve('ILoggerFactory');
      return factory.createLogger(name);
    }
    return container.resolve('ILogger');
  }

  /**
   * Get logger factory
   * @returns {Object} Logger factory instance
   */
  static getLoggerFactory() {
    return container.resolve('ILoggerFactory');
  }

  /**
   * Get configuration service
   * @returns {ConfigurationService} Configuration service instance
   */
  static getConfigurationService() {
    return container.resolve(ConfigurationService);
  }

  /**
   * Get create logger use case
   * @returns {CreateLoggerUseCase} Create logger use case instance
   */
  static createLoggerUseCase() {
    return container.resolve(CreateLoggerUseCase);
  }

  /**
   * Get configure logger use case
   * @returns {ConfigureLoggerUseCase} Configure logger use case instance
   */
  static configureLoggerUseCase() {
    return container.resolve(ConfigureLoggerUseCase);
  }

  /**
   * Get trace correlation use case
   * @returns {TraceCorrelationUseCase} Trace correlation use case instance
   */
  static traceCorrelationUseCase() {
    return container.resolve(TraceCorrelationUseCase);
  }

  /**
   * Reset container
   */
  static reset() {
    container.clearInstances();
  }
}