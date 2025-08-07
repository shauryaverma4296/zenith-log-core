const { LoggerConfiguration } = require('../../domain/entities/LoggerConfiguration.js');

class ConfigurationService {
  constructor(configProvider) {
    this.configProvider = configProvider;
  }

  async getConfiguration(name) {
    return this.configProvider.getConfiguration(name);
  }
}

module.exports = { ConfigurationService };
