import { LogLevel } from '../../domain/enums/LogLevel.js';
import { CorrelationMiddleware } from '../../presentation/middleware/CorrelationMiddleware.js';

/**
 * @typedef {Object} CorrelationTrace
 * @property {string} correlationId - Correlation identifier
 * @property {Date} timestamp - Trace timestamp
 * @property {string} level - Log level
 * @property {string} message - Trace message
 * @property {Object} metadata - Trace metadata
 * @property {Object} context - Trace context
 * @property {string} [functionName] - Function name
 * @property {string} [className] - Class name
 * @property {number} [duration] - Duration in milliseconds
 */

/**
 * Use case for trace correlation
 */
export class TraceCorrelationUseCase {
  /**
   * @param {Object} logger - Logger instance
   */
  constructor(logger) {
    this.logger = logger;
    /** @type {Map<string, CorrelationTrace[]>} */
    this.traces = new Map();
  }

  /**
   * Start a trace
   * @param {string} functionName - Function name
   * @param {string} [className] - Class name
   * @param {Object} [metadata] - Trace metadata
   */
  startTrace(functionName, className, metadata) {
    const correlationId = CorrelationMiddleware.getCorrelationId();
    if (!correlationId) {
      // If no correlation context, skip tracing
      return;
    }

    /** @type {CorrelationTrace} */
    const trace = {
      correlationId,
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message: `Starting ${className ? `${className}.` : ''}${functionName}`,
      metadata: metadata || {},
      context: { correlationId },
      functionName,
      className
    };

    this.addTrace(correlationId, trace);
    
    this.logger.debug(trace.message, trace.metadata, trace.context);
  }

  /**
   * End a trace
   * @param {string} functionName - Function name
   * @param {*} [result] - Function result
   * @param {Error} [error] - Error if any
   * @param {number} [duration] - Duration in milliseconds
   */
  endTrace(functionName, result, error, duration) {
    const correlationId = CorrelationMiddleware.getCorrelationId();
    if (!correlationId) {
      return;
    }

    const level = error ? LogLevel.ERROR : LogLevel.DEBUG;
    const message = error 
      ? `Error in ${functionName}: ${error.message}` 
      : `Completed ${functionName}`;

    /** @type {CorrelationTrace} */
    const trace = {
      correlationId,
      timestamp: new Date(),
      level,
      message,
      metadata: { result, duration },
      context: { correlationId },
      functionName,
      duration
    };

    this.addTrace(correlationId, trace);

    if (error) {
      this.logger.error(message, error, trace.metadata, trace.context);
    } else {
      this.logger.debug(message, trace.metadata, trace.context);
    }
  }

  /**
   * Log a step in the trace
   * @param {string} step - Step description
   * @param {Object} [metadata] - Step metadata
   */
  logStep(step, metadata) {
    const correlationId = CorrelationMiddleware.getCorrelationId();
    if (!correlationId) {
      return;
    }

    /** @type {CorrelationTrace} */
    const trace = {
      correlationId,
      timestamp: new Date(),
      level: LogLevel.INFO,
      message: step,
      metadata: metadata || {},
      context: { correlationId }
    };

    this.addTrace(correlationId, trace);
    this.logger.info(step, trace.metadata, trace.context);
  }

  /**
   * Get traces by correlation ID
   * @param {string} correlationId - Correlation identifier
   * @returns {CorrelationTrace[]} Array of traces
   */
  getTracesByCorrelationId(correlationId) {
    return this.traces.get(correlationId) || [];
  }

  /**
   * Get all traces
   * @returns {Map<string, CorrelationTrace[]>} All traces grouped by correlation ID
   */
  getAllTraces() {
    return new Map(this.traces);
  }

  /**
   * Clear traces for a correlation ID
   * @param {string} correlationId - Correlation identifier
   */
  clearTrace(correlationId) {
    this.traces.delete(correlationId);
  }

  /**
   * Clear all traces
   */
  clearAllTraces() {
    this.traces.clear();
  }

  /**
   * Add trace to the collection
   * @private
   * @param {string} correlationId - Correlation identifier
   * @param {CorrelationTrace} trace - Trace to add
   */
  addTrace(correlationId, trace) {
    if (!this.traces.has(correlationId)) {
      this.traces.set(correlationId, []);
    }
    this.traces.get(correlationId).push(trace);
  }
}