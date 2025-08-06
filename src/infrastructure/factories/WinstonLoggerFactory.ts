import { injectable, inject, container } from 'tsyringe';
import { ILogger } from '../../domain/interfaces/ILogger';
import { ILoggerFactory } from '../../domain/interfaces/ILoggerFactory';
import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';
import { WinstonLoggerAdapter } from '../adapters/WinstonLoggerAdapter';

@injectable()
export class WinstonLoggerFactory implements ILoggerFactory {
  private readonly loggers = new Map<string, ILogger>();

  constructor(
    @inject('IConfigurationProvider') private configProvider: IConfigurationProvider
  ) {}

  createLogger(name: string = 'default'): ILogger {
    if (this.loggers.has(name)) {
      return this.loggers.get(name)!;
    }

    const config = this.configProvider.getConfigurationSync(name);
    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    
    this.loggers.set(name, logger);
    return logger;
  }

  createLoggerWithConfig(config: LoggerConfiguration): ILogger {
    // Create a unique key for this configuration to allow multiple configs with same name
    const configKey = `${config.name}_${JSON.stringify({
      level: config.level,
      transports: config.transports,
      format: config.format,
      silent: config.silent
    })}`;
    
    const existingLogger = this.loggers.get(configKey);
    if (existingLogger) {
      return existingLogger;
    }

    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    this.loggers.set(configKey, logger);
    return logger;
  }

  async createLoggerAsync(name: string = 'default'): Promise<ILogger> {
    if (this.loggers.has(name)) {
      return this.loggers.get(name)!;
    }

    const config = await this.configProvider.getConfiguration(name);
    const logger = WinstonLoggerAdapter.fromConfiguration(config);
    
    this.loggers.set(name, logger);
    return logger;
  }

  getLogger(name: string): ILogger | null {
    return this.loggers.get(name) || null;
  }

  hasLogger(name: string): boolean {
    return this.loggers.has(name);
  }

  removeLogger(name: string): boolean {
    const logger = this.loggers.get(name);
    if (logger) {
      logger.close().catch(console.error);
      return this.loggers.delete(name);
    }
    return false;
  }

  clearLoggers(): void {
    for (const [name, logger] of this.loggers) {
      logger.close().catch(console.error);
    }
    this.loggers.clear();
  }
}