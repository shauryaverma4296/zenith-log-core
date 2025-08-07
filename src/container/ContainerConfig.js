const { container } = require('./SimpleContainer.js');

const { WinstonLoggerFactory } = require('../infrastructure/factories/WinstonLoggerFactory.js');

const { ConfigurationService } = require('../application/services/ConfigurationService.js');

class ContainerConfig {
  static configure(defaultConfig = {}) {
    // Clear existing registrations
    container.clear();

    // Create simple configuration provider
    const configProvider = {
      getConfigurationSync: () => defaultConfig,
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

    // Register logger directly using factory
    container.registerFactory('ILogger', () => {
      const factory = container.resolve('ILoggerFactory');
      return factory.createLoggerWithConfig(defaultConfig);
    }, false);
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
