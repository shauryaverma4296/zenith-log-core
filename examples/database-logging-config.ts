import { LoggerConfiguration } from '../src/domain/entities/LoggerConfiguration';
import { LogLevel } from '../src/domain/enums/LogLevel';
import { ContainerConfig } from '../src/container/ContainerConfig';

// MongoDB Configuration Example
const mongoConfig = new LoggerConfiguration({
  name: 'mongodb-logger',
  level: LogLevel.INFO,
  transports: [
    {
      type: 'mongodb',
      options: {
        connectionString: 'mongodb://localhost:27017/app_logs',
        collection: 'application_logs',
        // Additional MongoDB options
        tryReconnect: true,
        decolorize: true,
        leaveConnectionOpen: false
      }
    },
    {
      type: 'console',
      level: LogLevel.DEBUG
    }
  ]
});

// MySQL Configuration Example
const mysqlConfig = new LoggerConfiguration({
  name: 'mysql-logger', 
  level: LogLevel.INFO,
  transports: [
    {
      type: 'mysql',
      options: {
        host: 'localhost',
        user: 'logger_user',
        password: 'logger_password',
        database: 'application_logs',
        table: 'logs',
        // Additional MySQL options
        fields: {
          level: 'level',
          message: 'message',
          timestamp: 'timestamp',
          meta: 'metadata'
        }
      }
    },
    {
      type: 'file',
      options: {
        filename: 'application.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }
    }
  ]
});

// Multi-Database Configuration
const multiDbConfig = new LoggerConfiguration({
  name: 'multi-db-logger',
  level: LogLevel.DEBUG,
  transports: [
    // Console for development
    {
      type: 'console',
      level: LogLevel.DEBUG
    },
    // MongoDB for application logs
    {
      type: 'mongodb',
      level: LogLevel.INFO,
      options: {
        connectionString: 'mongodb://localhost:27017/app_logs',
        collection: 'application_logs'
      }
    },
    // MySQL for audit logs
    {
      type: 'mysql',
      level: LogLevel.WARN,
      options: {
        host: 'localhost',
        user: 'audit_user',
        password: 'audit_password',
        database: 'audit_logs',
        table: 'security_events'
      }
    },
    // File for error logs
    {
      type: 'file',
      level: LogLevel.ERROR,
      options: {
        filename: 'errors.log',
        maxsize: 10485760, // 10MB
        maxFiles: 10
      }
    }
  ]
});

// Initialize container with desired configuration
ContainerConfig.configure({
  defaultConfig: multiDbConfig
});

// Get logger instance
const logger = ContainerConfig.getLogger('database-example');

// Example usage
logger.info('Application started', { 
  version: '1.0.0',
  environment: 'production'
});

logger.warn('High memory usage detected', {
  memoryUsage: '85%',
  threshold: '80%'
});

logger.error('Database connection failed', new Error('Connection timeout'), {
  host: 'localhost',
  port: 5432,
  retryAttempt: 3
});

export { mongoConfig, mysqlConfig, multiDbConfig };