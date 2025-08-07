const { container } = require('./SimpleContainer.js');
const { WinstonLoggerFactory } = require('../infrastructure/factories/WinstonLoggerFactory.js');

class ContainerConfig {
  static configure(defaultConfig = {}) {
    // Clear existing registrations
    container.clear();

    // Create simple configuration provider
    const configProvider = {
      getConfiguration: (name) => Promise.resolve(defaultConfig),
      getConfigurationSync: (name) => defaultConfig
    };

    // Register logger factory only
    container.registerFactory(
      'ILoggerFactory',
      () => new WinstonLoggerFactory(configProvider),
      true
    );
  }

  static getLogger(name) {
    const factory = container.resolve('ILoggerFactory');
    if (name) {
      return factory.createLogger(name);
    }
    return factory.createLogger('default');
  }

  static reset() {
    container.clearInstances();
  }
}

module.exports = { ContainerConfig };
