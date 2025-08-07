const { LogLevel } = require('../enums/LogLevel.js');

class LoggerConfiguration {
  constructor(config = {}) {
    this.name = config.name || 'default';
    this.level = config.level || LogLevel.INFO;
    this.transports = config.transports || [{ type: 'console' }];
    this.format = config.format || { type: 'json' };
    this.silent = config.silent || false;
    this.exitOnError = config.exitOnError || false;
    this.handleExceptions = config.handleExceptions || true;
    this.handleRejections = config.handleRejections || true;
    this.defaultMetadata = config.defaultMetadata || {};
  }

  static fromEnvironment() {
    return new LoggerConfiguration({
      level: process.env.LOG_LEVEL || LogLevel.INFO,
      silent: process.env.LOG_SILENT === 'true',
      name: process.env.LOG_NAME || 'app',
    });
  }
}

module.exports = { LoggerConfiguration };
