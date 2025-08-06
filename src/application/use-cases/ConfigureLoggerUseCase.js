/**
 * @typedef {Object} ConfigureLoggerRequest
 * @property {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} configuration - Logger configuration
 * @property {boolean} [validateOnly] - Only validate, don't apply configuration
 */

/**
 * @typedef {Object} ConfigureLoggerResponse
 * @property {boolean} success - Success status
 * @property {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} configuration - Logger configuration
 * @property {string[]} [validationErrors] - Validation errors if any
 */

/**
 * Use case for configuring loggers
 */
export class ConfigureLoggerUseCase {
  /**
   * @param {import('../services/ConfigurationService.js').ConfigurationService} configService - Configuration service
   */
  constructor(configService) {
    this.configService = configService;
  }

  /**
   * Execute the use case
   * @param {ConfigureLoggerRequest} request - Configure logger request
   * @returns {Promise<ConfigureLoggerResponse>} Configure logger response
   */
  async execute(request) {
    const validationErrors = this.validateConfiguration(request.configuration);
    
    if (validationErrors.length > 0) {
      return {
        success: false,
        configuration: request.configuration,
        validationErrors
      };
    }

    if (!request.validateOnly) {
      await this.configService.updateConfiguration(request.configuration);
    }

    return {
      success: true,
      configuration: request.configuration
    };
  }

  /**
   * Validate configuration
   * @private
   * @param {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} config - Configuration to validate
   * @returns {string[]} Validation errors
   */
  validateConfiguration(config) {
    const errors = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Logger name is required');
    }

    if (!config.transports || config.transports.length === 0) {
      errors.push('At least one transport is required');
    }

    for (const transport of config.transports) {
      if (!transport.type) {
        errors.push('Transport type is required');
      }
    }

    if (!config.format || !config.format.type) {
      errors.push('Format type is required');
    }

    return errors;
  }
}