import { 
  initializeLogger, 
  LoggerConfiguration, 
  LogLevel,
  ContainerConfig 
} from '../../src/index';

describe('Logger Integration Tests', () => {
  beforeEach(() => {
    ContainerConfig.reset();
  });

  it('should initialize logger with default configuration', () => {
    const logger = initializeLogger();
    
    expect(logger).toBeDefined();
    expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(true);
  });

  it('should initialize logger with custom configuration', () => {
    const config = new LoggerConfiguration({
      name: 'test-logger',
      level: LogLevel.DEBUG,
      transports: [{ type: 'console' }]
    });

    const logger = initializeLogger({ defaultConfig: config });
    
    expect(logger).toBeDefined();
    expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(true);
  });

  it('should log messages at different levels', () => {
    const logger = initializeLogger();
    
    // These should not throw
    expect(() => {
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
    }).not.toThrow();
  });

  it('should create child loggers with context', () => {
    const logger = initializeLogger();
    const childLogger = logger.child({ requestId: '123' });
    
    expect(childLogger).toBeDefined();
    expect(() => {
      childLogger.info('Child logger message');
    }).not.toThrow();
  });

  it('should handle errors in logging', () => {
    const logger = initializeLogger();
    const error = new Error('Test error');
    
    expect(() => {
      logger.error('Error occurred', error);
    }).not.toThrow();
  });
});