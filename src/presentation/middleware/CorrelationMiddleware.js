import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * @typedef {Object} Request
 * @property {string} method - HTTP method
 * @property {string} url - Request URL
 * @property {Object} headers - Request headers
 * @property {string} [correlationId] - Correlation ID
 * @property {string} [requestId] - Request ID
 * @property {Object} [correlationContext] - Correlation context
 */

/**
 * @typedef {Object} Response
 * @property {Function} setHeader - Set response header
 */

/**
 * @typedef {Function} NextFunction
 */

/**
 * @typedef {Object} CorrelationContext
 * @property {string} correlationId - Correlation identifier
 * @property {string} requestId - Request identifier
 * @property {Object} metadata - Additional metadata
 */

/**
 * Correlation context manager using AsyncLocalStorage
 */
class CorrelationContextManager {
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
  }

  /**
   * Run code within correlation context
   * @param {CorrelationContext} context - Correlation context
   * @param {Function} fn - Function to run
   * @returns {*} Function result
   */
  run(context, fn) {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get current correlation context
   * @returns {CorrelationContext|undefined} Current context
   */
  getContext() {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get correlation ID from current context
   * @returns {string|undefined} Correlation ID
   */
  getCorrelationId() {
    const context = this.getContext();
    return context?.correlationId;
  }

  /**
   * Get request ID from current context
   * @returns {string|undefined} Request ID
   */
  getRequestId() {
    const context = this.getContext();
    return context?.requestId;
  }

  /**
   * Get metadata from current context
   * @returns {Object|undefined} Metadata
   */
  getMetadata() {
    const context = this.getContext();
    return context?.metadata;
  }
}

// Singleton instance
const contextManager = new CorrelationContextManager();

/**
 * @typedef {Object} CorrelationMiddlewareOptions
 * @property {string} [correlationIdHeader] - Header name for correlation ID
 * @property {string} [requestIdHeader] - Header name for request ID
 * @property {Function} [generateCorrelationId] - Function to generate correlation ID
 * @property {Function} [generateRequestId] - Function to generate request ID
 * @property {string[]} [skipPaths] - Paths to skip correlation tracking
 * @property {string[]} [metadataHeaders] - Headers to include as metadata
 * @property {string[]} [metadataProps] - Request properties to include as metadata
 */

/**
 * Correlation middleware for Express.js
 */
export class CorrelationMiddleware {
  /**
   * @param {CorrelationMiddlewareOptions} options - Middleware options
   */
  constructor(options = {}) {
    this.options = {
      correlationIdHeader: options.correlationIdHeader || 'x-correlation-id',
      requestIdHeader: options.requestIdHeader || 'x-request-id',
      generateCorrelationId: options.generateCorrelationId || (() => randomUUID()),
      generateRequestId: options.generateRequestId || (() => randomUUID()),
      skipPaths: options.skipPaths || [],
      metadataHeaders: options.metadataHeaders || [],
      metadataProps: options.metadataProps || []
    };
    this.contextManager = contextManager;
  }

  /**
   * Express middleware function
   * @returns {Function} Express middleware
   */
  middleware() {
    return (req, res, next) => {
      // Skip correlation for specified paths
      if (this.options.skipPaths.some(path => req.url.startsWith(path))) {
        return next();
      }

      // Extract or generate correlation ID
      const correlationId = req.headers[this.options.correlationIdHeader] || 
                           this.options.generateCorrelationId();

      // Extract or generate request ID
      const requestId = req.headers[this.options.requestIdHeader] || 
                       this.options.generateRequestId();

      // Collect metadata from headers
      const metadata = {};
      this.options.metadataHeaders.forEach(header => {
        if (req.headers[header]) {
          metadata[header] = req.headers[header];
        }
      });

      // Collect metadata from request properties
      this.options.metadataProps.forEach(prop => {
        if (req[prop]) {
          metadata[prop] = req[prop];
        }
      });

      // Set response headers
      res.setHeader(this.options.correlationIdHeader, correlationId);
      res.setHeader(this.options.requestIdHeader, requestId);

      // Attach to request object for backward compatibility
      req.correlationId = correlationId;
      req.requestId = requestId;
      req.correlationContext = { correlationId, requestId, metadata };

      // Create correlation context
      const context = {
        correlationId,
        requestId,
        metadata
      };

      // Run the rest of the request within the correlation context
      this.contextManager.run(context, () => {
        next();
      });
    };
  }

  // Static methods for accessing context from anywhere
  static getCorrelationId() {
    return contextManager.getCorrelationId();
  }

  static getRequestId() {
    return contextManager.getRequestId();
  }

  static getContext() {
    return contextManager.getContext();
  }

  static getMetadata() {
    return contextManager.getMetadata();
  }
}