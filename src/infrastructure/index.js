// Adapters
const { WinstonLoggerAdapter } = require('./adapters/WinstonLoggerAdapter.js');

// Factories
const { WinstonLoggerFactory } = require('./factories/WinstonLoggerFactory.js');

module.exports = {
  WinstonLoggerAdapter,
  WinstonLoggerFactory,
};
