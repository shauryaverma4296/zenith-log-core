import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration.js';
import { LogLevel } from '../../domain/enums/LogLevel.js';

/**
 * Environment-based configuration adapter
 */
export class EnvironmentConfigurationAdapter {
  /**
   * Get configuration asynchronously
   * @param {string} [name] - Logger name (used as prefix)
   * @returns {Promise<LoggerConfiguration>} Logger configuration
   */
  async getConfiguration(name) {
    return this.getConfigurationSync(name);
  }

  /**
   * Get configuration synchronously
   * @param {string} [name] - Logger name (used as prefix)
   * @returns {LoggerConfiguration} Logger configuration
   */
  getConfigurationSync(name) {
    const prefix = name ? `${name.toUpperCase()}_` : '';
    
    const config = {
      name: name || this.getEnvValue(`${prefix}LOG_NAME`) || 'default',
      level: this.getEnvValue(`${prefix}LOG_LEVEL`) || LogLevel.INFO,
      silent: this.getBooleanEnvValue(`${prefix}LOG_SILENT`, false),
      exitOnError: this.getBooleanEnvValue(`${prefix}LOG_EXIT_ON_ERROR`, false),
      handleExceptions: this.getBooleanEnvValue(`${prefix}LOG_HANDLE_EXCEPTIONS`, true),
      handleRejections: this.getBooleanEnvValue(`${prefix}LOG_HANDLE_REJECTIONS`, true),
      transports: this.parseTransports(prefix),
      format: {
        type: this.getEnvValue(`${prefix}LOG_FORMAT`) || 'json'
      },
      defaultMetadata: this.parseMetadata(prefix)
    };

    return new LoggerConfiguration(config);
  }

  /**
   * Set configuration (no-op for environment adapter)
   * @param {LoggerConfiguration} config - Logger configuration
   * @returns {Promise<void>}
   */
  async setConfiguration(config) {
    // Environment variables are read-only at runtime
    // This is a no-op
  }

  /**
   * Watch configuration changes (no-op for environment adapter)
   * @param {Function} callback - Callback function
   * @returns {Promise<void>}
   */
  async watchConfiguration(callback) {
    // Environment variables don't change during runtime
    // This is a no-op
  }

  /**
   * Stop watching (no-op for environment adapter)
   * @returns {Promise<void>}
   */
  async stopWatching() {
    // This is a no-op
  }

  /**
   * Get environment variable value
   * @private
   */
  getEnvValue(key) {
    return process.env[key];
  }

  /**
   * Get boolean environment variable value
   * @private
   */
  getBooleanEnvValue(key, defaultValue) {
    const value = this.getEnvValue(key);
    if (value === undefined) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }

  /**
   * Parse transports from environment
   * @private
   */
  parseTransports(prefix) {
    const transportsEnv = this.getEnvValue(`${prefix}LOG_TRANSPORTS`);
    if (!transportsEnv) {
      return [{ type: 'console' }];
    }

    try {
      return JSON.parse(transportsEnv);
    } catch (error) {
      return [{ type: 'console' }];
    }
  }

  /**
   * Parse metadata from environment
   * @private
   */
  parseMetadata(prefix) {
    const metadataEnv = this.getEnvValue(`${prefix}LOG_METADATA`);
    if (!metadataEnv) {
      return {};
    }

    try {
      return JSON.parse(metadataEnv);
    } catch (error) {
      return {};
    }
  }
}