import { ILogger } from '../../domain/interfaces/ILogger';
import { LogLevel } from '../../domain/enums/LogLevel';

export interface RequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
}

export interface ResponseInfo {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
}

export interface MiddlewareOptions {
  logLevel?: LogLevel;
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  logHeaders?: boolean;
  excludeHeaders?: string[];
  generateRequestId?: () => string;
  skipPaths?: string[];
  skipMethods?: string[];
}

export class LoggingMiddleware {
  private readonly logger: ILogger;
  private readonly options: Required<MiddlewareOptions>;

  constructor(logger: ILogger, options: MiddlewareOptions = {}) {
    this.logger = logger;
    this.options = {
      logLevel: options.logLevel || LogLevel.INFO,
      logRequestBody: options.logRequestBody || false,
      logResponseBody: options.logResponseBody || false,
      logHeaders: options.logHeaders || false,
      excludeHeaders: options.excludeHeaders || ['authorization', 'cookie'],
      generateRequestId:
        options.generateRequestId || (() => Math.random().toString(36).substr(2, 9)),
      skipPaths: options.skipPaths || ['/health', '/metrics'],
      skipMethods: options.skipMethods || [],
    };
  }

  // Express.js middleware
  express() {
    return (req: any, res: any, next: any) => {
      const requestId = this.options.generateRequestId();
      const startTime = Date.now();

      // Skip logging for specified paths or methods
      if (this.shouldSkip(req.path, req.method)) {
        return next();
      }

      const requestInfo: RequestInfo = {
        method: req.method,
        url: req.url,
        headers: this.filterHeaders(req.headers),
        query: req.query,
        params: req.params,
      };

      if (this.options.logRequestBody && req.body) {
        requestInfo.body = req.body;
      }

      const context = {
        requestId,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
      };

      // Log incoming request
      this.logger.log(this.options.logLevel, 'Incoming Request', { request: requestInfo }, context);

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = (chunk: any, encoding: any) => {
        const responseTime = Date.now() - startTime;

        const responseInfo: ResponseInfo = {
          statusCode: res.statusCode,
          headers: res.getHeaders ? res.getHeaders() : {},
        };

        if (this.options.logResponseBody && chunk) {
          (responseInfo as any).body = chunk;
        }

        const responseMetadata = {
          response: responseInfo,
          responseTime,
          contentLength: res.get('Content-Length'),
        };

        const level = res.statusCode >= 400 ? LogLevel.WARN : this.options.logLevel;

        this.logger.log(level, 'Outgoing Response', responseMetadata, context);

        originalEnd.call(res, chunk, encoding);
      };

      next();
    };
  }

  // Fastify middleware
  fastify() {
    return async (request: any, reply: any) => {
      const requestId = this.options.generateRequestId();
      const startTime = Date.now();

      if (this.shouldSkip(request.url, request.method)) {
        return;
      }

      const requestInfo: RequestInfo = {
        method: request.method,
        url: request.url,
        headers: this.filterHeaders(request.headers),
        query: request.query,
        params: request.params,
      };

      if (this.options.logRequestBody && request.body) {
        requestInfo.body = request.body;
      }

      const context = {
        requestId,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      };

      this.logger.log(this.options.logLevel, 'Incoming Request', { request: requestInfo }, context);

      reply.addHook('onSend', async (request: any, reply: any, payload: any) => {
        const responseTime = Date.now() - startTime;

        const responseInfo: ResponseInfo = {
          statusCode: reply.statusCode,
          headers: reply.getHeaders(),
        };

        if (this.options.logResponseBody && payload) {
          responseInfo.body = payload;
        }

        const responseMetadata = {
          response: responseInfo,
          responseTime,
        };

        const level = reply.statusCode >= 400 ? LogLevel.WARN : this.options.logLevel;

        this.logger.log(level, 'Outgoing Response', responseMetadata, context);
      });
    };
  }

  // Generic HTTP logger (framework agnostic)
  logRequest(requestInfo: RequestInfo, additionalContext: Record<string, any> = {}): string {
    const requestId = this.options.generateRequestId();
    const context = { requestId, ...additionalContext };

    this.logger.log(this.options.logLevel, 'HTTP Request', { request: requestInfo }, context);

    return requestId;
  }

  logResponse(
    requestId: string,
    responseInfo: ResponseInfo,
    responseTime: number,
    additionalContext: Record<string, any> = {}
  ): void {
    const context = { requestId, ...additionalContext };
    const level = responseInfo.statusCode >= 400 ? LogLevel.WARN : this.options.logLevel;

    this.logger.log(
      level,
      'HTTP Response',
      {
        response: responseInfo,
        responseTime,
      },
      context
    );
  }

  private shouldSkip(path: string, method: string): boolean {
    return this.options.skipPaths.includes(path) || this.options.skipMethods.includes(method);
  }

  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    if (!this.options.logHeaders) {
      return {};
    }

    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (!this.options.excludeHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}
