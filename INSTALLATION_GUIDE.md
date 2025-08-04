# Installation Guide - Winston Enterprise Logger

## Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0 or yarn >= 1.22.0

## Quick Installation

### 1. Install the Package

```bash
npm install winston-enterprise-logger
```

Or with yarn:
```bash
yarn add winston-enterprise-logger
```

### 2. Install Peer Dependencies

```bash
npm install winston reflect-metadata tsyringe uuid @types/uuid
```

### 3. Basic Setup

Create a `logger.js` file in your project:

```javascript
const { 
  initializeLogger, 
  LoggerConfiguration, 
  LogLevel 
} = require('winston-enterprise-logger');

// Basic configuration
const config = new LoggerConfiguration({
  name: 'my-app',
  level: LogLevel.INFO,
  transports: [
    { type: 'console' },
    { 
      type: 'file', 
      options: { 
        filename: 'app.log' 
      } 
    }
  ]
});

const logger = initializeLogger({ defaultConfig: config });

module.exports = logger;
```

### 4. Express.js Integration

```javascript
const express = require('express');
const { CorrelationMiddleware } = require('winston-enterprise-logger');
const logger = require('./logger');

const app = express();

// Add correlation middleware (IMPORTANT: Add this FIRST!)
const correlationMiddleware = new CorrelationMiddleware();
app.use(correlationMiddleware.middleware());

// Your routes
app.get('/api/test', (req, res) => {
  logger.info('Test endpoint called');
  res.json({ message: 'Hello World' });
});

app.listen(3000, () => {
  logger.info('Server started on port 3000');
});
```

## Detailed Installation Options

### For TypeScript Projects

```bash
npm install winston-enterprise-logger @types/node
```

Create `logger.ts`:

```typescript
import { 
  initializeLogger, 
  LoggerConfiguration, 
  LogLevel,
  ILogger 
} from 'winston-enterprise-logger';

const config = new LoggerConfiguration({
  name: 'my-typescript-app',
  level: LogLevel.DEBUG,
  transports: [
    { type: 'console' },
    { 
      type: 'file', 
      options: { 
        filename: 'app.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      } 
    }
  ]
});

export const logger: ILogger = initializeLogger({ defaultConfig: config });
```

### With Database Logging

#### MongoDB Setup

```bash
npm install mongodb
```

```javascript
const config = new LoggerConfiguration({
  name: 'my-app',
  level: LogLevel.INFO,
  transports: [
    { type: 'console' },
    {
      type: 'mongodb',
      options: {
        connectionString: 'mongodb://localhost:27017/logs',
        collection: 'application_logs',
        level: 'info'
      }
    }
  ]
});
```

#### MySQL Setup

```bash
npm install mysql2
```

```javascript
const config = new LoggerConfiguration({
  name: 'my-app',
  level: LogLevel.INFO,
  transports: [
    { type: 'console' },
    {
      type: 'mysql',
      options: {
        host: 'localhost',
        user: 'logger',
        password: 'password',
        database: 'logs',
        table: 'application_logs'
      }
    }
  ]
});
```

### Environment-Based Configuration

Create a `.env` file:

```env
LOG_LEVEL=debug
LOG_NAME=my-application
LOG_MONGODB_CONNECTION=mongodb://localhost:27017/logs
LOG_MONGODB_COLLECTION=app_logs
LOG_FILE_FILENAME=application.log
LOG_FILE_MAX_SIZE=5242880
LOG_FILE_MAX_FILES=5
```

```javascript
require('dotenv').config();

const logger = initializeLogger({
  configProvider: 'environment',
  envPrefix: 'LOG_'
});
```

### File-Based Configuration

Create `config/logging.json`:

```json
{
  "name": "my-application",
  "level": "info",
  "transports": [
    {
      "type": "console",
      "level": "debug"
    },
    {
      "type": "file",
      "options": {
        "filename": "logs/application.log",
        "maxsize": 5242880,
        "maxFiles": 5
      }
    }
  ],
  "format": {
    "type": "json"
  }
}
```

```javascript
const logger = initializeLogger({
  configProvider: 'file',
  configPath: './config/logging.json'
});
```

## Framework Integration Examples

### Express.js with Full Features

```javascript
const express = require('express');
const { 
  CorrelationMiddleware,
  LoggingMiddleware,
  initializeLogger,
  LoggerConfiguration,
  LogLevel
} = require('winston-enterprise-logger');

const app = express();

// Configure logger
const config = new LoggerConfiguration({
  name: 'express-app',
  level: LogLevel.INFO,
  transports: [
    { type: 'console' },
    { 
      type: 'mongodb', 
      options: { 
        connectionString: process.env.MONGODB_CONNECTION,
        collection: 'request_logs'
      }
    }
  ]
});

const logger = initializeLogger({ defaultConfig: config });

// Middleware setup (ORDER MATTERS!)
app.use(express.json());

// 1. Correlation middleware (FIRST!)
const correlationMiddleware = new CorrelationMiddleware({
  extractUserId: (req) => req.user?.id,
  extractSessionId: (req) => req.sessionID
});
app.use(correlationMiddleware.middleware());

// 2. Request/Response logging middleware
const loggingMiddleware = new LoggingMiddleware(logger, {
  logLevel: LogLevel.INFO,
  logRequestBody: true,
  logResponseBody: false,
  skipPaths: ['/health', '/metrics']
});
app.use(loggingMiddleware.express());

// Your application routes
app.get('/api/users/:id', async (req, res) => {
  try {
    logger.info('Fetching user', { userId: req.params.id });
    
    // Your business logic here
    const user = { id: req.params.id, name: 'John Doe' };
    
    logger.info('User fetched successfully', { userId: req.params.id });
    res.json(user);
  } catch (error) {
    logger.error('Failed to fetch user', error, { userId: req.params.id });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;
```

### Fastify Integration

```javascript
const fastify = require('fastify')({ logger: false });
const { 
  CorrelationMiddleware,
  LoggingMiddleware,
  initializeLogger
} = require('winston-enterprise-logger');

const logger = initializeLogger();

// Register correlation middleware
const correlationMiddleware = new CorrelationMiddleware();
fastify.addHook('preHandler', correlationMiddleware.fastify());

// Register logging middleware
const loggingMiddleware = new LoggingMiddleware(logger);
fastify.addHook('preHandler', loggingMiddleware.fastify());

fastify.get('/api/hello', async (request, reply) => {
  logger.info('Hello endpoint called');
  return { message: 'Hello World' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    logger.info('Fastify server started on port 3000');
  } catch (err) {
    logger.error('Error starting server', err);
    process.exit(1);
  }
};

start();
```

### NestJS Integration

```typescript
// logger.module.ts
import { Module, Global } from '@nestjs/common';
import { 
  initializeLogger, 
  LoggerConfiguration, 
  LogLevel,
  ILogger 
} from 'winston-enterprise-logger';

const loggerProvider = {
  provide: 'LOGGER',
  useFactory: (): ILogger => {
    const config = new LoggerConfiguration({
      name: 'nestjs-app',
      level: LogLevel.INFO,
      transports: [
        { type: 'console' },
        { type: 'file', options: { filename: 'nestjs-app.log' } }
      ]
    });
    
    return initializeLogger({ defaultConfig: config });
  },
};

@Global()
@Module({
  providers: [loggerProvider],
  exports: ['LOGGER'],
})
export class LoggerModule {}
```

```typescript
// app.module.ts
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { LoggerModule } from './logger.module';
import { CorrelationMiddleware } from 'winston-enterprise-logger';

@Module({
  imports: [LoggerModule],
  // ... other modules
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    const correlationMiddleware = new CorrelationMiddleware();
    consumer.apply(correlationMiddleware.middleware()).forRoutes('*');
  }
}
```

```typescript
// user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ILogger } from 'winston-enterprise-logger';

@Injectable()
export class UserService {
  constructor(@Inject('LOGGER') private readonly logger: ILogger) {}

  async findUser(id: string) {
    this.logger.info('Finding user', { userId: id });
    
    // Your business logic
    const user = await this.userRepository.findById(id);
    
    this.logger.info('User found', { userId: id, found: !!user });
    return user;
  }
}
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV LOG_FILE_FILENAME=/app/logs/application.log

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

USER node

CMD ["node", "index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LOG_LEVEL=info
      - LOG_MONGODB_CONNECTION=mongodb://mongo:27017/logs
      - LOG_MONGODB_COLLECTION=application_logs
    volumes:
      - ./logs:/app/logs
    depends_on:
      - mongo
    networks:
      - app-network

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```

## Production Considerations

### 1. Log Rotation

```javascript
const config = new LoggerConfiguration({
  transports: [
    {
      type: 'file',
      options: {
        filename: 'application.log',
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        tailable: true,
        zippedArchive: true
      }
    }
  ]
});
```

### 2. Performance Optimization

```javascript
// Use appropriate log levels in production
const config = new LoggerConfiguration({
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  // Disable console logging in production
  transports: process.env.NODE_ENV === 'production' 
    ? [{ type: 'file', options: { filename: 'app.log' } }]
    : [{ type: 'console' }, { type: 'file', options: { filename: 'app.log' } }]
});
```

### 3. Error Handling

```javascript
// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await logger.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', new Error(reason), { promise });
});
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'reflect-metadata'"**
   ```bash
   npm install reflect-metadata
   ```

2. **"Decorators are not valid here"**
   - Ensure TypeScript decorators are enabled in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true
     }
   }
   ```

3. **MongoDB connection issues**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure database permissions

4. **Correlation ID not working**
   - Ensure CorrelationMiddleware is applied BEFORE other middleware
   - Check AsyncLocalStorage support (Node.js >= 12.17.0)

### Debugging

Enable debug logging:

```javascript
const config = new LoggerConfiguration({
  level: LogLevel.DEBUG,
  transports: [{ type: 'console' }]
});

const logger = initializeLogger({ defaultConfig: config });

// Test correlation tracking
logger.info('Testing correlation', { test: true });
console.log('Correlation ID:', CorrelationMiddleware.getCorrelationId());
```

## Next Steps

1. ✅ Install the package
2. ✅ Configure basic logging  
3. ✅ Add correlation middleware
4. ⬜ Set up database logging
5. ⬜ Configure log rotation
6. ⬜ Set up monitoring and alerting
7. ⬜ Implement decorators for automatic logging
8. ⬜ Configure production optimizations

For more detailed examples and advanced usage, see the [README.md](README.md) file.
