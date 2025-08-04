// JavaScript Usage Examples for Winston Logger Wrapper

// 1. Basic Setup in Node.js JavaScript Project
const { LoggerConfiguration, LogLevel, ContainerConfig } = require('your-winston-logger-package');

// Simple configuration
const config = new LoggerConfiguration({
  name: 'my-app',
  level: LogLevel.INFO,
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

// Initialize the logger
ContainerConfig.configure({ defaultConfig: config });
const logger = ContainerConfig.getLogger();

// Basic logging
logger.info('Application started', { version: '1.0.0' });
logger.warn('High memory usage', { usage: '85%' });
logger.error('Database error', new Error('Connection failed'));

// 2. Express.js Middleware Example
const express = require('express');
const { LoggingMiddleware } = require('your-winston-logger-package');

const app = express();

// Setup logging middleware
const loggingMiddleware = new LoggingMiddleware(logger, {
  logLevel: LogLevel.INFO,
  logRequestBody: true,
  logResponseBody: false,
  excludeHeaders: ['authorization', 'cookie']
});

app.use(loggingMiddleware.express());

// Your routes
app.get('/api/users', (req, res) => {
  logger.info('Fetching users', { 
    correlationId: req.headers['x-correlation-id'] 
  });
  res.json({ users: [] });
});

app.listen(3000, () => {
  logger.info('Server started on port 3000');
});

// 3. Database Logging with MongoDB
const mongoConfig = new LoggerConfiguration({
  name: 'mongo-logger',
  level: LogLevel.DEBUG,
  transports: [
    {
      type: 'mongodb',
      options: {
        connectionString: 'mongodb://localhost:27017/app_logs',
        collection: 'application_logs',
        tryReconnect: true
      }
    },
    { type: 'console' }
  ]
});

ContainerConfig.configure({ defaultConfig: mongoConfig });
const mongoLogger = ContainerConfig.getLogger('mongo-app');

// 4. Correlation ID Tracking (Manual approach for JS)
class OrderService {
  constructor(logger) {
    this.logger = logger;
  }

  async createOrder(orderData) {
    const correlationId = orderData.correlationId || this.generateCorrelationId();
    const context = { correlationId, service: 'OrderService', method: 'createOrder' };
    
    this.logger.info('Starting order creation', { orderData }, context);
    
    try {
      const validatedOrder = await this.validateOrder(orderData, correlationId);
      const savedOrder = await this.saveOrder(validatedOrder, correlationId);
      await this.sendNotification(savedOrder, correlationId);
      
      this.logger.info('Order created successfully', { orderId: savedOrder.id }, context);
      return savedOrder;
    } catch (error) {
      this.logger.error('Order creation failed', error, { orderData }, context);
      throw error;
    }
  }

  async validateOrder(orderData, correlationId) {
    const context = { correlationId, service: 'OrderService', method: 'validateOrder' };
    this.logger.debug('Validating order', { orderData }, context);
    
    // Validation logic
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.debug('Order validation completed', {}, context);
    return { ...orderData, validated: true };
  }

  async saveOrder(orderData, correlationId) {
    const context = { correlationId, service: 'OrderService', method: 'saveOrder' };
    this.logger.debug('Saving order to database', {}, context);
    
    // Database save logic
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const savedOrder = { ...orderData, id: Math.random().toString() };
    this.logger.info('Order saved to database', { orderId: savedOrder.id }, context);
    return savedOrder;
  }

  async sendNotification(order, correlationId) {
    const context = { correlationId, service: 'OrderService', method: 'sendNotification' };
    this.logger.debug('Sending notification', { orderId: order.id }, context);
    
    // Notification logic
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.logger.info('Notification sent', { orderId: order.id }, context);
  }

  generateCorrelationId() {
    return `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 5. Database Service with Correlation Tracking
class DatabaseService {
  constructor(logger) {
    this.logger = logger;
  }

  async query(sql, params, correlationId) {
    const context = { 
      correlationId, 
      service: 'DatabaseService', 
      method: 'query',
      sql: sql.substring(0, 100) + '...' // Log first 100 chars of SQL
    };
    
    const startTime = Date.now();
    this.logger.debug('Executing database query', { params }, context);
    
    try {
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
      const result = { rows: [], rowCount: 0 };
      
      const duration = Date.now() - startTime;
      this.logger.info('Database query completed', { 
        duration,
        rowCount: result.rowCount 
      }, context);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Database query failed', error, { 
        duration,
        params 
      }, context);
      throw error;
    }
  }
}

// 6. HTTP Client with Correlation Tracking
class HttpClient {
  constructor(logger) {
    this.logger = logger;
  }

  async request(url, options, correlationId) {
    const context = { 
      correlationId, 
      service: 'HttpClient', 
      method: 'request',
      url,
      httpMethod: options.method || 'GET'
    };
    
    const startTime = Date.now();
    this.logger.debug('Making HTTP request', { url, method: options.method }, context);
    
    try {
      // Add correlation ID to headers
      const headers = {
        ...options.headers,
        'X-Correlation-ID': correlationId
      };
      
      // Simulate HTTP request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      const response = { status: 200, data: {} };
      
      const duration = Date.now() - startTime;
      this.logger.info('HTTP request completed', { 
        status: response.status,
        duration 
      }, context);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('HTTP request failed', error, { 
        url,
        duration 
      }, context);
      throw error;
    }
  }
}

// 7. Complete Request Flow Example
async function handleOrderRequest(req, res) {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  
  const orderService = new OrderService(logger);
  const dbService = new DatabaseService(logger);
  const httpClient = new HttpClient(logger);
  
  logger.info('Processing order request', { 
    userId: req.user?.id,
    ip: req.ip 
  }, { correlationId });
  
  try {
    // Create order (this will log all internal steps)
    const order = await orderService.createOrder({
      ...req.body,
      correlationId
    });
    
    // Save to audit table
    await dbService.query(
      'INSERT INTO audit_log (correlation_id, action, data) VALUES (?, ?, ?)',
      [correlationId, 'ORDER_CREATED', JSON.stringify(order)],
      correlationId
    );
    
    // Call external service
    await httpClient.request(
      'https://api.inventory.com/reserve',
      {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id, items: order.items })
      },
      correlationId
    );
    
    logger.info('Order request completed successfully', { 
      orderId: order.id 
    }, { correlationId });
    
    res.json({ success: true, order, correlationId });
    
  } catch (error) {
    logger.error('Order request failed', error, {}, { correlationId });
    res.status(500).json({ 
      error: 'Order processing failed', 
      correlationId 
    });
  }
}

// 8. Search Logs by Correlation ID (if using database logging)
async function searchLogsByCorrelationId(correlationId) {
  // This would query your MongoDB or MySQL logs table
  const logs = await mongoLogger.query({
    'context.correlationId': correlationId
  });
  
  return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function generateCorrelationId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  OrderService,
  DatabaseService,
  HttpClient,
  handleOrderRequest,
  searchLogsByCorrelationId
};