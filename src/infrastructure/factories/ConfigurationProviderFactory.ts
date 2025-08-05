import { injectable, inject } from 'tsyringe';
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
    @inject('FileConfigurationAdapter') private fileAdapter: IConfigurationProvider,
    @inject('EnvironmentConfigurationAdapter') private envAdapter: IConfigurationProvider
  ) {}

  create(options: ConfigurationProviderOptions = {}): IConfigurationProvider {
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