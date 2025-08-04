import { injectable, inject } from 'tsyringe';
import { LoggerConfiguration } from '../../domain/entities/LoggerConfiguration';
import { ConfigurationService } from '../services/ConfigurationService';

export interface ConfigureLoggerRequest {
  configuration: LoggerConfiguration;
  validateOnly?: boolean;
}

export interface ConfigureLoggerResponse {
  success: boolean;
  configuration: LoggerConfiguration;
  validationErrors?: string[];
}

@injectable()
export class ConfigureLoggerUseCase {
  constructor(
    @inject('ConfigurationService') private readonly configService: ConfigurationService
  ) {}

  async execute(request: ConfigureLoggerRequest): Promise<ConfigureLoggerResponse> {
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

  private validateConfiguration(config: LoggerConfiguration): string[] {
    const errors: string[] = [];

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