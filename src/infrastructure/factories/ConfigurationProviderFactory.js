class ConfigurationProviderFactory {
  constructor(envAdapter) {
    this.envAdapter = envAdapter;
  }
  create(options = {}) {
    if (typeof options.configProvider === 'object') {
      return options.configProvider;
    }
    switch (options.configProvider) {
      case 'environment':
        return this.envAdapter;
      default:
        return this.envAdapter;
    }
  }
}

module.exports = { ConfigurationProviderFactory };
