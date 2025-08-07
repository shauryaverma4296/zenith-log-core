class LoggerService {
  constructor(loggerFactory, config) {
    console.log({
      config,
    });
    this.logger = loggerFactory.createLoggerWithConfig(config);
  }

  error(message, errorOrMetadata, metadataOrContext, context) {
    if (arguments[1] instanceof Error) {
      this.logger.error(message, arguments[1], metadataOrContext, context);
    } else {
      this.logger.error(message, errorOrMetadata, metadataOrContext);
    }
  }

  warn(message, metadata, context) {
    this.logger.warn(message, metadata, context);
  }

  info(message, metadata, context) {
    this.logger.info(message, metadata, context);
  }

  http(message, metadata, context) {
    this.logger.http(message, metadata, context);
  }

  verbose(message, metadata, context) {
    this.logger.verbose(message, metadata, context);
  }

  debug(message, metadata, context) {
    this.logger.debug(message, metadata, context);
  }

  silly(message, metadata, context) {
    this.logger.silly(message, metadata, context);
  }

  log(levelOrMessage, messageOrMetadata, metadataOrContext, contextOrError, error) {
    if (arguments[1] instanceof Error) {
      this.logger.log(
        levelOrMessage,
        messageOrMetadata,
        arguments[1],
        metadataOrContext,
        contextOrError
      );
    } else {
      this.logger.log(levelOrMessage, messageOrMetadata, metadataOrContext, contextOrError, error);
    }
  }

  async close() {
    return this.logger.close();
  }
}

module.exports = { LoggerService };
