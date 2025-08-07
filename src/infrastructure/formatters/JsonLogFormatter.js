class JsonLogFormatter {
  constructor(options = {}) {
    this.options = {
      space: options.space || 0,
      includeMeta: options.includeMeta !== false,
      includeContext: options.includeContext !== false,
    };
  }

  format(entry) {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      event: entry.metadata?.event || entry.context?.event || 'general',
      correlationId: entry.metadata?.correlationId || entry.context?.correlationId || null,
    };

    if (this.options.includeMeta && Object.keys(entry.metadata).length > 0) {
      // Exclude event and correlationId from metadata since they're now top-level
      const { event, correlationId, ...cleanMetadata } = entry.metadata;
      if (Object.keys(cleanMetadata).length > 0) {
        logObject.metadata = cleanMetadata;
      }
    }

    if (this.options.includeContext && Object.keys(entry.context).length > 0) {
      // Exclude event and correlationId from context since they're now top-level
      const { event, correlationId, ...cleanContext } = entry.context;
      if (Object.keys(cleanContext).length > 0) {
        logObject.context = cleanContext;
      }
    }

    if (entry.error) {
      logObject.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      };
    }

    return JSON.stringify(logObject, null, this.options.space);
  }

  getName() {
    return 'json';
  }
}

module.exports = { JsonLogFormatter };
