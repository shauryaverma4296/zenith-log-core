import { injectable, inject } from 'tsyringe';
import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';

export interface ConfigurationProviderOptions {
  configProvider?: 'file' | 'environment' | IConfigurationProvider;
  configPath?: string;
  envPrefix?: string;
}

export type ConfigurationProviderType = 'file' | 'environment';

@injectable()
export class ConfigurationProviderFactory {
  constructor(
    @inject('FileConfigurationAdapter') private fileAdapterFactory: (path?: string) => IConfigurationProvider,
    @inject('EnvironmentConfigurationAdapter') private envAdapterFactory: (prefix?: string) => IConfigurationProvider
  ) {}

  create(options: ConfigurationProviderOptions = {}): IConfigurationProvider {
    if (typeof options.configProvider === 'object') {
      return options.configProvider;
    }

    switch (options.configProvider) {
      case 'file':
        return this.fileAdapterFactory(options.configPath);
      case 'environment':
        return this.envAdapterFactory(options.envPrefix);
      default:
        return this.envAdapterFactory();
    }
  }

  static createWithContainer(options: ConfigurationProviderOptions = {}): IConfigurationProvider {
    // This method should use the container to resolve dependencies
    throw new Error('Use container.resolve<ConfigurationProviderFactory>().create() instead of static method');
  }
}