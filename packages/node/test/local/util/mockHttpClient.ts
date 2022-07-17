/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpClient, SimpleResponse } from 'src/types/transport';

export class MockHttpClient implements HttpClient {
  private readonly responder: () => Promise<SimpleResponse>;

  constructor(responder: () => Promise<SimpleResponse>) {
    this.responder = responder;
  }

  request(
    requestUrl: string,
    method: string,
    headers: Record<string, string>,
    body: string,
    timeoutMillis?: number,
  ): Promise<SimpleResponse> {
    return this.responder();
  }
}
