import { FlagApi, SdkFlagApi } from '@amplitude/experiment-core';
import { WrapperClient } from 'src/transport/http';

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
  private readonly flagApi: FlagApi;

  private receiver: (string) => void;

  public constructor(
    apiKey: string,
    httpClient: HttpClient,
    serverUrl: string = LocalEvaluationDefaults.serverUrl,
    debug = false,
  ) {
    this.apiKey = apiKey;
    this.serverUrl = serverUrl;
    this.flagApi = new SdkFlagApi(
      apiKey,
      serverUrl,
      new WrapperClient(httpClient),
    );
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
    const flags = this.flagApi.getFlags({
      libraryName: 'experiment-node-server',
      libraryVersion: PACKAGE_VERSION,
      evaluationMode: 'local',
      timeoutMillis: FLAG_CONFIG_TIMEOUT,
    });
    if (this.receiver) {
      this.receiver(JSON.stringify(flags));
    }
    return flags;
  }

  public setRawReceiver(rawReceiver: (flags: string) => void): void {
    this.receiver = rawReceiver;
  }
}
