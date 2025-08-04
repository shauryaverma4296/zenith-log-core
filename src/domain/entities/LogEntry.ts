import { LogLevel } from '../enums/LogLevel';

export interface LogMetadata {
  [key: string]: any;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export class LogEntry {
  public readonly timestamp: Date;
  public readonly level: LogLevel;
  public readonly message: string;
  public readonly metadata: LogMetadata;
  public readonly context: LogContext;
  public readonly error?: Error;

  constructor(
    level: LogLevel,
    message: string,
    metadata: LogMetadata = {},
    context: LogContext = {},
    error?: Error
  ) {
    this.timestamp = new Date();
    this.level = level;
    this.message = message;
    this.metadata = { ...metadata };
    this.context = { ...context };
    this.error = error;
  }

  public toJSON(): Record<string, any> {
    return {
      timestamp: this.timestamp.toISOString(),
      level: this.level,
      message: this.message,
      metadata: this.metadata,
      context: this.context,
      error: this.error ? {
        name: this.error.name,
        message: this.error.message,
        stack: this.error.stack
      } : undefined
    };
  }
}