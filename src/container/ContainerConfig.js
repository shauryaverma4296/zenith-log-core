const { container } = require('./SimpleContainer.js');

const {
  ConfigurationProviderFactory,
} = require('../infrastructure/factories/ConfigurationProviderFactory.js');
const { WinstonLoggerFactory } = require('../infrastructure/factories/WinstonLoggerFactory.js');

const { ConfigurationService } = require('../application/services/ConfigurationService.js');
const { LoggerService } = require('../application/services/LoggerService.js');

class ContainerConfig {
  static configure(defaultConfig = {}) {
    // Clear existing registrations
    container.clear();

    container.registerFactory(
      'ConfigurationProviderFactory',
      () => {
        return new ConfigurationProviderFactory();
      },
      true
    );

    // Create and register configuration provider
    const configFactory = container.resolve('ConfigurationProviderFactory');
    const configProvider = configFactory.create({
      configProvider: defaultConfig.configProvider,
      configPath: defaultConfig.configPath,
      envPrefix: defaultConfig.envPrefix,
    });
    container.registerInstance('IConfigurationProvider', configProvider);

    // Register default logger configuration
    console.log('-------', defaultConfig);
    container.registerInstance('LoggerConfiguration', defaultConfig);

    // Register logger factory
    container.registerFactory(
      'ILoggerFactory',
      () => {
        const configProvider = container.resolve('IConfigurationProvider');
        return new WinstonLoggerFactory(configProvider);
      },
      true
    );

    // Register application services
    container.registerFactory(
      'ConfigurationService',
      () => {
        const configProvider = container.resolve('IConfigurationProvider');
        return new ConfigurationService(configProvider);
      },
      true
    );

    container.registerFactory(
      'LoggerService',
      () => {
        const loggerFactory = container.resolve('ILoggerFactory');
        const config = container.resolve('LoggerConfiguration');
        return new LoggerService(loggerFactory, config);
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
