/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger {
  debug(message?: string, ...optionalParams: any[]): void;
  warn(message?: string, ...optionalParams: any[]): void;
  error(message?: string, ...optionalParams: any[]): void;
}

export class ConsoleLogger implements Logger {
  private readonly isDebug: boolean;
  constructor(isDebug: boolean) {
    this.isDebug = isDebug;
  }
  debug(message?: string, ...optionalParams: any[]): void {
    if (this.isDebug) {
      console.debug(message, ...optionalParams);
    }
  }
  warn(message?: string, ...optionalParams: any[]): void {
    console.warn(message, ...optionalParams);
  }
  error(message?: string, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
}
