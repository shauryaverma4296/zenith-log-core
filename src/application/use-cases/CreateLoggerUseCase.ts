import { injectable, inject } from 'tsyringe';
import { ILogger } from '../../domain/interfaces/ILogger';
import { ILoggerFactory } from '../../domain/interfaces/ILoggerFactory';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';
import { ConfigurationService } from '../services/ConfigurationService';

export interface CreateLoggerRequest {
  name?: string;
  configOverrides?: Partial<LoggerConfiguration>;
}

export interface CreateLoggerResponse {
  logger: ILogger;
  configuration: LoggerConfiguration;
}

export class CreateLoggerUseCase {
  private loggerFactory;
  private configService;

  constructor(loggerFactory, configService) {
    this.loggerFactory = loggerFactory;
    this.configService = configService;
  }

  async execute(request: CreateLoggerRequest): Promise<CreateLoggerResponse> {
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