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
    };

    if (this.options.includeMeta && Object.keys(entry.metadata).length > 0) {
      logObject.metadata = entry.metadata;
    }

    if (this.options.includeContext && Object.keys(entry.context).length > 0) {
      logObject.context = entry.context;
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
