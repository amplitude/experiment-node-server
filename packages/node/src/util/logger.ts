/* eslint-disable @typescript-eslint/no-explicit-any, no-console*/
import { LogLevel } from '../types/loglevel';

export interface LoggerProvider {
  verbose(message?: string, ...optionalParams: any[]): void;
  debug(message?: string, ...optionalParams: any[]): void;
  info(message?: string, ...optionalParams: any[]): void;
  warn(message?: string, ...optionalParams: any[]): void;
  error(message?: string, ...optionalParams: any[]): void;
}

export class AmplitudeLogger {
  private readonly LogLevel: LogLevel;
  private readonly LoggerProvider: LoggerProvider;

  constructor(logLevel: LogLevel, loggerProvider: LoggerProvider) {
    this.LogLevel = logLevel;
    this.LoggerProvider = loggerProvider;
  }

  verbose(message?: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Verbose)) {
      this.LoggerProvider.verbose(message, optionalParams);
    }
  }

  debug(message?: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Debug)) {
      this.LoggerProvider.debug(message, optionalParams);
    }
  }

  info(message?: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Info)) {
      this.LoggerProvider.info(message, optionalParams);
    }
  }

  warn(message?: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Warn)) {
      this.LoggerProvider.warn(message, optionalParams);
    }
  }

  error(message?: string, ...optionalParams: any[]): void {
    if (this.shouldLog(LogLevel.Error)) {
      this.LoggerProvider.error(message, optionalParams);
    }
  }

  private shouldLog(logLevel: LogLevel) {
    return logLevel <= this.LogLevel;
  }
}

export class ConsoleLogger implements LoggerProvider {
  verbose(message?: string, ...optionalParams: any[]): void {
    console.log(message, optionalParams);
  }
  debug(message?: string, ...optionalParams: any[]): void {
    console.debug(message, ...optionalParams);
  }
  info(message?: string, ...optionalParams: any[]): void {
    console.log(message, optionalParams);
  }
  warn(message?: string, ...optionalParams: any[]): void {
    console.warn(message, ...optionalParams);
  }
  error(message?: string, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
}
