/**
 * Structured log formatter implementation for ELK stack compatibility
 */
export class StructuredLogFormatter {
  /**
   * @param {Object} options - Formatter options
   * @param {string} [options.serviceName] - Service name
   * @param {string} [options.version] - Service version
   * @param {string} [options.environment] - Environment name
   * @param {boolean} [options.includeStackTrace] - Include stack traces
   */
  constructor(options = {}) {
    this.options = {
      serviceName: options.serviceName || 'unknown',
      version: options.version || '1.0.0',
      environment: options.environment || process.env.NODE_ENV || 'development',
      includeStackTrace: options.includeStackTrace !== false
    };
  }

  /**
   * Format log entry as structured JSON
   * @param {import('../../domain/entities/LogEntry.js').LogEntry} entry - Log entry to format
   * @returns {string} Formatted log string
   */
  format(entry) {
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
      structuredLog.error = {
        type: entry.error.name,
        message: entry.error.message
      };

      if (this.options.includeStackTrace && entry.error.stack) {
        structuredLog.error.stack_trace = entry.error.stack;
      }
    }

    // Add request context if available
    if (entry.context.requestId) {
      structuredLog.trace = {
        id: entry.context.requestId
      };
    }

    if (entry.context.userId) {
      structuredLog.user = {
        id: entry.context.userId
      };
    }

    // Add performance metrics if available
    if (entry.metadata.duration) {
      structuredLog.performance = {
        duration_ms: entry.metadata.duration
      };
    }

    return JSON.stringify(structuredLog);
  }

  getName() {
    return 'structured';
  }
}