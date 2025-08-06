import fs from 'fs';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration.js';

/**
 * File-based configuration adapter
 */
export class FileConfigurationAdapter {
  /**
   * @param {string} configPath - Path to configuration file
   */
  constructor(configPath = './logger.config.json') {
    this.configPath = configPath;
    this.watcher = null;
  }

  /**
   * Get configuration asynchronously
   * @param {string} [name] - Logger name
   * @returns {Promise<LoggerConfiguration>} Logger configuration
   */
  async getConfiguration(name) {
    try {
      const configData = await fs.promises.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (name && config.loggers && config.loggers[name]) {
        return new LoggerConfiguration(config.loggers[name]);
      }
      
      return new LoggerConfiguration(config.default || config);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return new LoggerConfiguration();
      }
      throw error;
    }
  }

  /**
   * Get configuration synchronously
   * @param {string} [name] - Logger name
   * @returns {LoggerConfiguration} Logger configuration
   */
  getConfigurationSync(name) {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (name && config.loggers && config.loggers[name]) {
        return new LoggerConfiguration(config.loggers[name]);
      }
      
      return new LoggerConfiguration(config.default || config);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return new LoggerConfiguration();
      }
      throw error;
    }
  }

  /**
   * Set configuration
   * @param {LoggerConfiguration} config - Logger configuration
   * @returns {Promise<void>}
   */
  async setConfiguration(config) {
    let existingConfig = {};
    
    try {
      const configData = await fs.promises.readFile(this.configPath, 'utf8');
      existingConfig = JSON.parse(configData);
    } catch (error) {
      // File doesn't exist or invalid JSON, start with empty config
    }

    if (!existingConfig.loggers) {
      existingConfig.loggers = {};
    }

    existingConfig.loggers[config.name] = {
      name: config.name,
      level: config.level,
      transports: config.transports,
      format: config.format,
      silent: config.silent,
      exitOnError: config.exitOnError,
      handleExceptions: config.handleExceptions,
      handleRejections: config.handleRejections,
      defaultMetadata: config.defaultMetadata
    };

    await fs.promises.writeFile(
      this.configPath,
      JSON.stringify(existingConfig, null, 2),
      'utf8'
    );
  }

  /**
   * Watch for configuration changes
   * @param {Function} callback - Callback function
   * @returns {Promise<void>}
   */
  async watchConfiguration(callback) {
    if (this.watcher) {
      this.watcher.close();
    }

    this.watcher = fs.watch(this.configPath, async (eventType) => {
      if (eventType === 'change') {
        try {
          const config = await this.getConfiguration();
          callback(config);
        } catch (error) {
          // Ignore errors during watch
        }
      }
    });
  }

  /**
   * Stop watching for changes
   * @returns {Promise<void>}
   */
  async stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}