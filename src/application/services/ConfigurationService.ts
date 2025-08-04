import { injectable, inject } from 'tsyringe';
import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';

export class ConfigurationService {
  private configProvider;

  constructor(configProvider) {
    this.configProvider = configProvider;
  }

  async getConfiguration(name?: string): Promise<LoggerConfiguration> {
    return this.configProvider.getConfiguration(name);
  }

  async updateConfiguration(config: LoggerConfiguration): Promise<void> {
    await this.configProvider.setConfiguration(config);
  }

  async watchForChanges(callback: (config: LoggerConfiguration) => void): Promise<void> {
    await this.configProvider.watchConfiguration(callback);
  }

  async stopWatching(): Promise<void> {
    await this.configProvider.stopWatching();
  }

  async mergeConfigurations(
    baseConfig: LoggerConfiguration,
    overrideConfig: Partial<LoggerConfiguration>
  ): Promise<LoggerConfiguration> {
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