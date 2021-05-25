import http from 'http';
import https from 'https';
import querystring, { ParsedUrlQueryInput } from 'querystring';
import url from 'url';

import { SimpleResponse, HttpClient } from '../types/transport';

/**
 * Wraps the http and https libraries in a fetch()-like interface
 * @param requestUrl
 * @param method HTTP Method (GET, POST, etc.)
 * @param headers HTTP Headers
 * @param data Request body
 */
const request: HttpClient['request'] = (
  requestUrl: string,
  method: string,
  headers: Record<string, string>,
  data?: Record<string, string>,
  timeoutMillis?: number,
): Promise<SimpleResponse> => {
  const urlParams = url.parse(requestUrl);
  if (method === 'GET' && data) {
    urlParams.path = `${urlParams.path}?${querystring.encode(
      data as ParsedUrlQueryInput,
    )}`;
  }
  const options = {
    ...urlParams,
    method,
    headers,
    // Adds timeout to the socket connection, not the response.
    timeout: timeoutMillis,
  };

  return new Promise((resolve, reject) => {
    const protocol = urlParams.protocol === 'http:' ? http : https;
    const req = protocol.request(options);

    const responseTimeout = setTimeout(() => {
      req.destroy(Error('Response timed out'));
    }, timeoutMillis);

    req.on('response', (res) => {
      clearTimeout(responseTimeout);
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

    req.on('timeout', () => req.destroy(Error('Socket connection timed out')));

    req.on('error', reject);

    if (method !== 'GET' && data) {
      req.write(data);
    }

    req.on('close', () => clearTimeout(responseTimeout));
    req.end();
  });
};

export const FetchHttpClient: HttpClient = {
  request,
};
