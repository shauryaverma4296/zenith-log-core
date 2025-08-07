const { container } = require('./SimpleContainer.js');

const { WinstonLoggerFactory } = require('../infrastructure/WinstonLoggerFactory.js');
class ContainerConfig {
  static configure(defaultConfig = {}) {
    // Clear existing registrations
    container.clear();

    // Create configuration provider
    const configProvider = {
      getConfigurationSync: () => defaultConfig,
    };

    // Register logger factory
    container.registerFactory(
      'WinstonLoggerFactory',
      () => new WinstonLoggerFactory(configProvider),
      true
    );

    // Register logger directly using factory
    container.registerFactory(
      'ILogger',
      () => {
        const factory = container.resolve('WinstonLoggerFactory');
        return factory.createLoggerWithConfig(defaultConfig);
      },
      false
    );
  }

  static getLogger(name) {
    if (name) {
      const factory = container.resolve('WinstonLoggerFactory');
      return factory.createLogger(name);
    }
    return container.resolve('ILogger');
  }

  static reset() {
    container.clearInstances();
  }
}

module.exports = { ContainerConfig };
