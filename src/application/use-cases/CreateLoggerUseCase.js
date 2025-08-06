/**
 * @typedef {Object} CreateLoggerRequest
 * @property {string} [name] - Logger name
 * @property {Partial<import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration>} [configOverrides] - Configuration overrides
 */

/**
 * @typedef {Object} CreateLoggerResponse
 * @property {Object} logger - Logger instance
 * @property {import('../../domain/entities/LoggerConfiguration.js').LoggerConfiguration} configuration - Logger configuration
 */

/**
 * Use case for creating loggers
 */
export class CreateLoggerUseCase {
  /**
   * @param {Object} loggerFactory - Logger factory
   * @param {import('../services/ConfigurationService.js').ConfigurationService} configService - Configuration service
   */
  constructor(loggerFactory, configService) {
    this.loggerFactory = loggerFactory;
    this.configService = configService;
  }

  /**
   * Execute the use case
   * @param {CreateLoggerRequest} request - Create logger request
   * @returns {Promise<CreateLoggerResponse>} Create logger response
   */
  async execute(request) {
    const baseConfig = await this.configService.getConfiguration(request.name);
    
    let finalConfig = baseConfig;
    if (request.configOverrides) {
      finalConfig = await this.configService.mergeConfigurations(
        baseConfig,
        request.configOverrides
      );
    }

    const logger = this.loggerFactory.createLoggerWithConfig(finalConfig);

    return {
      logger,
      configuration: finalConfig
    };
  }
}