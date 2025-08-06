
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration.js';

/**
 * Configuration service for managing logger configurations
 */
export class ConfigurationService {
  /**
   * @param {Object} configProvider - Configuration provider
   */
  constructor(configProvider) {
    this.configProvider = configProvider;
  }

  /**
   * Get configuration by name
   * @param {string} [name] - Logger name
   * @returns {Promise<LoggerConfiguration>} Logger configuration
   */
  async getConfiguration(name) {
    return this.configProvider.getConfiguration(name);
  }

  /**
   * Update configuration
   * @param {LoggerConfiguration} config - Logger configuration
   * @returns {Promise<void>}
   */
  async updateConfiguration(config) {
    await this.configProvider.setConfiguration(config);
  }

  /**
   * Watch for configuration changes
   * @param {Function} callback - Callback function
   * @returns {Promise<void>}
   */
  async watchForChanges(callback) {
    await this.configProvider.watchConfiguration(callback);
  }

  /**
   * Stop watching for changes
   * @returns {Promise<void>}
   */
  async stopWatching() {
    await this.configProvider.stopWatching();
  }

  /**
   * Merge configurations
   * @param {LoggerConfiguration} baseConfig - Base configuration
   * @param {Partial<LoggerConfiguration>} overrideConfig - Override configuration
   * @returns {Promise<LoggerConfiguration>} Merged configuration
   */
  async mergeConfigurations(baseConfig, overrideConfig) {
    return new LoggerConfiguration({
      name: overrideConfig.name || baseConfig.name,
      level: overrideConfig.level || baseConfig.level,
      transports: overrideConfig.transports || baseConfig.transports,
      format: overrideConfig.format || baseConfig.format,
      silent: overrideConfig.silent !== undefined ? overrideConfig.silent : baseConfig.silent,
      exitOnError: overrideConfig.exitOnError !== undefined ? overrideConfig.exitOnError : baseConfig.exitOnError,
      handleExceptions: overrideConfig.handleExceptions !== undefined ? overrideConfig.handleExceptions : baseConfig.handleExceptions,
      handleRejections: overrideConfig.handleRejections !== undefined ? overrideConfig.handleRejections : baseConfig.handleRejections,
      defaultMetadata: { ...baseConfig.defaultMetadata, ...overrideConfig.defaultMetadata }
    });
  }
}
