import { randomUUID } from 'crypto';

/**
 * @typedef {Object} RequestInfo
 * @property {string} method - HTTP method
 * @property {string} url - Request URL
 * @property {Object} headers - Request headers
 * @property {string} userAgent - User agent
 * @property {string} ip - Client IP address
 * @property {*} [body] - Request body
 */

/**
 * @typedef {Object} ResponseInfo
 * @property {number} statusCode - Response status code
 * @property {Object} headers - Response headers
 * @property {*} [body] - Response body
 */

/**
 * @typedef {Object} MiddlewareOptions
 * @property {string} [level] - Log level
 * @property {boolean} [logRequestBody] - Log request body
 * @property {boolean} [logResponseBody] - Log response body
 * @property {boolean} [logHeaders] - Log headers
 * @property {string[]} [excludePaths] - Paths to exclude from logging
 * @property {string[]} [excludeMethods] - Methods to exclude from logging
 * @property {string[]} [excludeHeaders] - Headers to exclude from logging
 */

/**
 * Logging middleware for HTTP requests and responses
 */
export class LoggingMiddleware {
  /**
   * @param {Object} logger - Logger instance
   * @param {MiddlewareOptions} options - Middleware options
   */
  constructor(logger, options = {}) {
    this.logger = logger;
    this.options = {
      level: options.level || 'info',
      logRequestBody: options.logRequestBody || false,
      logResponseBody: options.logResponseBody || false,
      logHeaders: options.logHeaders !== false,
      excludePaths: options.excludePaths || [],
      excludeMethods: options.excludeMethods || [],
      excludeHeaders: options.excludeHeaders || ['authorization', 'cookie']
    };
  }

  /**
   * Express.js middleware
   * @returns {Function} Express middleware function
   */
  express() {
    return (req, res, next) => {
      if (this.shouldSkip(req.url, req.method)) {
        return next();
      }

      const startTime = Date.now();
      const requestId = randomUUID();

      // Log request
      const requestInfo = {
        method: req.method,
        url: req.url,
        headers: this.options.logHeaders ? this.filterHeaders(req.headers) : undefined,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        body: this.options.logRequestBody ? req.body : undefined
      };

      this.logger[this.options.level]('HTTP Request', {
        requestId,
        request: requestInfo
      });

      // Capture response
      const originalEnd = res.end;
      let responseBody;

      res.end = function(chunk, encoding) {
        if (chunk && this.options.logResponseBody) {
          responseBody = chunk.toString();
        }
        originalEnd.call(this, chunk, encoding);
      }.bind(this);

      // Log response when request completes
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        const responseInfo = {
          statusCode: res.statusCode,
          headers: this.options.logHeaders ? this.filterHeaders(res.getHeaders()) : undefined,
          body: responseBody
        };

        this.logger[this.options.level]('HTTP Response', {
          requestId,
          response: responseInfo,
          responseTime
        });
      });

      next();
    };
  }

  /**
   * Fastify middleware
   * @returns {Function} Fastify middleware function
   */
  fastify() {
    return (fastify, options, next) => {
      fastify.addHook('onSend', async (request, reply, payload) => {
        if (this.shouldSkip(request.url, request.method)) {
          return payload;
        }

        const requestId = randomUUID();
        const startTime = Date.now();

        // Log request
        const requestInfo = {
          method: request.method,
          url: request.url,
          headers: this.options.logHeaders ? this.filterHeaders(request.headers) : undefined,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          body: this.options.logRequestBody ? request.body : undefined
        };

        this.logger[this.options.level]('HTTP Request', {
          requestId,
          request: requestInfo
        });

        // Log response
        const responseTime = Date.now() - startTime;
        const responseInfo = {
          statusCode: reply.statusCode,
          headers: this.options.logHeaders ? this.filterHeaders(reply.getHeaders()) : undefined,
          body: this.options.logResponseBody ? payload : undefined
        };

        this.logger[this.options.level]('HTTP Response', {
          requestId,
          response: responseInfo,
          responseTime
        });

        return payload;
      });

      next();
    };
  }

  /**
   * Generic request logging
   * @param {RequestInfo} requestInfo - Request information
   * @param {Object} [additionalContext] - Additional context
   * @returns {string} Request ID
   */
  logRequest(requestInfo, additionalContext = {}) {
    const requestId = randomUUID();
    
    this.logger[this.options.level]('HTTP Request', {
      requestId,
      request: requestInfo,
      ...additionalContext
    });

    return requestId;
  }

  /**
   * Generic response logging
   * @param {string} requestId - Request ID
   * @param {ResponseInfo} responseInfo - Response information
   * @param {number} responseTime - Response time in milliseconds
   * @param {Object} [additionalContext] - Additional context
   */
  logResponse(requestId, responseInfo, responseTime, additionalContext = {}) {
    this.logger[this.options.level]('HTTP Response', {
      requestId,
      response: responseInfo,
      responseTime,
      ...additionalContext
    });
  }

  /**
   * Check if request should be skipped
   * @private
   */
  shouldSkip(path, method) {
    return this.options.excludePaths.some(excludePath => path.startsWith(excludePath)) ||
           this.options.excludeMethods.includes(method);
  }

  /**
   * Filter headers based on options
   * @private
   */
  filterHeaders(headers) {
    const filtered = {};
    for (const [key, value] of Object.entries(headers)) {
      if (!this.options.excludeHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}