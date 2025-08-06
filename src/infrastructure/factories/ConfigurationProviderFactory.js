
import { FileConfigurationAdapter } from '../adapters/FileConfigurationAdapter.js';
import { EnvironmentConfigurationAdapter } from '../adapters/EnvironmentConfigurationAdapter.js';

/**
 * @typedef {Object} ConfigurationProviderOptions
 * @property {'file'|'environment'|Object} [configProvider] - Configuration provider type or instance
 * @property {string} [configPath] - Path to configuration file
 * @property {string} [envPrefix] - Environment variable prefix
 */

/**
 * Configuration provider factory
 */
export class ConfigurationProviderFactory {
  /**
   * @param {Object} fileAdapter - File configuration adapter
   * @param {Object} envAdapter - Environment configuration adapter
   */
  constructor(fileAdapter, envAdapter) {
    this.fileAdapter = fileAdapter;
    this.envAdapter = envAdapter;
  }

  /**
   * Create configuration provider
   * @param {ConfigurationProviderOptions} options - Configuration options
   * @returns {Object} Configuration provider instance
   */
  create(options = {}) {
    if (typeof options.configProvider === 'object') {
      return options.configProvider;
    }

    switch (options.configProvider) {
      case 'file':
        return this.fileAdapter;
      case 'environment':
        return this.envAdapter;
      default:
        return this.envAdapter;
    }
  }
}
