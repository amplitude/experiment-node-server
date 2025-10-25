import {
  RemoteEvaluationConfig,
  RemoteEvaluationDefaults,
  LocalEvaluationConfig,
} from '..';
import {
  EU_SERVER_URLS,
  LocalEvaluationDefaults,
  CohortSyncConfigDefaults,
} from '../types/config';
import { LogLevel } from '../types/loglevel';

export const populateRemoteConfigDefaults = (
  customConfig?: RemoteEvaluationConfig,
): RemoteEvaluationConfig => {
  const config = { ...RemoteEvaluationDefaults, ...customConfig };
  config.logLevel = config.debug ? LogLevel.Debug : config.logLevel;
  const isEu = config.serverZone.toLowerCase() === EU_SERVER_URLS.name;
  config.serverZone = isEu ? 'eu' : 'us';

  if (!customConfig?.serverUrl) {
    config.serverUrl = isEu
      ? EU_SERVER_URLS.remote
      : RemoteEvaluationDefaults.serverUrl;
  }
  return config;
};

export const populateLocalConfigDefaults = (
  customConfig?: LocalEvaluationConfig,
): LocalEvaluationConfig => {
  const config = { ...LocalEvaluationDefaults, ...customConfig };
  config.logLevel = config.debug ? LogLevel.Debug : config.logLevel;
  const isEu = config.serverZone.toLowerCase() === EU_SERVER_URLS.name;
  config.serverZone = isEu ? 'eu' : 'us';

  if (!customConfig?.serverUrl) {
    config.serverUrl = isEu
      ? EU_SERVER_URLS.flags
      : LocalEvaluationDefaults.serverUrl;
  }
  if (!customConfig?.streamServerUrl) {
    config.streamServerUrl = isEu
      ? EU_SERVER_URLS.stream
      : LocalEvaluationDefaults.streamServerUrl;
  }
  if (
    customConfig?.cohortSyncConfig &&
    !customConfig?.cohortSyncConfig.cohortServerUrl
  ) {
    config.cohortSyncConfig.cohortServerUrl = isEu
      ? EU_SERVER_URLS.cohort
      : CohortSyncConfigDefaults.cohortServerUrl;
  }
  return config;
};
