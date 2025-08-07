const { WinstonLoggerAdapter } = require('./WinstonLoggerAdapter.js');

class WinstonLoggerFactory {
  constructor(configProvider) {
    this.configProvider = configProvider;
    this.loggers = new Map();
  }

  createLogger(name = 'default') {
    if (this.loggers.has(name)) {
      return this.loggers.get(name);
    }

    const config = this.configProvider.getConfigurationSync(name);
    const logger = WinstonLoggerAdapter.fromConfiguration(config);

    this.loggers.set(name, logger);
    return logger;
  }

  createLoggerWithConfig(config) {
    const configKey = `${config.name}_${JSON.stringify({
      level: config.level,
      transports: config.transports,
      format: config.format,
      silent: config.silent,
    })}`;

    const existingLogger = this.loggers.get(configKey);
    if (existingLogger) {
      return existingLogger;
    }

    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    this.loggers.set(configKey, logger);
    return logger;
  }

  getLogger(name) {
    return this.loggers.get(name) || null;
  }

  hasLogger(name) {
    return this.loggers.has(name);
  }

  removeLogger(name) {
    const logger = this.loggers.get(name);
    if (logger) {
      logger.close().catch(console.error);
      return this.loggers.delete(name);
    }
    return false;
  }

  clearLoggers() {
    for (const [name, logger] of this.loggers) {
      logger.close().catch(console.error);
    }
    this.loggers.clear();
  }
}

module.exports = { WinstonLoggerFactory };
