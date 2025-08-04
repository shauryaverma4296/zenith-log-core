import { IConfigurationProvider } from '../../domain/interfaces/IConfigurationProvider';
import { LoggerConfiguration, TransportConfiguration } from '../../domain/entities/LoggerConfiguration';
import { LogLevel } from '../../domain/enums/LogLevel';

export class EnvironmentConfigurationAdapter implements IConfigurationProvider {
  private readonly prefix: string;

  constructor(prefix: string = 'LOG_') {
    this.prefix = prefix;
  }

  async getConfiguration(name?: string): Promise<LoggerConfiguration> {
    const envPrefix = name ? `${this.prefix}${name.toUpperCase()}_` : this.prefix;
    
    return new LoggerConfiguration({
      name: this.getEnvValue(`${envPrefix}NAME`) || name || 'default',
      level: this.getEnvValue(`${envPrefix}LEVEL`) as LogLevel || LogLevel.INFO,
      silent: this.getBooleanEnvValue(`${envPrefix}SILENT`, false),
      exitOnError: this.getBooleanEnvValue(`${envPrefix}EXIT_ON_ERROR`, false),
      handleExceptions: this.getBooleanEnvValue(`${envPrefix}HANDLE_EXCEPTIONS`, true),
      handleRejections: this.getBooleanEnvValue(`${envPrefix}HANDLE_REJECTIONS`, true),
      transports: this.parseTransports(envPrefix),
      format: {
        type: (this.getEnvValue(`${envPrefix}FORMAT`) as any) || 'json'
      },
      defaultMetadata: this.parseMetadata(envPrefix)
    });
  }

  async setConfiguration(config: LoggerConfiguration): Promise<void> {
    // Environment variables are read-only, so this is a no-op
    // In a real implementation, you might want to throw an error
    console.warn('Cannot set configuration via environment variables');
  }

  async watchConfiguration(callback: (config: LoggerConfiguration) => void): Promise<void> {
    // Environment variables don't change during runtime, so this is a no-op
    // In a real implementation, you might want to watch for process.env changes
  }

  async stopWatching(): Promise<void> {
    // No-op for environment configuration
  }

  private getEnvValue(key: string): string | undefined {
    return process.env[key];
  }

  private getBooleanEnvValue(key: string, defaultValue: boolean): boolean {
    const value = this.getEnvValue(key);
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private parseTransports(prefix: string): TransportConfiguration[] {
    const transportsStr = this.getEnvValue(`${prefix}TRANSPORTS`);
    if (!transportsStr) {
      return [{ type: 'console' }];
    }

    try {
      return JSON.parse(transportsStr);
    } catch {
      // If parsing fails, default to console transport
      return [{ type: 'console' }];
    }
  }

  private parseMetadata(prefix: string): Record<string, any> {
    const metadataStr = this.getEnvValue(`${prefix}METADATA`);
    if (!metadataStr) {
      return {};
    }

    try {
      return JSON.parse(metadataStr);
    } catch {
      return {};
    }
  }
}