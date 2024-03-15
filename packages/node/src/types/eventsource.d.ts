/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

// Adapted from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/eventsource/index.d.ts
// The use of Event class in @types/eventsource was bundled with an older version of Event class from @types/node.
// Thus, using @types/eventsource will incur a conflict if @types/node: ^18.1.0.
// Instead of using @types/eventsource, we directly declare the type here, so Event can be whatever from @types/node.
declare module 'eventsource' {
  namespace EventSource {
    enum ReadyState {
      CONNECTING = 0,
      OPEN = 1,
      CLOSED = 2,
    }

    interface EventSourceInitDict {
      withCredentials?: boolean | undefined;
      headers?: object | undefined;
      proxy?: string | undefined;
      https?: object | undefined;
      rejectUnauthorized?: boolean | undefined;
    }
  }

  class MessageEvent {
    type: string;
    data?: string;
    lastEventId?: string;
    origin?: string;
  }

  class EventSource {
    static readonly CLOSED: number;
    static readonly CONNECTING: number;
    static readonly OPEN: number;

    constructor(
      url: string,
      eventSourceInitDict?: EventSource.EventSourceInitDict,
    );

    readonly CLOSED: number;
    readonly CONNECTING: number;
    readonly OPEN: number;
    readonly url: string;
    readonly readyState: number;
    readonly withCredentials: boolean;
    onopen: (evt: { type: string }) => any;
    onmessage: (evt: MessageEvent) => any;
    onerror: (evt: { status?: number; message: string }) => any;
    addEventListener(type: string, listener: (evt: MessageEvent) => void): void;
    dispatchEvent(evt: Event): boolean;
    removeEventListener(
      type: string,
      listener: (evt: MessageEvent) => void,
    ): void;
    close(): void;
  }

  export default EventSource;
}
