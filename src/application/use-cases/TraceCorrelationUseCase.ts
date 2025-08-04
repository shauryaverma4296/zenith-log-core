import { injectable, inject } from 'tsyringe';
import { ILogger } from '../../domain/interfaces/ILogger';
import { LogLevel } from '../../domain/enums/LogLevel';
import { LogMetadata, LogContext } from '../../domain/entities/LogEntry';

export interface CorrelationTrace {
  correlationId: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata: LogMetadata;
  context: LogContext;
  functionName?: string;
  className?: string;
  duration?: number;
}

export class TraceCorrelationUseCase {
  private traces: Map<string, CorrelationTrace[]> = new Map();

  constructor(logger) {
    this.logger = logger;
  }

  startTrace(correlationId: string, functionName: string, className?: string, metadata?: LogMetadata): void {
    const trace: CorrelationTrace = {
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

  endTrace(correlationId: string, functionName: string, result?: any, error?: Error, duration?: number): void {
    const level = error ? LogLevel.ERROR : LogLevel.DEBUG;
    const message = error 
      ? `Error in ${functionName}: ${error.message}` 
      : `Completed ${functionName}`;

    const trace: CorrelationTrace = {
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

  logStep(correlationId: string, step: string, metadata?: LogMetadata): void {
    const trace: CorrelationTrace = {
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

  getTracesByCorrelationId(correlationId: string): CorrelationTrace[] {
    return this.traces.get(correlationId) || [];
  }

  getAllTraces(): Map<string, CorrelationTrace[]> {
    return new Map(this.traces);
  }

  clearTrace(correlationId: string): void {
    this.traces.delete(correlationId);
  }

  clearAllTraces(): void {
    this.traces.clear();
  }

  private addTrace(correlationId: string, trace: CorrelationTrace): void {
    if (!this.traces.has(correlationId)) {
      this.traces.set(correlationId, []);
    }
    this.traces.get(correlationId)!.push(trace);
  }
}