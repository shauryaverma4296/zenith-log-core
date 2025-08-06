/**
 * Text log formatter implementation
 */
export class TextLogFormatter {
  /**
   * @param {Object} options - Formatter options
   * @param {boolean} [options.colorize] - Enable color output
   * @param {boolean} [options.includeTimestamp] - Include timestamp in output
   * @param {'iso'|'locale'|'time'} [options.timestampFormat] - Timestamp format
   * @param {boolean} [options.includeContext] - Include context in output
   */
  constructor(options = {}) {
    this.options = {
      colorize: options.colorize !== false,
      includeTimestamp: options.includeTimestamp !== false,
      timestampFormat: options.timestampFormat || 'iso',
      includeContext: options.includeContext !== false
    };
  }

  /**
   * Format log entry as text string
   * @param {import('../../domain/entities/LogEntry.js').LogEntry} entry - Log entry to format
   * @returns {string} Formatted log string
   */
  format(entry) {
    let output = '';

    // Add timestamp
    if (this.options.includeTimestamp) {
      output += `[${this.formatTimestamp(entry.timestamp)}] `;
    }

    // Add level
    const level = this.options.colorize ? this.colorizeLevel(entry.level) : entry.level.toUpperCase();
    output += `${level}: `;

    // Add message
    output += entry.message;

    // Add context
    if (this.options.includeContext && Object.keys(entry.context).length > 0) {
      output += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    // Add metadata
    if (Object.keys(entry.metadata).length > 0) {
      output += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
    }

    // Add error details
    if (entry.error) {
      output += ` | Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\nStack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  getName() {
    return 'text';
  }

  /**
   * Format timestamp according to configured format
   * @private
   */
  formatTimestamp(timestamp) {
    switch (this.options.timestampFormat) {
      case 'iso':
        return timestamp.toISOString();
      case 'locale':
        return timestamp.toLocaleString();
      case 'time':
        return timestamp.toLocaleTimeString();
      default:
        return timestamp.toISOString();
    }
  }

  /**
   * Apply colors to log level
   * @private
   */
  colorizeLevel(level) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      http: '\x1b[35m',  // Magenta
      verbose: '\x1b[37m', // White
      debug: '\x1b[32m', // Green
      silly: '\x1b[90m'  // Grey
    };
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    return `${color}${level.toUpperCase()}${reset}`;
  }
}