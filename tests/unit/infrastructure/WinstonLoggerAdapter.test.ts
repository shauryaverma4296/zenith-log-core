import winston from 'winston';
import { WinstonLoggerAdapter } from '../../../src/infrastructure/adapters/WinstonLoggerAdapter';
import { LoggerConfiguration } from '../../../src/domain/entities/LoggerConfiguration';
import { LogLevel } from '../../../src/domain/enums/LogLevel';

describe('WinstonLoggerAdapter', () => {
  let mockWinstonLogger: jest.Mocked<winston.Logger>;
  let adapter: WinstonLoggerAdapter;

  beforeEach(() => {
    mockWinstonLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      isLevelEnabled: jest.fn().mockReturnValue(true),
      close: jest.fn((callback) => callback()),
    } as any;

    adapter = new WinstonLoggerAdapter(mockWinstonLogger);
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      adapter.info('Test message', { key: 'value' }, { requestId: '123' });
      
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          key: 'value',
          context: { requestId: '123' }
        })
      );
    });

    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      adapter.error('Error occurred', error, { key: 'value' }, { requestId: '123' });
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Error occurred',
        expect.objectContaining({
          key: 'value',
          context: { requestId: '123' },
          error: {
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String)
          }
        })
      );
    });

    it('should log with specified level', () => {
      adapter.log(LogLevel.WARN, 'Warning message', { key: 'value' });
      
      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.WARN,
        'Warning message',
        expect.objectContaining({
          key: 'value',
          context: {}
        })
      );
    });
  });

  describe('child logger', () => {
    it('should create child logger with merged context', () => {
      const baseContext = { service: 'api' };
      const baseAdapter = new WinstonLoggerAdapter(mockWinstonLogger, baseContext);
      
      const childLogger = baseAdapter.child({ requestId: '123' });
      childLogger.info('Test message');
      
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          context: { service: 'api', requestId: '123' }
        })
      );
    });
  });

  describe('fromConfiguration', () => {
    it('should create adapter from configuration', () => {
      const config = new LoggerConfiguration({
        name: 'test',
        level: LogLevel.DEBUG,
        transports: [{ type: 'console' }]
      });

      const adapter = WinstonLoggerAdapter.fromConfiguration(config);
      
      expect(adapter).toBeInstanceOf(WinstonLoggerAdapter);
    });
  });

  describe('isLevelEnabled', () => {
    it('should check if level is enabled', () => {
      mockWinstonLogger.isLevelEnabled.mockReturnValue(true);
      
      const result = adapter.isLevelEnabled(LogLevel.DEBUG);
      
      expect(result).toBe(true);
      expect(mockWinstonLogger.isLevelEnabled).toHaveBeenCalledWith(LogLevel.DEBUG);
    });
  });

  describe('close', () => {
    it('should close the logger', async () => {
      await adapter.close();
      
      expect(mockWinstonLogger.close).toHaveBeenCalled();
    });
  });
});