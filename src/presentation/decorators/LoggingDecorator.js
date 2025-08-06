import 'reflect-metadata';
import { container } from 'tsyringe';
import { LogLevel } from '../../domain/enums/LogLevel.js';

/**
 * @typedef {Object} LoggingOptions
 * @property {string} [level] - Log level
 * @property {boolean} [logArgs] - Log function arguments
 * @property {boolean} [logResult] - Log function result
 * @property {boolean} [logExecutionTime] - Log execution time
 * @property {number[]} [excludeArgs] - Argument indices to exclude from logging
 * @property {string} [customMessage] - Custom log message
 * @property {string} [contextKey] - Context key for first argument
 */

/**
 * Logging decorator for methods
 * @param {LoggingOptions} options - Logging options
 * @returns {Function} Decorator function
 */
export function Logged(options = {}) {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    
    descriptor.value = async function (...args) {
      const logger = container.resolve('ILogger');
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
        const entryMetadata = {};
        if (options.logArgs) {
          entryMetadata.args = options.excludeArgs 
            ? args.filter((_, index) => !options.excludeArgs.includes(index))
            : args;
        }

        logger.log(level, `${baseMessage} - Entry`, entryMetadata, context);

        // Execute the original method
        const result = await method.apply(this, args);

        // Log method exit
        const exitMetadata = {};
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
        const errorMetadata = {};
        if (options.logExecutionTime) {
          errorMetadata.executionTime = Date.now() - startTime;
        }

        logger.error(`${baseMessage} - Error`, error, errorMetadata, context);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Log execution time decorator
 * @param {string} level - Log level
 * @returns {Function} Decorator function
 */
export function LogExecutionTime(level = LogLevel.INFO) {
  return Logged({ 
    level, 
    logExecutionTime: true, 
    logArgs: false, 
    logResult: false 
  });
}

/**
 * Log method calls decorator
 * @param {string} level - Log level
 * @returns {Function} Decorator function
 */
export function LogMethodCalls(level = LogLevel.DEBUG) {
  return Logged({ 
    level, 
    logArgs: true, 
    logResult: true, 
    logExecutionTime: true 
  });
}