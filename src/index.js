// Main entry point for the logger package

// Import all modules
const domain = require('./domain/index.js');
const application = require('./application/index.js');
const infrastructure = require('./infrastructure/index.js');
const presentation = require('./presentation/index.js');
const container = require('./container/index.js');
const { ContainerConfig } = require('./container/ContainerConfig.js');

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
