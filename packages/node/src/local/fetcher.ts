import { version as PACKAGE_VERSION } from '../../gen/version';
import { LocalEvaluationDefaults } from '../types/config';
import { FlagConfig } from '../types/flag';
import { HttpClient } from '../types/transport';
import { ConsoleLogger } from '../util/logger';
import { Logger } from '../util/logger';

const FLAG_CONFIG_TIMEOUT = 5000;

export class FlagConfigFetcher {
  private readonly logger: Logger;

  private readonly apiKey: string;
  private readonly serverUrl: string;
  private readonly httpClient: HttpClient;

  public constructor(
    apiKey: string,
    httpClient: HttpClient,
    serverUrl: string = LocalEvaluationDefaults.serverUrl,
    debug = false,
  ) {
    this.apiKey = apiKey;
    this.serverUrl = serverUrl;
    this.httpClient = httpClient;
    this.logger = new ConsoleLogger(debug);
  }

  /**
   * Fetch local evaluation mode flag configs from the Experiment API server.
   * These flag configs can be used to perform local evaluation.
   *
   * @returns The local evaluation mode flag configs for the initialized
   * environment
   */
  public async fetch(): Promise<Record<string, FlagConfig>> {
    const endpoint = `${this.serverUrl}/sdk/v1/flags`;
    const headers = {
      Authorization: `Api-Key ${this.apiKey}`,
      Accept: 'application/json',
      'X-Amp-Exp-Library': `experiment-node-server/${PACKAGE_VERSION}`,
      'Content-Type': 'application/json;charset=utf-8',
    };
    const body = null;
    this.logger.debug('[Experiment] Get flag configs');
    const response = await this.httpClient.request(
      endpoint,
      'GET',
      headers,
      body,
      FLAG_CONFIG_TIMEOUT,
    );
    if (response.status !== 200) {
      throw Error(
        `flagConfigs - received error response: ${response.status}: ${response.body}`,
      );
    }
    this.logger.debug(`[Experiment] Got flag configs: ${response.body}`);
    return this.parse(response.body);
  }

  private parse(flagConfigs: string): Record<string, FlagConfig> {
    const flagConfigsArray = JSON.parse(flagConfigs);
    const flagConfigsRecord: Record<string, FlagConfig> = {};
    for (let i = 0; i < flagConfigsArray.length; i++) {
      const flagConfig = flagConfigsArray[i];
      flagConfigsRecord[flagConfig.flagKey] = flagConfig;
    }
    return flagConfigsRecord;
  }
}
