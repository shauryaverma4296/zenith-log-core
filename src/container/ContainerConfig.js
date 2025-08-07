const { container } = require('./SimpleContainer.js');

const { WinstonLoggerFactory } = require('../infrastructure/factories/WinstonLoggerFactory.js');

const { ConfigurationService } = require('../application/services/ConfigurationService.js');
const { LoggerService } = require('../application/services/LoggerService.js');

class ContainerConfig {
  static configure(defaultConfig = {}) {
    // Clear existing registrations
    container.clear();

    // Create simple configuration provider
    const configProvider = {
      getConfiguration: (name) => Promise.resolve(defaultConfig),
      getConfigurationSync: (name) => defaultConfig
    };

    // Register logger factory
    container.registerFactory(
      'ILoggerFactory',
      () => new WinstonLoggerFactory(configProvider),
      true
    );

    // Register application services
    container.registerFactory(
      'ConfigurationService',
      () => new ConfigurationService(configProvider),
      true
    );

    container.registerFactory(
      'LoggerService',
      () => {
        const loggerFactory = container.resolve('ILoggerFactory');
        return new LoggerService(loggerFactory, defaultConfig);
      },
      true
    );
    container.registerFactory('ILogger', () => container.resolve('LoggerService'), false);
  }

  static getLogger(name) {
    if (name) {
      const factory = container.resolve('ILoggerFactory');
      return factory.createLogger(name);
    }
    return container.resolve('ILogger');
  }

  static reset() {
    container.clearInstances();
  }
}

module.exports = { ContainerConfig };
