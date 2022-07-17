/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger {
  debug(message?: string, ...optionalParams: any[]): void;
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
  error(message?: string, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
}
