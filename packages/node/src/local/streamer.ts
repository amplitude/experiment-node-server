import { version as PACKAGE_VERSION } from '../../gen/version';
import {
  StreamErrorEvent,
  StreamEventSourceFactory,
} from '../transport/stream';
import { CohortStorage } from '../types/cohort';
import { LocalEvaluationDefaults } from '../types/config';
import { FlagConfigCache } from '../types/flag';

import { CohortFetcher } from './cohort/fetcher';
import { FlagConfigPoller } from './poller';
import { SdkStreamFlagApi } from './stream-flag-api';
import { FlagConfigUpdater, FlagConfigUpdaterBase } from './updater';

export class FlagConfigStreamer
  extends FlagConfigUpdaterBase
  implements FlagConfigUpdater
{
  private readonly poller: FlagConfigPoller;
  private readonly stream: SdkStreamFlagApi;
  private readonly streamFlagRetryDelayMillis: number;

  private streamRetryInterval?: NodeJS.Timeout;

  constructor(
    apiKey: string,
    poller: FlagConfigPoller,
    cache: FlagConfigCache,
    streamEventSourceFactory: StreamEventSourceFactory,
    streamFlagConnTimeoutMillis = LocalEvaluationDefaults.streamFlagConnTimeoutMillis,
    streamFlagTryAttempts: number,
    streamFlagTryDelayMillis: number,
    streamFlagRetryDelayMillis: number,
    serverUrl: string = LocalEvaluationDefaults.serverUrl,
    cohortStorage: CohortStorage,
    cohortFetcher?: CohortFetcher,
    debug = false,
  ) {
    super(cache, cohortStorage, cohortFetcher, debug);
    this.logger.debug('[Experiment] streamer - init');
    this.poller = poller;
    this.stream = new SdkStreamFlagApi(
      apiKey,
      serverUrl,
      streamEventSourceFactory,
      streamFlagConnTimeoutMillis,
      streamFlagConnTimeoutMillis,
      streamFlagTryAttempts,
      streamFlagTryDelayMillis,
    );
    this.streamFlagRetryDelayMillis = streamFlagRetryDelayMillis;
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
        `[Experiment] streamer - onError, fallback to poller, err status: ${err?.status}, err message: ${err?.message}, err ${err}`,
      );
      this.poller.start(onChange);
      this.startRetryStreamInterval();
    };

    this.stream.onInitUpdate = async (flagConfigs) => {
      this.logger.debug('[Experiment] streamer - receives updates');
      await super._update(flagConfigs, onChange);
      this.logger.debug('[Experiment] streamer - start flags stream success');
    };
    this.stream.onUpdate = async (flagConfigs) => {
      this.logger.debug('[Experiment] streamer - receives updates');
      await super._update(flagConfigs, onChange);
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
    } catch (e) {
      const err = e as StreamErrorEvent;
      this.logger.debug(
        `[Experiment] streamer - start stream failed, fallback to poller, err status: ${err?.status}, err message: ${err?.message}, err ${err}`,
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
    }, this.streamFlagRetryDelayMillis);
  }

  // Clear retry interval.
  private clearRetryStreamInterval() {
    if (this.streamRetryInterval) {
      clearInterval(this.streamRetryInterval);
      this.streamRetryInterval = undefined;
    }
  }
}
