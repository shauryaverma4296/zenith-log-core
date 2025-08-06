/**
 * @typedef {Object} LogMetadata
 * @property {*} [key] - Any metadata key-value pairs
 */

/**
 * @typedef {Object} LogContext
 * @property {string} [requestId] - Request identifier
 * @property {string} [userId] - User identifier
 * @property {string} [sessionId] - Session identifier
 * @property {string} [traceId] - Trace identifier
 * @property {string} [spanId] - Span identifier
 * @property {*} [key] - Any context key-value pairs
 */

export class LogEntry {
  /**
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {LogMetadata} metadata - Log metadata
   * @param {LogContext} context - Log context
   * @param {Error} [error] - Error object
   */
  constructor(level, message, metadata = {}, context = {}, error) {
    this.timestamp = new Date();
    this.level = level;
    this.message = message;
    this.metadata = { ...metadata };
    this.context = { ...context };
    this.error = error;
  }

  toJSON() {
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