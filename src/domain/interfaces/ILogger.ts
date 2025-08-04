import { LogLevel } from '../enums/LogLevel';
import { LogEntry, LogMetadata, LogContext } from '../entities/LogEntry';

export interface ILogger {
  error(message: string, metadata?: LogMetadata, context?: LogContext): void;
  error(message: string, error: Error, metadata?: LogMetadata, context?: LogContext): void;
  
  warn(message: string, metadata?: LogMetadata, context?: LogContext): void;
  
  info(message: string, metadata?: LogMetadata, context?: LogContext): void;
  
  http(message: string, metadata?: LogMetadata, context?: LogContext): void;
  
  verbose(message: string, metadata?: LogMetadata, context?: LogContext): void;
  
  debug(message: string, metadata?: LogMetadata, context?: LogContext): void;
  
  silly(message: string, metadata?: LogMetadata, context?: LogContext): void;
  
  log(level: LogLevel, message: string, metadata?: LogMetadata, context?: LogContext): void;
  log(level: LogLevel, message: string, error: Error, metadata?: LogMetadata, context?: LogContext): void;
  
  logEntry(entry: LogEntry): void;
  
  child(context: LogContext): ILogger;
  
  isLevelEnabled(level: LogLevel): boolean;
  
  close(): Promise<void>;
}