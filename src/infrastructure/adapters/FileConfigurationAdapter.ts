import { promises as fs } from 'fs';
import { watch } from 'fs';
import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';

export class FileConfigurationAdapter implements IConfigurationProvider {
  private readonly configPath: string;
  private watcher?: ReturnType<typeof watch>;
  private watchCallback?: (config: LoggerConfiguration) => void;

  constructor(configPath: string = './logger.config.json') {
    this.configPath = configPath;
  }

  async getConfiguration(name?: string): Promise<LoggerConfiguration> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const configJson = JSON.parse(configData);
      
      if (name && configJson[name]) {
        return new LoggerConfiguration(configJson[name]);
      }
      
      return new LoggerConfiguration(configJson.default || configJson);
    } catch (error) {
      // If file doesn't exist or is invalid, return default configuration
      return new LoggerConfiguration();
    }
  }

  getConfigurationSync(name?: string): LoggerConfiguration {
    try {
      const fs = require('fs');
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      const configJson = JSON.parse(configData);
      
      if (name && configJson[name]) {
        return new LoggerConfiguration(configJson[name]);
      }
      
      return new LoggerConfiguration(configJson.default || configJson);
    } catch (error) {
      // If file doesn't exist or is invalid, return default configuration
      return new LoggerConfiguration();
    }
  }

  async setConfiguration(config: LoggerConfiguration): Promise<void> {
    try {
      let existingConfig = {};
      try {
        const configData = await fs.readFile(this.configPath, 'utf-8');
        existingConfig = JSON.parse(configData);
      } catch {
        // File doesn't exist, will create new one
      }

      const updatedConfig = {
        ...existingConfig,
        [config.name]: {
          name: config.name,
          level: config.level,
          transports: config.transports,
          format: config.format,
          silent: config.silent,
          exitOnError: config.exitOnError,
          handleExceptions: config.handleExceptions,
          handleRejections: config.handleRejections,
          defaultMetadata: config.defaultMetadata
        }
      };

      await fs.writeFile(this.configPath, JSON.stringify(updatedConfig, null, 2));
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  async watchConfiguration(callback: (config: LoggerConfiguration) => void): Promise<void> {
    this.watchCallback = callback;
    
    this.watcher = watch(this.configPath, async (eventType) => {
      if (eventType === 'change' && this.watchCallback) {
        try {
          const config = await this.getConfiguration();
          this.watchCallback(config);
        } catch (error) {
          console.error('Error reading configuration file:', error);
        }
      }
    });
  }

  async stopWatching(): Promise<void> {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
      this.watchCallback = undefined;
    }
  }
}