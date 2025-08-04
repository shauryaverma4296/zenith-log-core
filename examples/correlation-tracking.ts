import { ContainerConfig } from '../src/container/ContainerConfig';
import { LoggerConfiguration } from '../src/domain/entities/LoggerConfiguration';
import { LogLevel } from '../src/domain/enums/LogLevel';
import { Trace } from '../src/presentation/decorators/CorrelationTraceDecorator';

// Configure container with MongoDB logging
ContainerConfig.configure({
  defaultConfig: new LoggerConfiguration({
    level: LogLevel.DEBUG,
    transports: [
      { type: 'console' },
      { 
        type: 'mongodb', 
        options: { 
          connectionString: 'mongodb://localhost:27017/app_logs',
          collection: 'correlation_logs'
        }
      }
    ]
  })
});

class OrderService {
  @Trace({ includeArgs: true, includeResult: true })
  async createOrder(orderData: { correlationId: string, items: any[] }) {
    console.log('Creating order...', orderData);
    
    // Simulate business logic
    const validatedOrder = await this.validateOrder(orderData);
    const savedOrder = await this.saveOrder(validatedOrder);
    await this.sendNotification(savedOrder);
    
    return savedOrder;
  }

  @Trace()
  private async validateOrder(orderData: any) {
    console.log('Validating order...');
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...orderData, validated: true };
  }

  @Trace()
  private async saveOrder(orderData: any) {
    console.log('Saving order to database...');
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 200));
    return { ...orderData, id: Math.random().toString() };
  }

  @Trace()
  private async sendNotification(order: any) {
    console.log('Sending notification...');
    // Simulate notification service call
    await new Promise(resolve => setTimeout(resolve, 50));
    return { sent: true };
  }
}

class PaymentService {
  @Trace({ includeArgs: true })
  async processPayment(paymentData: { correlationId: string, amount: number }) {
    console.log('Processing payment...', paymentData);
    
    await this.validatePayment(paymentData);
    const result = await this.chargeCard(paymentData);
    
    return result;
  }

  @Trace()
  private async validatePayment(paymentData: any) {
    console.log('Validating payment...');
    await new Promise(resolve => setTimeout(resolve, 150));
    return true;
  }

  @Trace()
  private async chargeCard(paymentData: any) {
    console.log('Charging card...');
    await new Promise(resolve => setTimeout(resolve, 300));
    return { transactionId: Math.random().toString(), success: true };
  }
}

// Example usage with correlation tracking
async function handleOrderRequest() {
  const correlationId = `order-${Date.now()}`;
  
  const orderService = new OrderService();
  const paymentService = new PaymentService();
  
  try {
    // All these calls will be tracked with the same correlation ID
    const order = await orderService.createOrder({
      correlationId,
      items: [{ name: 'Product 1', price: 100 }]
    });
    
    const payment = await paymentService.processPayment({
      correlationId,
      amount: 100
    });
    
    console.log('Order completed successfully', { order, payment });
    
    // Get trace for this correlation ID
    const traceService = ContainerConfig.traceCorrelationUseCase();
    const traces = traceService.getTracesByCorrelationId(correlationId);
    
    console.log('Full trace:', traces);
    
  } catch (error) {
    console.error('Order failed:', error);
  }
}

// Run example
handleOrderRequest();

export { OrderService, PaymentService };