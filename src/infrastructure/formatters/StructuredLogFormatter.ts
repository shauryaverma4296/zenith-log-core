import { ILogFormatter } from '../../domain/interfaces/ILogFormatter';
import { LogEntry } from '../../domain/entities/LogEntry';

export class StructuredLogFormatter implements ILogFormatter {
  private readonly options: {
    serviceName?: string;
    version?: string;
    environment?: string;
    includeStackTrace?: boolean;
  };

  constructor(options: {
    serviceName?: string;
    version?: string;
    environment?: string;
    includeStackTrace?: boolean;
  } = {}) {
    this.options = {
      serviceName: options.serviceName || 'unknown',
      version: options.version || '1.0.0',
      environment: options.environment || process.env.NODE_ENV || 'development',
      includeStackTrace: options.includeStackTrace !== false
    };
  }

  format(entry: LogEntry): string {
    const structuredLog = {
      '@timestamp': entry.timestamp.toISOString(),
      '@version': '1',
      message: entry.message,
      level: entry.level,
      service: {
        name: this.options.serviceName,
        version: this.options.version,
        environment: this.options.environment
      },
      labels: {
        ...entry.metadata
      },
      context: {
        ...entry.context
      }
    };

    // Add error information if present
    if (entry.error) {
      (structuredLog as any).error = {
        type: entry.error.name,
        message: entry.error.message
      };

      if (this.options.includeStackTrace && entry.error.stack) {
        (structuredLog as any).error.stack_trace = entry.error.stack;
      }
    }

    // Add request context if available
    if (entry.context.requestId) {
      (structuredLog as any).trace = {
        id: entry.context.requestId
      };
    }

    if (entry.context.userId) {
      (structuredLog as any).user = {
        id: entry.context.userId
      };
    }

    // Add performance metrics if available
    if (entry.metadata.duration) {
      (structuredLog as any).performance = {
        duration_ms: entry.metadata.duration
      };
    }

    return JSON.stringify(structuredLog);
  }

  getName(): string {
    return 'structured';
  }
}