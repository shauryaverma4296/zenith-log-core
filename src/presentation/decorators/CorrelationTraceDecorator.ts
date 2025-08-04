import { TraceCorrelationUseCase } from '../../application/use-cases/TraceCorrelationUseCase';

export interface TraceOptions {
  correlationIdKey?: string;
  includeArgs?: boolean;
  includeResult?: boolean;
  logLevel?: 'debug' | 'info';
}

export function Trace(options: TraceOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      // Try to extract correlation ID from various sources
      const correlationId = extractCorrelationId(args, options.correlationIdKey) || generateCorrelationId();
      
      // Get trace service (assuming it's available in DI container)
      const traceService = getTraceService();
      
      if (!traceService) {
        return method.apply(this, args);
      }

      const startTime = Date.now();
      
      try {
        // Log method start
        const metadata = options.includeArgs ? { args } : {};
        traceService.startTrace(correlationId, propertyName, className, metadata);

        // Execute the method
        const result = await method.apply(this, args);
        
        // Log method completion
        const duration = Date.now() - startTime;
        const resultMetadata = options.includeResult ? { result } : {};
        traceService.endTrace(correlationId, propertyName, resultMetadata, undefined, duration);

        return result;
      } catch (error) {
        // Log method error
        const duration = Date.now() - startTime;
        traceService.endTrace(correlationId, propertyName, undefined, error as Error, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

function extractCorrelationId(args: any[], key?: string): string | null {
  if (!args || args.length === 0) return null;

  // Look for correlation ID in first argument if it's an object
  const firstArg = args[0];
  if (typeof firstArg === 'object' && firstArg !== null) {
    const correlationKey = key || 'correlationId';
    if (correlationKey in firstArg) {
      return firstArg[correlationKey];
    }
    
    // Also check common patterns
    const commonKeys = ['correlationId', 'requestId', 'traceId', 'id'];
    for (const commonKey of commonKeys) {
      if (commonKey in firstArg) {
        return firstArg[commonKey];
      }
    }
  }

  return null;
}

function generateCorrelationId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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