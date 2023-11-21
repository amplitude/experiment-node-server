import http from 'http';
import https from 'https';
import url from 'url';

import {
  HttpClient as CoreHttpClient,
  HttpRequest,
  HttpResponse,
} from '@amplitude/experiment-core';

import { SimpleResponse, HttpClient } from '../types/transport';

const defaultHttpAgent = new https.Agent({
  keepAlive: true,
});

export class FetchHttpClient implements HttpClient {
  private readonly httpAgent: https.Agent;
  constructor(httpAgent: https.Agent) {
    this.httpAgent = httpAgent || defaultHttpAgent;
  }

  /**
   * Wraps the http and https libraries in a fetch()-like interface
   * @param requestUrl
   * @param method HTTP Method (GET, POST, etc.)
   * @param headers HTTP Headers
   * @param  Request body
   */
  request(
    requestUrl: string,
    method: string,
    headers: Record<string, string>,
    body: string,
    timeoutMillis?: number,
  ): Promise<SimpleResponse> {
    return new Promise((resolve, reject) => {
      if (timeoutMillis === 0) {
        reject(Error('Response timed out'));
        return;
      }

      const urlParams = url.parse(requestUrl);
      const options = {
        ...urlParams,
        method: method,
        headers: headers,
        body: body,
        agent: this.httpAgent,
        timeout: timeoutMillis,
      };
      const protocol = urlParams.protocol === 'http:' ? http : https;
      const req = protocol.request(options);

      req.on('response', (res) => {
        res.setEncoding('utf-8');
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body: responseBody,
          });
        });
      });

      req.on('timeout', () => {
        req.destroy(Error('Socket connection timed out'));
      });

      req.on('error', (e) => {
        reject(e);
      });

      if (method !== 'GET' && body) {
        req.write(body);
      }

      req.end();
    });
  }
}

/**
 * Wrap the exposed HttpClient in a CoreClient implementation to work with
 * FlagsApi and EvaluationApi.
 */
export class WrapperClient implements CoreHttpClient {
  private readonly client: HttpClient;
  constructor(client: HttpClient) {
    this.client = client;
  }

  async request(request: HttpRequest): Promise<HttpResponse> {
    return await this.client.request(
      request.requestUrl,
      request.method,
      request.headers,
      null,
      request.timeoutMillis,
    );
  }
}
