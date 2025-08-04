const express = require('express');
const { 
  CorrelationMiddleware, 
  LoggerConfiguration, 
  LogLevel, 
  ContainerConfig 
} = require('your-winston-logger-package');

const app = express();

// Configure logger with database logging
const config = new LoggerConfiguration({
  name: 'express-app',
  level: LogLevel.DEBUG,
  transports: [
    { type: 'console' },
    { 
      type: 'mongodb', 
      options: { 
        connectionString: 'mongodb://localhost:27017/app_logs',
        collection: 'request_logs'
      }
    }
  ]
});

ContainerConfig.configure({ defaultConfig: config });
const logger = ContainerConfig.getLogger();

// Setup correlation middleware
const correlationMiddleware = new CorrelationMiddleware({
  headerName: 'x-correlation-id',
  extractUserId: (req) => req.user?.id,
  extractSessionId: (req) => req.sessionID,
  skipPaths: ['/health', '/metrics'],
  includeHeaders: ['user-agent', 'authorization']
});

// Apply correlation middleware FIRST
app.use(correlationMiddleware.middleware());

// Your business logic - NO PROP DRILLING!
class UserService {
  async getUser(userId) {
    // Logger automatically includes correlation ID
    logger.info('Fetching user', { userId });
    
    // Call database
    const user = await this.findUserInDatabase(userId);
    
    // Call external service
    const profile = await this.fetchUserProfile(userId);
    
    logger.info('User fetched successfully', { userId, hasProfile: !!profile });
    return { ...user, profile };
  }

  async findUserInDatabase(userId) {
    // This log will automatically include the same correlation ID
    logger.debug('Querying database for user', { userId });
    
    // Simulate database call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.debug('Database query completed', { userId });
    return { id: userId, name: 'John Doe', email: 'john@example.com' };
  }

  async fetchUserProfile(userId) {
    // This will also automatically include correlation ID
    logger.debug('Calling external profile service', { userId });
    
    // Add some context metadata
    CorrelationMiddleware.setMetadata('external_service', 'profile-api');
    CorrelationMiddleware.setMetadata('external_call_start', Date.now());
    
    try {
      // Simulate external API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const profile = { avatar: 'avatar.jpg', bio: 'Software Engineer' };
      
      CorrelationMiddleware.setMetadata('external_call_success', true);
      logger.info('External profile fetched', { userId, profileSize: JSON.stringify(profile).length });
      
      return profile;
    } catch (error) {
      CorrelationMiddleware.setMetadata('external_call_success', false);
      logger.error('Failed to fetch external profile', error, { userId });
      return null;
    }
  }
}

class OrderService {
  async createOrder(orderData) {
    logger.info('Starting order creation', { itemCount: orderData.items?.length });
    
    // Validate order
    await this.validateOrder(orderData);
    
    // Save to database
    const order = await this.saveOrder(orderData);
    
    // Send notifications
    await this.sendOrderNotifications(order);
    
    logger.info('Order created successfully', { orderId: order.id });
    return order;
  }

  async validateOrder(orderData) {
    logger.debug('Validating order data');
    
    // Validation logic
    if (!orderData.items || orderData.items.length === 0) {
      const error = new Error('Order must have items');
      logger.error('Order validation failed', error);
      throw error;
    }
    
    // Validate with external service
    await this.validateWithInventoryService(orderData.items);
    
    logger.debug('Order validation completed');
  }

  async validateWithInventoryService(items) {
    logger.debug('Validating items with inventory service', { itemCount: items.length });
    
    // Simulate external service call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    logger.info('Inventory validation completed', { itemCount: items.length });
  }

  async saveOrder(orderData) {
    logger.debug('Saving order to database');
    
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const order = {
      id: Math.random().toString(36).substr(2, 9),
      ...orderData,
      createdAt: new Date().toISOString()
    };
    
    logger.info('Order saved to database', { orderId: order.id });
    return order;
  }

  async sendOrderNotifications(order) {
    logger.debug('Sending order notifications', { orderId: order.id });
    
    // Send email notification
    await this.sendEmailNotification(order);
    
    // Send SMS notification  
    await this.sendSMSNotification(order);
    
    logger.info('All notifications sent', { orderId: order.id });
  }

  async sendEmailNotification(order) {
    logger.debug('Sending email notification', { orderId: order.id });
    
    CorrelationMiddleware.setMetadata('notification_type', 'email');
    
    // Simulate email service
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('Email notification sent', { orderId: order.id });
  }

  async sendSMSNotification(order) {
    logger.debug('Sending SMS notification', { orderId: order.id });
    
    CorrelationMiddleware.setMetadata('notification_type', 'sms');
    
    // Simulate SMS service
    await new Promise(resolve => setTimeout(resolve, 80));
    
    logger.info('SMS notification sent', { orderId: order.id });
  }
}

// Routes - Clean and simple, no correlation ID prop drilling!
const userService = new UserService();
const orderService = new OrderService();

app.get('/api/users/:id', async (req, res) => {
  try {
    // Logger automatically includes correlation ID from middleware
    logger.info('User request received', { userId: req.params.id });
    
    const user = await userService.getUser(req.params.id);
    
    logger.info('User request completed successfully', { userId: req.params.id });
    res.json({ success: true, data: user });
    
  } catch (error) {
    logger.error('User request failed', error, { userId: req.params.id });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      correlationId: CorrelationMiddleware.getCorrelationId()
    });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    logger.info('Order creation request received');
    
    const order = await orderService.createOrder(req.body);
    
    logger.info('Order creation completed successfully', { orderId: order.id });
    res.json({ 
      success: true, 
      data: order,
      correlationId: CorrelationMiddleware.getCorrelationId()
    });
    
  } catch (error) {
    logger.error('Order creation failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      correlationId: CorrelationMiddleware.getCorrelationId()
    });
  }
});

// Health check endpoint (skipped by correlation middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to search logs by correlation ID
app.get('/api/logs/:correlationId', async (req, res) => {
  try {
    const { correlationId } = req.params;
    
    // Query your MongoDB logs collection
    // This is pseudo-code - implement based on your MongoDB setup
    const logs = await queryLogsByCorrelationId(correlationId);
    
    res.json({
      correlationId,
      logCount: logs.length,
      logs: logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    });
  } catch (error) {
    logger.error('Failed to fetch logs', error, { 
      requestedCorrelationId: req.params.correlationId 
    });
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

async function queryLogsByCorrelationId(correlationId) {
  // This would query your MongoDB collection
  // Return array of log entries with the specified correlation ID
  return [];
}

app.listen(3000, () => {
  logger.info('Server started', { port: 3000 });
  console.log('Server running on port 3000');
  console.log('Try these requests:');
  console.log('GET /api/users/123');
  console.log('POST /api/orders with body: {"items": [{"name": "Product 1"}]}');
});

module.exports = { app, userService, orderService };