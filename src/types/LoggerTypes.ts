import { LogLevel } from '../domain/enums/LogLevel';
import { LogMetadata, LogContext } from '../domain/entities/LogEntry';

// Type guards
export function isLogLevel(value: any): value is LogLevel {
  return Object.values(LogLevel).includes(value);
}

export function isLogMetadata(value: any): value is LogMetadata {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isLogContext(value: any): value is LogContext {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Utility types
export type LogMethod = (message: string, metadata?: LogMetadata, context?: LogContext) => void;

export type LogMethodWithError = (
  message: string, 
  error: Error, 
  metadata?: LogMetadata, 
  context?: LogContext
) => void;

export type GenericLogMethod = (
  level: LogLevel,
  message: string,
  metadata?: LogMetadata,
  context?: LogContext
) => void;

// Configuration types
export interface LoggerModuleOptions {
  configProvider?: 'file' | 'environment';
  configPath?: string;
  envPrefix?: string;
  isGlobal?: boolean;
  autoConfiguration?: boolean;
}

// Error types
export class LoggerError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'LoggerError';
  }
}

export class ConfigurationError extends LoggerError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class TransportError extends LoggerError {
  constructor(message: string, public readonly transportType: string) {
    super(message, 'TRANSPORT_ERROR');
    this.name = 'TransportError';
  }
}

// Performance monitoring types
export interface PerformanceMetrics {
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface TimingContext {
  startTime: number;
  startCpuUsage?: NodeJS.CpuUsage;
  startMemoryUsage?: NodeJS.MemoryUsage;
}

// Structured logging types
export interface StructuredLogData {
  '@timestamp': string;
  '@version': string;
  message: string;
  level: LogLevel;
  service: {
    name: string;
    version: string;
    environment: string;
  };
  labels?: Record<string, any>;
  context?: Record<string, any>;
  error?: {
    type: string;
    message: string;
    stack_trace?: string;
  };
  trace?: {
    id: string;
    span_id?: string;
  };
  user?: {
    id: string;
  };
  performance?: {
    duration_ms: number;
  };
}

// Async logging types
export interface AsyncLogEntry {
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  context?: LogContext;
  error?: Error;
  timestamp: Date;
}

export interface BatchLogOptions {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
}