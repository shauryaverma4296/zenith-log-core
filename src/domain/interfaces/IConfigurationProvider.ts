import { LoggerConfiguration } from '../entities/LoggerConfiguration';

export interface IConfigurationProvider {
  getConfiguration(name?: string): Promise<LoggerConfiguration>;
  getConfigurationSync(name?: string): LoggerConfiguration;
  setConfiguration(config: LoggerConfiguration): Promise<void>;
  watchConfiguration(callback: (config: LoggerConfiguration) => void): Promise<void>;
  stopWatching(): Promise<void>;
}