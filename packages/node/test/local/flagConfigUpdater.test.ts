/* eslint-disable @typescript-eslint/no-empty-function */
import { InMemoryFlagConfigCache } from 'src/index';
import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { CohortFetcher } from 'src/local/cohort/fetcher';
import { InMemoryCohortStorage } from 'src/local/cohort/storage';
import { FlagConfigUpdaterBase } from 'src/local/updater';
import { CohortUtils } from 'src/util/cohort';

import { FLAGS, NEW_FLAGS } from './util/mockData';
import { MockHttpClient } from './util/mockHttpClient';

class TestFlagConfigUpdaterBase extends FlagConfigUpdaterBase {
  public async update(flagConfigs, onChange) {
    await super._update(flagConfigs, onChange);
  }
  public async downloadNewCohorts(cohortIds) {
    return await super.downloadNewCohorts(cohortIds);
  }
  public async removeUnusedCohorts(validCohortIds) {
    return await super.removeUnusedCohorts(validCohortIds);
  }
}

const createCohort = (cohortId) => ({
  cohortId,
  groupType: '',
  groupTypeId: 0,
  lastComputed: 0,
  lastModified: 0,
  size: 0,
  memberIds: new Set<string>([]),
});

let updater: TestFlagConfigUpdaterBase;
beforeEach(() => {
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async (options) => {
      if (options.cohortId === 'anewcohortid') throw Error();
      return {
        cohortId: options.cohortId,
        groupType: '',
        groupTypeId: 0,
        lastComputed: 0,
        lastModified: 0,
        size: 0,
        memberIds: new Set<string>([]),
      };
    });
  const cache = new InMemoryFlagConfigCache();
  const cohortStorage = new InMemoryCohortStorage();
  const cohortFetcher = new CohortFetcher(
    '',
    '',
    new MockHttpClient(async () => ({ status: 200, body: '' })),
  );
  updater = new TestFlagConfigUpdaterBase(
    cache,
    cohortStorage,
    cohortFetcher,
    false,
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

test('FlagConfigUpdaterBase, update success', async () => {
  await updater.update(FLAGS, () => {});
  expect(await updater.cache.getAll()).toStrictEqual(FLAGS);
});

test('FlagConfigUpdaterBase, update no error even if cohort download error', async () => {
  await updater.update(NEW_FLAGS, () => {});
  expect(await updater.cache.getAll()).toStrictEqual(NEW_FLAGS);
});

test('FlagConfigUpdaterBase.downloadNewCohorts', async () => {
  const failedCohortIds = await updater.downloadNewCohorts(
    CohortUtils.extractCohortIds(NEW_FLAGS),
  );
  expect(updater.cohortStorage.getAllCohortIds()).toStrictEqual(
    CohortUtils.extractCohortIds(FLAGS),
  );
  expect(failedCohortIds).toStrictEqual(new Set<string>(['anewcohortid']));
});

test('FlagConfigUpdaterBase.removeUnusedCohorts', async () => {
  CohortUtils.extractCohortIds(NEW_FLAGS).forEach((cohortId) => {
    updater.cohortStorage.put(createCohort(cohortId));
  });
  await updater.removeUnusedCohorts(CohortUtils.extractCohortIds(FLAGS));
  expect(updater.cohortStorage.getAllCohortIds()).toStrictEqual(
    CohortUtils.extractCohortIds(FLAGS),
  );
});
