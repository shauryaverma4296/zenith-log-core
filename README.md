# Zenith Log Core

A comprehensive Winston logger wrapper built with TypeScript, following SOLID principles, onion architecture, and port & adapter pattern. Designed for enterprise-grade applications with dependency injection using TSyringe.

## Features

- 🏗️ **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- 🧅 **Onion Architecture**: Domain-driven design with clear separation of concerns
- 🔌 **Port & Adapter Pattern**: Pluggable transport and configuration systems
- 💉 **Dependency Injection**: Full IoC container support with TSyringe
- 📝 **Structured Logging**: JSON, text, and custom formatters
- 🔧 **Configurable**: File, environment, and custom configuration providers
- 🚀 **Performance**: Built-in performance monitoring and metrics
- 🎯 **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🧪 **Testable**: Mockable interfaces and comprehensive test utilities

## Installation

```bash
npm install zenith-log-core
# or
yarn add zenith-log-core
```

## Quick Start

### Basic Usage

```typescript
import { initializeLogger, LogLevel } from 'zenith-log-core';

// Initialize with default configuration
const logger = initializeLogger();

logger.info('Hello, World!');
logger.error('Something went wrong', new Error('Demo error'));
logger.debug('Debug information', { userId: '123', action: 'login' });
```

### With Custom Configuration

```typescript
import { 
  initializeLogger, 
  LoggerConfiguration, 
  LogLevel 
} from 'zenith-log-core';

const config = new LoggerConfiguration({
  name: 'my-app',
  level: LogLevel.DEBUG,
  transports: [
    { type: 'console', level: LogLevel.INFO },
    { 
      type: 'file', 
      options: { 
        filename: 'app.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }
    }
  ],
  format: { type: 'structured' }
});

const logger = initializeLogger({ defaultConfig: config });
```

### Using Decorators

```typescript
import { Logged, LogMethodCalls } from 'zenith-log-core';

class UserService {
  @Logged({ logArgs: true, logResult: true })
  async createUser(userData: any) {
    // Method implementation
    return { id: '123', ...userData };
  }

  @LogMethodCalls()
  async deleteUser(userId: string) {
    // Method implementation
  }
}
```

### Express Middleware

```typescript
import express from 'express';
import { LoggingMiddleware, initializeLogger } from 'zenith-log-core';

const app = express();
const logger = initializeLogger();
const loggingMiddleware = new LoggingMiddleware(logger, {
  logRequestBody: true,
  logResponseBody: false,
  skipPaths: ['/health', '/metrics']
});

app.use(loggingMiddleware.express());
```

## Architecture

### Domain Layer (Core)
- **Entities**: `LogEntry`, `LoggerConfiguration`
- **Enums**: `LogLevel`
- **Interfaces**: `ILogger`, `ILoggerFactory`, `IConfigurationProvider`, `ILogFormatter`

### Application Layer
- **Services**: `LoggerService`, `ConfigurationService`
- **Use Cases**: `CreateLoggerUseCase`, `ConfigureLoggerUseCase`

### Infrastructure Layer
- **Adapters**: Winston implementation, file/environment configuration
- **Factories**: Logger factory implementations
- **Formatters**: JSON, text, structured formatters

### Presentation Layer
- **Decorators**: Method logging decorators
- **Middleware**: Framework-specific logging middleware

## Configuration

### Environment Variables

```bash
LOG_LEVEL=debug
LOG_NAME=my-app
LOG_SILENT=false
LOG_TRANSPORTS='[{"type":"console"},{"type":"file","options":{"filename":"app.log"}}]'
LOG_FORMAT=structured
LOG_METADATA='{"service":"api","version":"1.0.0"}'
```

### File Configuration

Create a `logger.config.json` file:

```json
{
  "default": {
    "name": "my-app",
    "level": "info",
    "transports": [
      { "type": "console" },
      { 
        "type": "file",
        "options": { 
          "filename": "app.log",
          "maxsize": 5242880,
          "maxFiles": 5
        }
      }
    ],
    "format": { "type": "json" },
    "defaultMetadata": {
      "service": "my-service",
      "version": "1.0.0"
    }
  }
}
```

## Advanced Usage

### Custom Configuration Provider

```typescript
import { IConfigurationProvider, LoggerConfiguration } from 'zenith-log-core';

class DatabaseConfigurationProvider implements IConfigurationProvider {
  async getConfiguration(name?: string): Promise<LoggerConfiguration> {
    // Load configuration from database
    const config = await this.loadFromDatabase(name);
    return new LoggerConfiguration(config);
  }

  async setConfiguration(config: LoggerConfiguration): Promise<void> {
    // Save configuration to database
    await this.saveToDatabase(config);
  }

  // ... implement other methods
}
```

### Child Loggers with Context

```typescript
const logger = initializeLogger();

// Create child logger with context
const requestLogger = logger.child({ 
  requestId: 'req-123', 
  userId: 'user-456' 
});

requestLogger.info('Processing request'); 
// Logs with requestId and userId automatically included
```

### Performance Monitoring

```typescript
import { Logged } from 'zenith-log-core';

class DataService {
  @Logged({ 
    logExecutionTime: true,
    logArgs: false,
    logResult: false 
  })
  async heavyOperation(data: any) {
    // Long running operation
    await this.processData(data);
  }
}
```

## Testing

The package includes comprehensive test utilities:

```typescript
import { createMockLogger } from 'zenith-log-core/testing';

describe('MyService', () => {
  it('should log errors', () => {
    const mockLogger = createMockLogger();
    const service = new MyService(mockLogger);
    
    service.doSomething();
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Something failed',
      expect.any(Error)
    );
  });
});
```

## API Reference

### Core Interfaces

#### ILogger
```typescript
interface ILogger {
  error(message: string, metadata?: LogMetadata, context?: LogContext): void;
  warn(message: string, metadata?: LogMetadata, context?: LogContext): void;
  info(message: string, metadata?: LogMetadata, context?: LogContext): void;
  debug(message: string, metadata?: LogMetadata, context?: LogContext): void;
  log(level: LogLevel, message: string, metadata?: LogMetadata, context?: LogContext): void;
  child(context: LogContext): ILogger;
  isLevelEnabled(level: LogLevel): boolean;
  close(): Promise<void>;
}
```

#### LoggerConfiguration
```typescript
class LoggerConfiguration {
  constructor(config: {
    name?: string;
    level?: LogLevel;
    transports?: TransportConfiguration[];
    format?: FormatterConfiguration;
    silent?: boolean;
    exitOnError?: boolean;
    handleExceptions?: boolean;
    handleRejections?: boolean;
    defaultMetadata?: Record<string, any>;
  });
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.