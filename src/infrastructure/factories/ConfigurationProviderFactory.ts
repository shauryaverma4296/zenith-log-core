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
    private fileAdapter: FileConfigurationAdapter,
    private envAdapter: EnvironmentConfigurationAdapter
  ) {}

  create(options: ConfigurationProviderOptions = {}): IConfigurationProvider {
    if (typeof options.configProvider === 'object') {
      return options.configProvider;
    }

    switch (options.configProvider) {
      case 'file':
        // Use injected instance but configure it
        if (options.configPath) {
          return new FileConfigurationAdapter(options.configPath);
        }
        return this.fileAdapter;
      case 'environment':
        // Use injected instance but configure it  
        if (options.envPrefix) {
          return new EnvironmentConfigurationAdapter(options.envPrefix);
        }
        return this.envAdapter;
      default:
        return this.envAdapter;
    }
  }
}