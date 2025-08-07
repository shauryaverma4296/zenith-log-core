try {
  console.log('Loading domain...');
  const domain = require('./domain/index.js');
  console.log('Loading application...');
  const application = require('./application/index.js');
  console.log('Loading infrastructure...');
  const infrastructure = require('./infrastructure/index.js');
  console.log('Loading presentation...');
  const presentation = require('./presentation/index.js');
  console.log('Loading container...');
  const container = require('./container/index.js');
  const { ContainerConfig } = require('./container/ContainerConfig.js');

  console.log('All modules loaded successfully');

  // Main logger initialization
  function initializeLogger(defaultConfig = {}) {
    ContainerConfig.configure(defaultConfig);
    return ContainerConfig.getLogger();
  }

  // Export everything
  module.exports = {
    ...domain,
    ...application,
    ...infrastructure,
    ...presentation,
    ...container,
    initializeLogger,
    Logger: ContainerConfig,
  };

  console.log('Logger package initialized successfully');
} catch (error) {
  console.error('Error loading logger package:', error);
  throw error;
}
