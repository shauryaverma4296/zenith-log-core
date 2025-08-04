import 'reflect-metadata';
import { container } from 'tsyringe';

// Domain interfaces
import { ILogger } from '../domain/interfaces/ILogger';
import { ILoggerFactory } from '../domain/interfaces/ILoggerFactory';
import { IConfigurationProvider } from '../domain/interfaces/IConfigurationProvider';

// Application services
import { LoggerService } from '../application/services/LoggerService';
import { ConfigurationService } from '../application/services/ConfigurationService';
import { CreateLoggerUseCase } from '../application/use-cases/CreateLoggerUseCase';
import { ConfigureLoggerUseCase } from '../application/use-cases/ConfigureLoggerUseCase';
import { TraceCorrelationUseCase } from '../application/use-cases/TraceCorrelationUseCase';

// Infrastructure implementations
import { WinstonLoggerFactory } from '../infrastructure/factories/WinstonLoggerFactory';
import { FileConfigurationAdapter } from '../infrastructure/adapters/FileConfigurationAdapter';
import { EnvironmentConfigurationAdapter } from '../infrastructure/adapters/EnvironmentConfigurationAdapter';
import { LoggerConfiguration } from '../domain/entities/LoggerConfiguration';

export class ContainerConfig {
  static configure(options: {
    configProvider?: 'file' | 'environment' | IConfigurationProvider;
    configPath?: string;
    envPrefix?: string;
    defaultConfig?: LoggerConfiguration;
  } = {}): void {
    // Configure configuration provider
    let configProvider: IConfigurationProvider;
    
    if (typeof options.configProvider === 'object') {
      configProvider = options.configProvider;
    } else {
      switch (options.configProvider) {
        case 'file':
          configProvider = new FileConfigurationAdapter(options.configPath);
          break;
        case 'environment':
          configProvider = new EnvironmentConfigurationAdapter(options.envPrefix);
          break;
        default:
          configProvider = new EnvironmentConfigurationAdapter();
      }
    }

    // Register configuration provider
    container.registerInstance<IConfigurationProvider>('IConfigurationProvider', configProvider);

    // Register default configuration
    const defaultConfig = options.defaultConfig || new LoggerConfiguration();
    container.registerInstance<LoggerConfiguration>('LoggerConfiguration', defaultConfig);

    // Register factory
    container.registerSingleton<ILoggerFactory>('ILoggerFactory', WinstonLoggerFactory);

    // Register application services
    container.registerSingleton<ConfigurationService>('ConfigurationService', ConfigurationService);
    container.registerSingleton<LoggerService>('LoggerService', LoggerService);

    // Register use cases
    container.registerSingleton<CreateLoggerUseCase>('CreateLoggerUseCase', CreateLoggerUseCase);
    container.registerSingleton<ConfigureLoggerUseCase>('ConfigureLoggerUseCase', ConfigureLoggerUseCase);
    container.registerSingleton<TraceCorrelationUseCase>('TraceCorrelationUseCase', TraceCorrelationUseCase);

    // Register main logger interface
    container.register<ILogger>('ILogger', { useToken: 'LoggerService' });
  }

  static getLogger(name?: string): ILogger {
    if (name) {
      const factory = container.resolve<ILoggerFactory>('ILoggerFactory');
      return factory.createLogger(name);
    }
    return container.resolve<ILogger>('ILogger');
  }

  static getLoggerFactory(): ILoggerFactory {
    return container.resolve<ILoggerFactory>('ILoggerFactory');
  }

  static getConfigurationService(): ConfigurationService {
    return container.resolve<ConfigurationService>('ConfigurationService');
  }

  static createLoggerUseCase(): CreateLoggerUseCase {
    return container.resolve<CreateLoggerUseCase>('CreateLoggerUseCase');
  }

  static configureLoggerUseCase(): ConfigureLoggerUseCase {
    return container.resolve<ConfigureLoggerUseCase>('ConfigureLoggerUseCase');
  }

  static traceCorrelationUseCase(): TraceCorrelationUseCase {
    return container.resolve<TraceCorrelationUseCase>('TraceCorrelationUseCase');
  }

  static reset(): void {
    container.clearInstances();
  }
}