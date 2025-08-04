import { LogLevel } from '../enums/LogLevel';

export interface TransportConfiguration {
  type: 'console' | 'file' | 'http' | 'mongodb' | 'mysql' | 'custom';
  level?: LogLevel;
  format?: string;
  options?: Record<string, any>;
}

export interface FormatterConfiguration {
  type: 'json' | 'text' | 'structured' | 'custom';
  options?: Record<string, any>;
}

export class LoggerConfiguration {
  public readonly name: string;
  public readonly level: LogLevel;
  public readonly transports: TransportConfiguration[];
  public readonly format: FormatterConfiguration;
  public readonly silent: boolean;
  public readonly exitOnError: boolean;
  public readonly handleExceptions: boolean;
  public readonly handleRejections: boolean;
  public readonly defaultMetadata: Record<string, any>;

  constructor(config: {
    name?: string;
    level?: LogLevel;
    transports?: TransportConfiguration[];
    format?: FormatterConfiguration;
    silent?: boolean;
    exitOnError?: boolean;
    handleExceptions?: boolean;
    handleRejections?: boolean;
    defaultMetadata?: Record<string, any>;
  } = {}) {
    this.name = config.name || 'default';
    this.level = config.level || LogLevel.INFO;
    this.transports = config.transports || [{ type: 'console' }];
    this.format = config.format || { type: 'json' };
    this.silent = config.silent || false;
    this.exitOnError = config.exitOnError || false;
    this.handleExceptions = config.handleExceptions || true;
    this.handleRejections = config.handleRejections || true;
    this.defaultMetadata = config.defaultMetadata || {};
  }

  public static fromEnvironment(): LoggerConfiguration {
    return new LoggerConfiguration({
      level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      silent: process.env.LOG_SILENT === 'true',
      name: process.env.LOG_NAME || 'app'
    });
  }
}