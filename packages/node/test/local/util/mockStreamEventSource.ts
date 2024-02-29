/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  StreamEventSource,
  StreamOpenEvent,
  StreamMessageEvent,
  StreamErrorEvent,
  StreamEvent,
  StreamEventSourceFactory,
} from '@amplitude/experiment-core';

export interface MockStreamEventSourceClient extends StreamEventSource {
  // Methods for test.
  doOpen(evt: StreamOpenEvent): Promise<void>;
  doMsg(evt: StreamMessageEvent): Promise<void>;
  doErr(evt: StreamErrorEvent): Promise<void>;
}

export function getNewClient(): {
  client: MockStreamEventSourceClient | undefined;
  numCreated: number;
  clientFactory: StreamEventSourceFactory;
} {
  const clientObj = {
    client: undefined,
    numCreated: 0,
    clientFactory: undefined,
  };
  class AClientClass implements MockStreamEventSourceClient {
    static readonly CLOSED: number = 0;
    static readonly CONNECTING: number = 1;
    static readonly OPEN: number = 2;

    constructor(url: string, initDict: Record<string, any>) {
      clientObj.client = this;
      clientObj.numCreated++;

      this.url = url;
      this._readyState = AClientClass.CONNECTING;
      // this.withCredentials = params['withCredentials'];
    }
    CLOSED: number = AClientClass.CLOSED;
    CONNECTING: number = AClientClass.CONNECTING;
    OPEN: number = AClientClass.OPEN;

    // Variables
    readonly url: string;
    private _readyState: number;
    get readyState(): number {
      return this._readyState;
    }
    readonly withCredentials: boolean;

    // Handlers.
    onopen: (evt: StreamOpenEvent) => any;
    onmessage: (evt: StreamMessageEvent) => any;
    onerror: (evt: StreamErrorEvent) => any;

    // Other unused methods.
    addEventListener(
      type: string,
      listener: (evt: StreamEvent) => void,
    ): void {} // No implementation.
    dispatchEvent(evt: Event): boolean {
      return false;
    }
    removeEventListener(
      type: string,
      listener: (evt: StreamEvent) => void,
    ): void {} // No implementation.

    // Close.
    close(): void {
      this._readyState = AClientClass.CLOSED;
    }

    // Methods for test.
    async doOpen(evt: StreamOpenEvent): Promise<void> {
      this._readyState = AClientClass.OPEN;
      await this.onopen(evt);
    }
    async doMsg(evt: StreamMessageEvent): Promise<void> {
      await this.onmessage(evt);
    }
    async doErr(evt: StreamErrorEvent): Promise<void> {
      this._readyState = AClientClass.CLOSED;
      await this.onerror(evt);
    }
  }
  clientObj.clientFactory = (url: string, params: Record<string, any>) =>
    new AClientClass(url, params);
  return clientObj;
}
