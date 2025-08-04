import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

// Express types - for projects using this package
interface Request {
  method: string;
  url: string;
  path: string;
  headers: Record<string, any>;
  get(header: string): string | undefined;
  ip?: string;
  sessionID?: string;
  user?: any;
}

interface Response {
  setHeader(name: string, value: string): void;
  get(header: string): string | undefined;
}

interface NextFunction {
  (): void;
}

interface CorrelationContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  startTime: number;
  metadata: Record<string, any>;
}

class CorrelationContextManager {
  private static instance: CorrelationContextManager;
  private asyncLocalStorage: AsyncLocalStorage<CorrelationContext>;

  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<CorrelationContext>();
  }

  static getInstance(): CorrelationContextManager {
    if (!CorrelationContextManager.instance) {
      CorrelationContextManager.instance = new CorrelationContextManager();
    }
    return CorrelationContextManager.instance;
  }

  run<T>(context: CorrelationContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  getContext(): CorrelationContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getCorrelationId(): string | undefined {
    const context = this.getContext();
    return context?.correlationId;
  }

  getRequestId(): string | undefined {
    const context = this.getContext();
    return context?.requestId;
  }

  updateContext(updates: Partial<CorrelationContext>): void {
    const context = this.getContext();
    if (context) {
      Object.assign(context, updates);
    }
  }

  setMetadata(key: string, value: any): void {
    const context = this.getContext();
    if (context) {
      context.metadata[key] = value;
    }
  }

  getMetadata(key?: string): any {
    const context = this.getContext();
    if (!context) return undefined;
    
    return key ? context.metadata[key] : context.metadata;
  }
}

export interface CorrelationMiddlewareOptions {
  headerName?: string;
  generateId?: () => string;
  extractUserId?: (req: Request) => string | undefined;
  extractSessionId?: (req: Request) => string | undefined;
  skipPaths?: string[];
  includeHeaders?: string[];
}

export class CorrelationMiddleware {
  private contextManager: CorrelationContextManager;
  private options: Required<CorrelationMiddlewareOptions>;

  constructor(options: CorrelationMiddlewareOptions = {}) {
    this.contextManager = CorrelationContextManager.getInstance();
    this.options = {
      headerName: options.headerName || 'x-correlation-id',
      generateId: options.generateId || (() => uuidv4()),
      extractUserId: options.extractUserId || ((req) => (req as any).user?.id),
      extractSessionId: options.extractSessionId || ((req) => req.sessionID),
      skipPaths: options.skipPaths || ['/health', '/metrics'],
      includeHeaders: options.includeHeaders || ['user-agent', 'authorization']
    };
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip middleware for certain paths
      if (this.options.skipPaths.includes(req.path)) {
        return next();
      }

      // Extract or generate correlation ID
      const correlationId = req.headers[this.options.headerName] as string || this.options.generateId();
      const requestId = this.options.generateId();

      // Extract additional context
      const userId = this.options.extractUserId(req);
      const sessionId = this.options.extractSessionId(req);

      // Prepare metadata
      const metadata: Record<string, any> = {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Include specified headers
      for (const header of this.options.includeHeaders) {
        const value = req.get(header);
        if (value) {
          metadata[`header_${header.replace(/-/g, '_')}`] = value;
        }
      }

      // Create correlation context
      const context: CorrelationContext = {
        correlationId,
        requestId,
        userId,
        sessionId,
        startTime: Date.now(),
        metadata
      };

      // Add correlation ID to response headers
      res.setHeader(this.options.headerName, correlationId);
      res.setHeader('x-request-id', requestId);

      // Attach to request object for easy access
      (req as any).correlationId = correlationId;
      (req as any).requestId = requestId;
      (req as any).context = context;

      // Run the rest of the request in the correlation context
      this.contextManager.run(context, () => {
        next();
      });
    };
  }

  static getCorrelationId(): string | undefined {
    return CorrelationContextManager.getInstance().getCorrelationId();
  }

  static getRequestId(): string | undefined {
    return CorrelationContextManager.getInstance().getRequestId();
  }

  static getContext(): CorrelationContext | undefined {
    return CorrelationContextManager.getInstance().getContext();
  }

  static setMetadata(key: string, value: any): void {
    CorrelationContextManager.getInstance().setMetadata(key, value);
  }

  static getMetadata(key?: string): any {
    return CorrelationContextManager.getInstance().getMetadata(key);
  }
}

export { CorrelationContextManager };