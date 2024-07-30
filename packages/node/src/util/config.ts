import {
  RemoteEvaluationConfig,
  RemoteEvaluationDefaults,
  LocalEvaluationConfig,
} from '..';
import {
  EU_SERVER_URLS,
  LocalEvaluationDefaults,
  CohortConfigDefaults,
} from '../types/config';

export const populateRemoteConfigDefaults = (
  customConfig?: RemoteEvaluationConfig,
): RemoteEvaluationConfig => {
  const config = { ...RemoteEvaluationDefaults, ...customConfig };
  const isEu = config.serverZone.toLowerCase() === EU_SERVER_URLS.name;

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
  const isEu = config.serverZone.toLowerCase() === EU_SERVER_URLS.name;

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
    customConfig?.cohortConfig &&
    !customConfig?.cohortConfig.cohortServerUrl
  ) {
    config.cohortConfig.cohortServerUrl = isEu
      ? EU_SERVER_URLS.cohort
      : CohortConfigDefaults.cohortServerUrl;
  }
  return config;
};
