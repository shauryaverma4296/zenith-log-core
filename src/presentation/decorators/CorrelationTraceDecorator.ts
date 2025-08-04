import { TraceCorrelationUseCase } from '../../application/use-cases/TraceCorrelationUseCase';
import { CorrelationMiddleware } from '../middleware/CorrelationMiddleware';

export interface TraceOptions {
  includeArgs?: boolean;
  includeResult?: boolean;
  logLevel?: 'debug' | 'info';
}

export function Trace(options: TraceOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
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
        traceService.startTrace(propertyName, className, metadata);

        // Execute the method
        const result = await method.apply(this, args);
        
        // Log method completion
        const duration = Date.now() - startTime;
        const resultMetadata = options.includeResult ? { result } : {};
        traceService.endTrace(propertyName, resultMetadata, undefined, duration);

        return result;
      } catch (error) {
        // Log method error
        const duration = Date.now() - startTime;
        traceService.endTrace(propertyName, undefined, error as Error, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

// This function should be implemented to get the trace service from your DI container
function getTraceService(): TraceCorrelationUseCase | null {
  try {
    // In a real implementation, you would get this from your DI container
    // For now, returning null to avoid circular dependencies
    return null;
  } catch {
    return null;
  }
}