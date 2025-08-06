
import { container } from './SimpleContainer.js';

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
    // Clear existing registrations
    container.clear();

    // Register configuration adapters as singletons
    container.registerFactory('FileConfigurationAdapter', () => new FileConfigurationAdapter(), true);
    container.registerFactory('EnvironmentConfigurationAdapter', () => new EnvironmentConfigurationAdapter(), true);

    // Register configuration provider factory
    container.registerFactory('ConfigurationProviderFactory', () => {
      const fileAdapter = container.resolve('FileConfigurationAdapter');
      const envAdapter = container.resolve('EnvironmentConfigurationAdapter');
      return new ConfigurationProviderFactory(fileAdapter, envAdapter);
    }, true);

    // Create and register configuration provider
    const configFactory = container.resolve('ConfigurationProviderFactory');
    const configProvider = configFactory.create({
      configProvider: options.configProvider || 'environment',
      configPath: options.configPath,
      envPrefix: options.envPrefix
    });
    container.registerInstance('IConfigurationProvider', configProvider);

    // Register default logger configuration
    const defaultConfig = options.defaultConfig || LoggerConfiguration.fromEnvironment();
    container.registerInstance('LoggerConfiguration', defaultConfig);

    // Register logger factory
    container.registerFactory('ILoggerFactory', () => {
      const configProvider = container.resolve('IConfigurationProvider');
      return new WinstonLoggerFactory(configProvider);
    }, true);

    // Register application services
    container.registerFactory('ConfigurationService', () => {
      const configProvider = container.resolve('IConfigurationProvider');
      return new ConfigurationService(configProvider);
    }, true);

    container.registerFactory('LoggerService', () => {
      const loggerFactory = container.resolve('ILoggerFactory');
      const config = container.resolve('LoggerConfiguration');
      return new LoggerService(loggerFactory, config);
    }, true);

    // Register use cases
    container.registerFactory('CreateLoggerUseCase', () => {
      const loggerFactory = container.resolve('ILoggerFactory');
      const configService = container.resolve('ConfigurationService');
      return new CreateLoggerUseCase(loggerFactory, configService);
    }, true);

    container.registerFactory('ConfigureLoggerUseCase', () => {
      const configService = container.resolve('ConfigurationService');
      return new ConfigureLoggerUseCase(configService);
    }, true);

    container.registerFactory('TraceCorrelationUseCase', () => {
      return new TraceCorrelationUseCase();
    }, true);

    // Register main logger interface
    container.registerFactory('ILogger', () => container.resolve('LoggerService'), false);
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
    return container.resolve('ConfigurationService');
  }

  /**
   * Get create logger use case
   * @returns {CreateLoggerUseCase} Create logger use case instance
   */
  static createLoggerUseCase() {
    return container.resolve('CreateLoggerUseCase');
  }

  /**
   * Get configure logger use case
   * @returns {ConfigureLoggerUseCase} Configure logger use case instance
   */
  static configureLoggerUseCase() {
    return container.resolve('ConfigureLoggerUseCase');
  }

  /**
   * Get trace correlation use case
   * @returns {TraceCorrelationUseCase} Trace correlation use case instance
   */
  static traceCorrelationUseCase() {
    return container.resolve('TraceCorrelationUseCase');
  }

  /**
   * Reset container
   */
  static reset() {
    container.clearInstances();
  }
}
