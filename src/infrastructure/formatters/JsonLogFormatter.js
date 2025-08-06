/**
 * JSON log formatter implementation
 */
export class JsonLogFormatter {
  /**
   * @param {Object} options - Formatter options
   * @param {number} [options.space] - JSON.stringify space parameter
   * @param {boolean} [options.includeMeta] - Include metadata in output
   * @param {boolean} [options.includeContext] - Include context in output
   */
  constructor(options = {}) {
    this.options = {
      space: options.space || 0,
      includeMeta: options.includeMeta !== false,
      includeContext: options.includeContext !== false
    };
  }

  /**
   * Format log entry as JSON string
   * @param {import('../../domain/entities/LogEntry.js').LogEntry} entry - Log entry to format
   * @returns {string} Formatted log string
   */
  format(entry) {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message
    };

    if (this.options.includeMeta && Object.keys(entry.metadata).length > 0) {
      logObject.metadata = entry.metadata;
    }

    if (this.options.includeContext && Object.keys(entry.context).length > 0) {
      logObject.context = entry.context;
    }

    if (entry.error) {
      logObject.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      };
    }

    return JSON.stringify(logObject, null, this.options.space);
  }

  getName() {
    return 'json';
  }
}