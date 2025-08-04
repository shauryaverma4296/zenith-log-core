import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';
import { FileConfigurationAdapter } from '../adapters/FileConfigurationAdapter';
import { EnvironmentConfigurationAdapter } from '../adapters/EnvironmentConfigurationAdapter';

export interface ConfigurationProviderOptions {
  configProvider?: 'file' | 'environment' | IConfigurationProvider;
  configPath?: string;
  envPrefix?: string;
}

export class ConfigurationProviderFactory {
  static create(options: ConfigurationProviderOptions = {}): IConfigurationProvider {
    if (typeof options.configProvider === 'object') {
      return options.configProvider;
    }

    switch (options.configProvider) {
      case 'file':
        return new FileConfigurationAdapter(options.configPath);
      case 'environment':
        return new EnvironmentConfigurationAdapter(options.envPrefix);
      default:
        return new EnvironmentConfigurationAdapter();
    }
  }
}