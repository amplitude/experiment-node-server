/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpClient, SimpleResponse } from 'src/types/transport';

type MockedRequestParams = {
  requestUrl: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timeoutMillis?: number;
};
export class MockHttpClient implements HttpClient {
  private readonly responder: (
    params: MockedRequestParams,
  ) => Promise<SimpleResponse>;

  constructor(
    responder: (params: MockedRequestParams) => Promise<SimpleResponse>,
  ) {
    this.responder = responder;
  }

  request(
    requestUrl: string,
    method: string,
    headers: Record<string, string>,
    body: string,
    timeoutMillis?: number,
  ): Promise<SimpleResponse> {
    return this.responder({ requestUrl, method, headers, body, timeoutMillis });
  }
}
