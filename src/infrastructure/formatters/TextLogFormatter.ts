import { ILogFormatter } from '../../domain/interfaces/ILogFormatter';
import { LogEntry } from '../../domain/entities/LogEntry';

export class TextLogFormatter implements ILogFormatter {
  private readonly options: {
    colorize?: boolean;
    includeTimestamp?: boolean;
    timestampFormat?: string;
    includeContext?: boolean;
  };

  constructor(options: {
    colorize?: boolean;
    includeTimestamp?: boolean;
    timestampFormat?: string;
    includeContext?: boolean;
  } = {}) {
    this.options = {
      colorize: options.colorize !== false,
      includeTimestamp: options.includeTimestamp !== false,
      timestampFormat: options.timestampFormat || 'ISO',
      includeContext: options.includeContext !== false
    };
  }

  format(entry: LogEntry): string {
    let output = '';

    // Timestamp
    if (this.options.includeTimestamp) {
      const timestamp = this.formatTimestamp(entry.timestamp);
      output += `[${timestamp}] `;
    }

    // Level
    const level = this.options.colorize ? this.colorizeLevel(entry.level) : entry.level.toUpperCase();
    output += `${level}: `;

    // Message
    output += entry.message;

    // Context
    if (this.options.includeContext && Object.keys(entry.context).length > 0) {
      const contextStr = Object.entries(entry.context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      output += ` [${contextStr}]`;
    }

    // Metadata
    if (Object.keys(entry.metadata).length > 0) {
      const metadataStr = JSON.stringify(entry.metadata);
      output += ` ${metadataStr}`;
    }

    // Error
    if (entry.error) {
      output += `\nError: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\nStack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  getName(): string {
    return 'text';
  }

  private formatTimestamp(timestamp: Date): string {
    switch (this.options.timestampFormat) {
      case 'ISO':
        return timestamp.toISOString();
      case 'locale':
        return timestamp.toLocaleString();
      case 'time':
        return timestamp.toLocaleTimeString();
      default:
        return timestamp.toISOString();
    }
  }

  private colorizeLevel(level: string): string {
    if (!this.options.colorize) {
      return level.toUpperCase();
    }

    const colors: Record<string, string> = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      http: '\x1b[35m',  // Magenta
      verbose: '\x1b[34m', // Blue
      debug: '\x1b[32m', // Green
      silly: '\x1b[37m'  // White
    };

    const reset = '\x1b[0m';
    const color = colors[level] || colors.info;
    return `${color}${level.toUpperCase()}${reset}`;
  }
}