import { LogEntry } from '../../../src/domain/entities/LogEntry';
import { LogLevel } from '../../../src/domain/enums/LogLevel';

describe('LogEntry', () => {
  it('should create a log entry with basic properties', () => {
    const entry = new LogEntry(LogLevel.INFO, 'Test message');
    
    expect(entry.level).toBe(LogLevel.INFO);
    expect(entry.message).toBe('Test message');
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.metadata).toEqual({});
    expect(entry.context).toEqual({});
    expect(entry.error).toBeUndefined();
  });

  it('should create a log entry with metadata and context', () => {
    const metadata = { key: 'value' };
    const context = { requestId: '123' };
    const entry = new LogEntry(LogLevel.ERROR, 'Error message', metadata, context);
    
    expect(entry.metadata).toEqual(metadata);
    expect(entry.context).toEqual(context);
  });

  it('should create a log entry with error', () => {
    const error = new Error('Test error');
    const entry = new LogEntry(LogLevel.ERROR, 'Error occurred', {}, {}, error);
    
    expect(entry.error).toBe(error);
  });

  it('should serialize to JSON correctly', () => {
    const error = new Error('Test error');
    const entry = new LogEntry(
      LogLevel.WARN, 
      'Warning message', 
      { key: 'value' }, 
      { requestId: '123' }, 
      error
    );
    
    const json = entry.toJSON();
    
    expect(json).toMatchObject({
      level: LogLevel.WARN,
      message: 'Warning message',
      metadata: { key: 'value' },
      context: { requestId: '123' },
      error: {
        name: 'Error',
        message: 'Test error',
        stack: expect.any(String)
      }
    });
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});