# Logger Usage Guide

A comprehensive guide covering all use cases of the advanced logging system with correlation tracking, method tracing, and multiple transport support.

## Table of Contents
- [Quick Start](#quick-start)
- [Basic Logging](#basic-logging)
- [Configuration](#configuration)
- [Correlation Tracking](#correlation-tracking)
- [Method Tracing with Decorators](#method-tracing-with-decorators)
- [Transport Options](#transport-options)
- [Child Loggers](#child-loggers)
- [Express Middleware Integration](#express-middleware-integration)
- [Advanced Use Cases](#advanced-use-cases)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

## Quick Start

### Installation & Basic Setup

```typescript
import { initializeLogger, LoggerConfiguration, LogLevel } from './src/index';

// Initialize with default configuration
const logger = initializeLogger();

// Basic logging
logger.info('Application started');
logger.error('Something went wrong', new Error('Sample error'));
```

## Basic Logging

### Standard Log Levels

```typescript
// All log levels available
logger.error('Critical error occurred');
logger.warn('Warning message');
logger.info('Information message');
logger.http('HTTP request logged');
logger.verbose('Verbose output');
logger.debug('Debug information');
logger.silly('Very detailed debug info');

// Generic log method
logger.log(LogLevel.INFO, 'Custom level logging');
```

### Logging with Metadata and Context

```typescript
// With metadata
logger.info('User action', { 
  userId: '123', 
  action: 'login',
  timestamp: Date.now()
});

// With context
logger.info('Request processed', {}, { 
  requestId: 'req-456',
  sessionId: 'sess-789'
});

// With both metadata and context
logger.info('Transaction completed', 
  { amount: 100, currency: 'USD' },
  { userId: '123', requestId: 'req-456' }
);
```

### Error Logging

```typescript
try {
  // Some operation
} catch (error) {
  // Log error with context
  logger.error('Operation failed', error, 
    { operation: 'processPayment' },
    { userId: '123', requestId: 'req-456' }
  );
}
```

## Configuration

### Basic Configuration

```typescript
import { ContainerConfig, LoggerConfiguration, LogLevel } from './src/index';

// Configure the container
ContainerConfig.configure({
  defaultConfig: new LoggerConfiguration({
    name: 'my-app',
    level: LogLevel.INFO,
    transports: [
      { type: 'console' },
      { type: 'file', options: { filename: 'app.log' } }
    ]
  })
});
```

### Transport Configurations

```typescript
// Console transport
{ type: 'console' }

// File transport
{ 
  type: 'file', 
  options: { 
    filename: 'logs/app.log',
    maxSize: '10m',
    maxFiles: 5
  }
}

// HTTP transport
{
  type: 'http',
  options: {
    host: 'localhost',
    port: 3000,
    path: '/logs'
  }
}

// MongoDB transport
{
  type: 'mongodb',
  options: {
    connectionString: 'mongodb://localhost:27017/logs',
    collection: 'app_logs'
  }
}

// MySQL transport
{
  type: 'mysql',
  options: {
    host: 'localhost',
    user: 'logger',
    password: 'password',
    database: 'logs',
    table: 'log_entries'
  }
}
```

### Environment-based Configuration

```typescript
// Using environment variables
ContainerConfig.configure({
  configProvider: 'environment',
  envPrefix: 'LOGGER_'
});

// Set environment variables:
// LOGGER_LEVEL=debug
// LOGGER_TRANSPORTS=console,file
```

### File-based Configuration

```typescript
// Using configuration file
ContainerConfig.configure({
  configProvider: 'file',
  configPath: './config/logger.json'
});
```

Example `logger.json`:
```json
{
  "name": "my-app",
  "level": "info",
  "transports": [
    { "type": "console" },
    { 
      "type": "file", 
      "options": { "filename": "app.log" }
    }
  ]
}
```

## Correlation Tracking

### Express Middleware Setup

```typescript
import express from 'express';
import { CorrelationMiddleware } from './src/presentation/middleware/CorrelationMiddleware';

const app = express();

// Setup correlation middleware
const correlationMiddleware = new CorrelationMiddleware({
  generateCorrelationId: () => `req-${Date.now()}-${Math.random()}`,
  generateRequestId: () => `request-${Date.now()}`,
  headerName: 'x-correlation-id',
  requestIdHeader: 'x-request-id',
  skipPaths: ['/health', '/metrics']
});

app.use(correlationMiddleware.middleware());
```

### Using Correlation Context

```typescript
// Access correlation ID anywhere in your application
const correlationId = CorrelationMiddleware.getCorrelationId();
const requestId = CorrelationMiddleware.getRequestId();

// Add metadata to current correlation context
CorrelationMiddleware.setMetadata({ userId: '123', operation: 'checkout' });

// Get full context
const context = CorrelationMiddleware.getContext();
```

### Manual Correlation Tracking

```typescript
import { TraceCorrelationUseCase } from './src/application/use-cases/TraceCorrelationUseCase';

const traceService = ContainerConfig.traceCorrelationUseCase();

// Log correlation steps
traceService.logStep('Starting payment process', { amount: 100 });
traceService.logStep('Validating payment details');
traceService.logStep('Processing with payment gateway');

// Get traces for correlation ID
const traces = traceService.getTracesByCorrelationId('correlation-123');
```

## Method Tracing with Decorators

### Basic Method Tracing

```typescript
import { Trace } from './src/presentation/decorators/CorrelationTraceDecorator';

class UserService {
  @Trace()
  async getUserById(id: string) {
    // Method implementation
    return { id, name: 'John Doe' };
  }

  @Trace({ includeArgs: true })
  async updateUser(id: string, data: any) {
    // Method implementation
    return { id, ...data };
  }

  @Trace({ includeResult: true })
  async createUser(userData: any) {
    // Method implementation
    return { id: 'new-id', ...userData };
  }

  @Trace({ includeArgs: true, includeResult: true, logLevel: 'info' })
  async deleteUser(id: string) {
    // Method implementation
    return { deleted: true };
  }
}
```

### Class-level Tracing

```typescript
class OrderService {
  @Trace({ includeArgs: true, includeResult: true })
  async processOrder(orderData: any) {
    const validated = await this.validateOrder(orderData);
    const saved = await this.saveOrder(validated);
    await this.sendNotification(saved);
    return saved;
  }

  @Trace()
  private async validateOrder(data: any) {
    // Validation logic
    return { ...data, validated: true };
  }

  @Trace()
  private async saveOrder(data: any) {
    // Database save logic
    return { ...data, id: 'order-123' };
  }

  @Trace()
  private async sendNotification(order: any) {
    // Notification logic
    return { sent: true };
  }
}
```

## Transport Options

### Console Transport

```typescript
// Basic console logging
{
  type: 'console'
}

// With custom format
{
  type: 'console',
  options: {
    format: 'json' // or 'simple'
  }
}
```

### File Transport

```typescript
{
  type: 'file',
  options: {
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    compression: 'gzip'
  }
}
```

### Database Transports

```typescript
// MongoDB
{
  type: 'mongodb',
  options: {
    connectionString: 'mongodb://localhost:27017/myapp',
    collection: 'logs',
    cappedMax: 100000
  }
}

// MySQL
{
  type: 'mysql',
  options: {
    host: 'localhost',
    user: 'app_user',
    password: 'password',
    database: 'application_logs',
    table: 'log_entries'
  }
}
```

### HTTP Transport

```typescript
{
  type: 'http',
  options: {
    host: 'log-aggregator.company.com',
    port: 443,
    path: '/api/logs',
    ssl: true,
    auth: {
      username: 'logger',
      password: 'secret'
    }
  }
}
```

## Child Loggers

### Creating Child Loggers

```typescript
// Create child logger with additional context
const userLogger = logger.child({ 
  userId: '123',
  module: 'user-service'
});

// Child logger inherits parent context and adds its own
userLogger.info('User action performed', { action: 'login' });
// Output includes both userId and action in context

// Nested child loggers
const requestLogger = userLogger.child({ 
  requestId: 'req-456'
});

requestLogger.debug('Processing request');
// Output includes userId, module, and requestId
```

### Service-specific Loggers

```typescript
class DatabaseService {
  private logger = ContainerConfig.getLogger('database');

  async connect() {
    this.logger.info('Connecting to database');
  }

  async query(sql: string) {
    const queryLogger = this.logger.child({ query: sql });
    queryLogger.debug('Executing query');
    // Execute query
    queryLogger.info('Query completed');
  }
}
```

## Express Middleware Integration

### Complete Express Setup

```typescript
import express from 'express';
import { CorrelationMiddleware, LoggingMiddleware } from './src/presentation';

const app = express();

// Correlation tracking
const correlationMiddleware = new CorrelationMiddleware();
app.use(correlationMiddleware.middleware());

// Request/response logging
const loggingMiddleware = new LoggingMiddleware({
  logRequests: true,
  logResponses: true,
  skipPaths: ['/health']
});
app.use(loggingMiddleware.middleware());

// Your routes
app.get('/api/users/:id', async (req, res) => {
  const logger = ContainerConfig.getLogger();
  logger.info('Fetching user', { userId: req.params.id });
  
  // Business logic
  res.json({ id: req.params.id, name: 'John' });
});
```

### Custom Middleware

```typescript
function customLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const logger = ContainerConfig.getLogger().child({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });

  logger.info('Request started');

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      statusCode: res.statusCode,
      duration
    });
  });

  next();
}
```

## Advanced Use Cases

### Structured Logging

```typescript
import { StructuredLogFormatter } from './src/infrastructure/formatters/StructuredLogFormatter';

// Configure structured logging
const logger = initializeLogger({
  defaultConfig: new LoggerConfiguration({
    formatter: new StructuredLogFormatter({
      serviceName: 'my-service',
      version: '1.0.0',
      environment: 'production'
    })
  })
});
```

### Performance Monitoring

```typescript
class PerformanceService {
  @Trace({ includeResult: true })
  async heavyOperation(data: any) {
    const start = Date.now();
    
    try {
      const result = await this.processData(data);
      const duration = Date.now() - start;
      
      logger.info('Operation completed', {
        operation: 'heavyOperation',
        duration,
        dataSize: data.length
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Operation failed', error, {
        operation: 'heavyOperation',
        duration,
        dataSize: data.length
      });
      throw error;
    }
  }
}
```

### Multi-tenant Logging

```typescript
class TenantService {
  private getTenantLogger(tenantId: string) {
    return ContainerConfig.getLogger().child({
      tenantId,
      service: 'tenant-service'
    });
  }

  async processData(tenantId: string, data: any) {
    const logger = this.getTenantLogger(tenantId);
    logger.info('Processing tenant data', { dataType: typeof data });
    
    // Process data
    logger.info('Tenant data processed successfully');
  }
}
```

### Async Operations Tracking

```typescript
class AsyncTaskService {
  async processLongRunningTask(taskId: string) {
    const taskLogger = logger.child({ taskId, service: 'async-task' });
    
    taskLogger.info('Task started');
    
    try {
      await this.step1();
      taskLogger.info('Step 1 completed');
      
      await this.step2();
      taskLogger.info('Step 2 completed');
      
      await this.step3();
      taskLogger.info('Task completed successfully');
      
    } catch (error) {
      taskLogger.error('Task failed', error);
      throw error;
    }
  }
}
```

## Error Handling

### Comprehensive Error Logging

```typescript
class ErrorHandlingService {
  async handleOperation() {
    try {
      await this.riskyOperation();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation failed', error, {
          errorType: 'validation',
          field: error.field
        });
      } else if (error instanceof DatabaseError) {
        logger.error('Database operation failed', error, {
          errorType: 'database',
          query: error.query
        });
      } else {
        logger.error('Unexpected error', error, {
          errorType: 'unknown'
        });
      }
      
      throw error;
    }
  }
}
```

### Global Error Handler

```typescript
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error, {
    fatal: true,
    process: 'main'
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', reason, {
    fatal: false,
    promise: promise.toString()
  });
});
```

## Performance Considerations

### Log Level Management

```typescript
// Only log expensive operations at debug level
if (logger.isLevelEnabled(LogLevel.DEBUG)) {
  const expensiveData = computeExpensiveData();
  logger.debug('Debug info', { expensiveData });
}
```

### Async Logging

```typescript
// For high-throughput applications
const config = new LoggerConfiguration({
  transports: [
    {
      type: 'file',
      options: {
        filename: 'app.log',
        // Enable async writing
        stream: true
      }
    }
  ]
});
```

### Memory Management

```typescript
// Clean up traces periodically
setInterval(() => {
  const traceService = ContainerConfig.traceCorrelationUseCase();
  traceService.clearAllTraces();
}, 60000); // Clean every minute
```

## Examples Directory

Check the `examples/` directory for complete working examples:

- `examples/express-no-prop-drilling.js` - Express integration without prop drilling
- `examples/correlation-tracking.ts` - Complete correlation tracking example
- `examples/database-logging-config.ts` - Database transport configuration

## Best Practices

1. **Use correlation IDs** for tracking requests across services
2. **Create child loggers** for different modules/services
3. **Include relevant metadata** in all log entries
4. **Use appropriate log levels** (error for errors, info for business events, debug for troubleshooting)
5. **Implement structured logging** for better log parsing
6. **Clean up traces** in long-running applications
7. **Use method tracing** for critical business operations
8. **Configure transports** based on environment (console for dev, files/databases for production)

## Troubleshooting

### Common Issues

1. **Correlation ID not propagating**: Ensure CorrelationMiddleware is properly configured
2. **Trace decorator not working**: Check that the TraceCorrelationUseCase is properly injected
3. **Logs not appearing**: Verify log level configuration
4. **Performance issues**: Check if expensive operations are wrapped in level checks

### Debug Mode

```typescript
// Enable debug logging
const logger = initializeLogger({
  defaultConfig: new LoggerConfiguration({
    level: LogLevel.DEBUG
  })
});
```