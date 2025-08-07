try {
  console.log('Loading infrastructure...');
  const infrastructure = require('./infrastructure/index.js');
  console.log('Loading container...');
  const container = require('./container/index.js');
  const { LoggingMiddleware, CorrelationMiddleware } = require('./middleware');
  const { LOG_LEVELS, LogLevel } = require('./enums');

  const { ContainerConfig } = require('./container/ContainerConfig.js');

  console.log('All modules loaded successfully');

  // Main logger initialization
  function initializeLogger(defaultConfig = {}) {
    ContainerConfig.configure(defaultConfig);
    return ContainerConfig.getLogger();
  }

  // Export everything
  module.exports = {
    ...infrastructure,
    ...container,
    initializeLogger,
    LOG_LEVELS,
    LogLevel,
    LoggingMiddleware,
    CorrelationMiddleware,
    Logger: ContainerConfig,
  };

  console.log('Logger package initialized successfully');
} catch (error) {
  console.error('Error loading logger package:', error);
  throw error;
}
