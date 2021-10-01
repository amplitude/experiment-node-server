/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger {
  debug(message?: string, ...optionalParams: any[]): void;
  error(message?: string, ...optionalParams: any[]): void;
}
