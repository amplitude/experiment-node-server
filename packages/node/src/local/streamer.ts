import {
  SdkStreamFlagApi,
  StreamErrorEvent,
  StreamEventSourceFactory,
} from '@amplitude/experiment-core';

import { version as PACKAGE_VERSION } from '../../gen/version';
import { LocalEvaluationDefaults } from '../types/config';
import { FlagConfigCache } from '../types/flag';
import { ConsoleLogger } from '../util/logger';
import { Logger } from '../util/logger';

import { FlagConfigFetcher } from './fetcher';
import { FlagConfigPoller } from './poller';

export class FlagConfigStreamer {
  private readonly logger: Logger;

  private readonly poller: FlagConfigPoller;
  private readonly stream: SdkStreamFlagApi;
  private readonly retryStreamFlagDelayMillis: number;

  private streamRetryInterval?: NodeJS.Timeout;

  public readonly cache: FlagConfigCache;

  constructor(
    apiKey: string,
    fetcher: FlagConfigFetcher,
    cache: FlagConfigCache,
    streamEventSourceFactory: StreamEventSourceFactory,
    pollingIntervalMillis = LocalEvaluationDefaults.flagConfigPollingIntervalMillis,
    streamConnTimeoutMillis = LocalEvaluationDefaults.streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis = LocalEvaluationDefaults.streamFlagConnTimeoutMillis,
    streamFlagTryAttempts = LocalEvaluationDefaults.streamFlagTryAttempts,
    streamFlagTryDelayMillis = LocalEvaluationDefaults.streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis = LocalEvaluationDefaults.retryStreamFlagDelayMillis,
    serverUrl: string = LocalEvaluationDefaults.serverUrl,
    debug = false,
  ) {
    this.logger = new ConsoleLogger(debug);
    this.logger.debug('[Experiment] streamer - init');
    this.cache = cache;
    this.poller = new FlagConfigPoller(
      fetcher,
      cache,
      pollingIntervalMillis,
      debug,
    );
    this.stream = new SdkStreamFlagApi(
      apiKey,
      serverUrl,
      streamEventSourceFactory,
      streamConnTimeoutMillis,
      streamFlagConnTimeoutMillis,
      streamFlagTryAttempts,
      streamFlagTryDelayMillis,
    );
    this.retryStreamFlagDelayMillis = retryStreamFlagDelayMillis;
  }

  /**
   * Fetch initial flag configurations and start polling for updates.
   *
   * You must call this function to begin polling for flag config updates.
   * The promise returned by this function is resolved when the initial call
   * to fetch the flag configuration completes.
   *
   * Calling this function while the poller is already running does nothing.
   */
  public async start(
    onChange?: (cache: FlagConfigCache) => Promise<void>,
  ): Promise<void> {
    this.stream.onError = (e) => {
      const err = e as StreamErrorEvent;
      this.logger.debug(
        `[Experiment] streamer - onError, fallback to poller, err status: ${err.status}, err message: ${err.message}`,
      );
      this.poller.start(onChange);
      this.startRetryStreamInterval();
    };

    this.stream.onUpdate = async (flagConfigs) => {
      this.logger.debug('[Experiment] streamer - receives updates');
      let changed = false;
      if (onChange) {
        const current = await this.cache.getAll();
        if (!Object.is(current, flagConfigs)) {
          changed = true;
        }
      }
      await this.cache.clear();
      await this.cache.putAll(flagConfigs);
      if (changed) {
        await onChange(this.cache);
      }
    };

    try {
      // Clear retry timeout. If stream isn't connected, we're trying now.
      // If stream is connected, timeout will be undefined and connect will do nothing.
      this.clearRetryStreamInterval();
      // stream connect error will be raised, not through calling onError.
      // So onError won't be called.
      // If close is called during connect, connect will return success. No sideeffects here.
      await this.stream.connect({
        libraryName: 'experiment-node-server',
        libraryVersion: PACKAGE_VERSION,
      });
      this.poller.stop();
      this.logger.debug('[Experiment] streamer - start stream success');
    } catch (e) {
      const err = e as StreamErrorEvent;
      this.logger.debug(
        `[Experiment] streamer - start stream failed, fallback to poller, err status: ${err.status}, err message: ${err.message}`,
      );
      await this.poller.start(onChange);
      this.startRetryStreamInterval();
    }
  }

  /**
   * Stop polling for flag configurations.
   *
   * Calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    this.logger.debug('[Experiment] streamer - stop');
    this.clearRetryStreamInterval();
    this.poller.stop();
    this.stream.close();
  }

  /**
   * Force a flag config fetch and cache the update with an optional callback
   * which gets called if the flag configs change in any way.
   *
   * @param onChange optional callback which will get called if the flag configs
   * in the cache have changed.
   */
  public async update(
    onChange?: (cache: FlagConfigCache) => Promise<void>,
  ): Promise<void> {
    this.poller.update(onChange);
  }

  // Retry stream after a while.
  private startRetryStreamInterval() {
    this.clearRetryStreamInterval();
    this.streamRetryInterval = setInterval(() => {
      this.logger.debug('[Experiment] streamer - retry stream');
      this.stream
        .connect()
        .then(() => {
          this.logger.debug('[Experiment] streamer - retry stream success');
          // Clear interval.
          this.clearRetryStreamInterval();
          // Stop poller.
          this.poller.stop();
        })
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .catch(() => {});
    }, this.retryStreamFlagDelayMillis);
  }

  // Clear retry interval.
  private clearRetryStreamInterval() {
    if (this.streamRetryInterval) {
      clearInterval(this.streamRetryInterval);
      this.streamRetryInterval = undefined;
    }
  }
}
