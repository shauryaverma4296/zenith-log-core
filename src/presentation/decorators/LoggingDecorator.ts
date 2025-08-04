import 'reflect-metadata';
import { container } from 'tsyringe';
import { ILogger } from '../../domain/interfaces/ILogger';
import { LogLevel } from '../../domain/enums/LogLevel';

export interface LoggingOptions {
  level?: LogLevel;
  logArgs?: boolean;
  logResult?: boolean;
  logExecutionTime?: boolean;
  excludeArgs?: number[];
  customMessage?: string;
  contextKey?: string;
}

export function Logged(options: LoggingOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    
    descriptor.value = async function (...args: any[]) {
      const logger = container.resolve<ILogger>('ILogger');
      const level = options.level || LogLevel.INFO;
      const startTime = Date.now();
      
      const context = {
        class: className,
        method: propertyName,
        ...(options.contextKey ? { [options.contextKey]: args[0] } : {})
      };

      const baseMessage = options.customMessage || `${className}.${propertyName}`;

      try {
        // Log method entry
        const entryMetadata: any = {};
        if (options.logArgs) {
          entryMetadata.args = options.excludeArgs 
            ? args.filter((_, index) => !options.excludeArgs!.includes(index))
            : args;
        }

        logger.log(level, `${baseMessage} - Entry`, entryMetadata, context);

        // Execute the original method
        const result = await method.apply(this, args);

        // Log method exit
        const exitMetadata: any = {};
        if (options.logExecutionTime) {
          exitMetadata.executionTime = Date.now() - startTime;
        }
        if (options.logResult && result !== undefined) {
          exitMetadata.result = result;
        }

        logger.log(level, `${baseMessage} - Exit`, exitMetadata, context);

        return result;
      } catch (error) {
        // Log method error
        const errorMetadata: any = {};
        if (options.logExecutionTime) {
          errorMetadata.executionTime = Date.now() - startTime;
        }

        logger.error(`${baseMessage} - Error`, error as Error, errorMetadata, context);
        throw error;
      }
    };

    return descriptor;
  };
}

export function LogExecutionTime(level: LogLevel = LogLevel.INFO) {
  return Logged({ 
    level, 
    logExecutionTime: true, 
    logArgs: false, 
    logResult: false 
  });
}

export function LogMethodCalls(level: LogLevel = LogLevel.DEBUG) {
  return Logged({ 
    level, 
    logArgs: true, 
    logResult: true, 
    logExecutionTime: true 
  });
}