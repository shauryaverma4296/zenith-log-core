import { injectable } from 'tsyringe';
import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';
import { FileConfigurationAdapter } from '../adapters/FileConfigurationAdapter';
import { EnvironmentConfigurationAdapter } from '../adapters/EnvironmentConfigurationAdapter';

export interface ConfigurationProviderOptions {
  configProvider?: 'file' | 'environment' | IConfigurationProvider;
  configPath?: string;
  envPrefix?: string;
}

@injectable()
export class ConfigurationProviderFactory {
  constructor(
    private fileAdapterFactory: () => IConfigurationProvider,
    private envAdapterFactory: () => IConfigurationProvider
  ) {}

  create(options: ConfigurationProviderOptions = {}): IConfigurationProvider {
    if (typeof options.configProvider === 'object') {
      return options.configProvider;
    }

    switch (options.configProvider) {
      case 'file':
        return this.fileAdapterFactory();
      case 'environment':
        return this.envAdapterFactory();
      default:
        return this.envAdapterFactory();
    }
  }
}