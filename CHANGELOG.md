# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Zenith Log Core
- SOLID principles implementation with onion architecture
- Port & adapter pattern for pluggable transports and configuration
- TSyringe dependency injection container integration
- Winston logger adapter implementation
- File and environment configuration providers
- JSON, text, and structured log formatters
- Method logging decorators (@Logged, @LogMethodCalls, @LogExecutionTime)
- Express.js and Fastify middleware support
- Comprehensive TypeScript type definitions
- Performance monitoring and metrics
- Child logger support with context inheritance
- Configurable transport system (console, file, HTTP)
- Structured logging with correlation IDs
- Error handling and stack trace logging
- Async logging capabilities
- Complete test suite with coverage
- ESLint and Prettier configuration
- Rollup build system for CommonJS and ES modules
- Comprehensive documentation and examples

### Features
- **Logger Factory**: Create loggers with different configurations
- **Configuration Management**: Multiple configuration sources (file, environment, custom)
- **Transport Abstraction**: Pluggable transport system
- **Formatter System**: Multiple output formats
- **Context Management**: Request/operation context tracking
- **Performance Monitoring**: Built-in execution time logging
- **Error Handling**: Comprehensive error logging with stack traces
- **Testing Support**: Mock implementations and testing utilities
- **Middleware Support**: Framework-agnostic HTTP logging middleware
- **Decorator Pattern**: Method-level logging decorators
- **Type Safety**: Full TypeScript support

### Technical
- TypeScript 5.0+ support
- Node.js 16+ compatibility
- Winston 3.11+ integration
- TSyringe 4.8+ dependency injection
- Jest testing framework
- Rollup bundling
- ESLint + Prettier code quality tools
- Comprehensive type definitions
- Source maps and declaration files
- Tree-shakable ES modules