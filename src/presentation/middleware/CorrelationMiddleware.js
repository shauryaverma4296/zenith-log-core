const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');
class CorrelationContextManager {
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
  }

  run(context, fn) {
    return this.asyncLocalStorage.run(context, fn);
  }

  getContext() {
    return this.asyncLocalStorage.getStore();
  }

  getCorrelationId() {
    const context = this.getContext();
    return context?.correlationId;
  }

  getRequestId() {
    const context = this.getContext();
    return context?.requestId;
  }

  getMetadata() {
    const context = this.getContext();
    return context?.metadata;
  }
}

// Singleton instance
const contextManager = new CorrelationContextManager();

class CorrelationMiddleware {
  constructor(options = {}) {
    this.options = {
      correlationIdHeader: options.correlationIdHeader || 'x-correlation-id',
      tibicoTransactionId: options.correlationIdHeader || 'transaction_id',
      requestIdHeader: options.requestIdHeader || 'x-request-id',
      generateCorrelationId: options.generateCorrelationId || (() => randomUUID()),
      generateRequestId: options.generateRequestId || (() => randomUUID()),
      skipPaths: options.skipPaths || [],
      metadataHeaders: options.metadataHeaders || [],
      metadataProps: options.metadataProps || [],
    };
    this.contextManager = contextManager;
  }

  middleware() {
    return (req, res, next) => {
      // Skip correlation for specified paths
      if (this.options.skipPaths.some(path => req.url.startsWith(path))) {
        return next();
      }

      // Extract or generate correlation ID
      const correlationId =
        req.headers[this.options.correlationIdHeader] || this.options.generateCorrelationId();

      const tibicoTransactionId =
        req.header[this.options.correlationIdHeader] || this.options.generateCorrelationId();

      // Extract or generate request ID
      const requestId =
        req.headers[this.options.requestIdHeader] || this.options.generateRequestId();

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
      res.setHeader(this.options.tibicoTransactionId, tibicoTransactionId);

      // Attach to request object for backward compatibility
      req.correlationId = correlationId;
      req.tibicoTransactionId = tibicoTransactionId;
      req.requestId = requestId;
      req.correlationContext = { correlationId, requestId, metadata };

      // Create correlation context
      const context = {
        correlationId,
        tibicoTransactionId,
        requestId,
        metadata,
      };

      // Run the rest of the request within the correlation context
      this.contextManager.run(context, () => {
        next();
      });
    };
  }
}

module.exports = { CorrelationMiddleware };
