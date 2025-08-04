import { ILogger } from './ILogger';
import { LoggerConfiguration } from '../entities/LoggerConfiguration';

export interface ILoggerFactory {
  createLogger(name?: string): ILogger;
  createLoggerWithConfig(config: LoggerConfiguration): ILogger;
  getLogger(name: string): ILogger | null;
  hasLogger(name: string): boolean;
  removeLogger(name: string): boolean;
  clearLoggers(): void;
}