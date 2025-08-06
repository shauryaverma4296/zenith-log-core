import { TraceCorrelationUseCase } from '../../application/use-cases/TraceCorrelationUseCase.js';
import { CorrelationMiddleware } from '../middleware/CorrelationMiddleware.js';

/**
 * @typedef {Object} TraceOptions
 * @property {boolean} [includeArgs] - Include function arguments in trace
 * @property {boolean} [includeResult] - Include function result in trace
 * @property {'debug'|'info'} [logLevel] - Log level for trace messages
 */

/**
 * Trace decorator for correlation tracking
 * @param {TraceOptions} options - Trace options
 * @returns {Function} Decorator function
 */
export function Trace(options = {}) {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args) {
      // Get correlation ID from AsyncLocalStorage context
      const correlationId = CorrelationMiddleware.getCorrelationId();
      
      // If no correlation context, just execute without tracing
      if (!correlationId) {
        return method.apply(this, args);
      }
      
      // Get trace service
      const traceService = getTraceService();

      const startTime = Date.now();
      
      try {
        // Log method start
        const metadata = options.includeArgs ? { args } : {};
        traceService?.startTrace(propertyName, className, metadata);

        // Execute the method
        const result = await method.apply(this, args);
        
        // Log method completion
        const duration = Date.now() - startTime;
        const resultMetadata = options.includeResult ? { result } : {};
        traceService?.endTrace(propertyName, resultMetadata, undefined, duration);

        return result;
      } catch (error) {
        // Log method error
        const duration = Date.now() - startTime;
        traceService?.endTrace(propertyName, undefined, error, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Get trace service from DI container
 * @returns {TraceCorrelationUseCase|null} Trace service instance
 */
function getTraceService() {
  try {
    // In a real implementation, you would get this from your DI container
    // For now, returning null to avoid circular dependencies
    return null;
  } catch {
    return null;
  }
}