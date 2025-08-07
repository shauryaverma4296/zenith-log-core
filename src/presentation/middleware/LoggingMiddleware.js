const { randomUUID } = require('crypto');

class LoggingMiddleware {
  constructor(logger, options = {}) {
    this.logger = logger;
    this.options = {
      level: options.level || 'info',
      logRequestBody: options.logRequestBody || false,
      logResponseBody: options.logResponseBody || false,
      logHeaders: options.logHeaders !== false,
      excludePaths: options.excludePaths || [],
      excludeMethods: options.excludeMethods || [],
      excludeHeaders: options.excludeHeaders || ['authorization', 'cookie'],
    };
  }

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
        body: this.options.logRequestBody ? req.body : undefined,
      };

      this.logger[this.options.level]('HTTP Request', {
        requestId,
        request: requestInfo,
      });

      // Capture response
      const originalEnd = res.end;
      let responseBody;

      res.end = function (chunk, encoding) {
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
          body: responseBody,
        };

        this.logger[this.options.level]('HTTP Response', {
          requestId,
          response: responseInfo,
          responseTime,
        });
      });

      next();
    };
  }

  logRequest(requestInfo, additionalContext = {}) {
    const requestId = randomUUID();

    this.logger[this.options.level]('HTTP Request', {
      requestId,
      request: requestInfo,
      ...additionalContext,
    });

    return requestId;
  }

  logResponse(requestId, responseInfo, responseTime, additionalContext = {}) {
    this.logger[this.options.level]('HTTP Response', {
      requestId,
      response: responseInfo,
      responseTime,
      ...additionalContext,
    });
  }

  shouldSkip(path, method) {
    return (
      this.options.excludePaths.some(excludePath => path.startsWith(excludePath)) ||
      this.options.excludeMethods.includes(method)
    );
  }

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

module.exports = { LoggingMiddleware };
