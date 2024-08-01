import { CohortUtils } from 'src/util/cohort';

import { FLAGS } from './mockData';

test('test extract cohortIds from flags', async () => {
  expect(
    CohortUtils.extractCohortIdsByGroupFromFlag(FLAGS['flag1']),
  ).toStrictEqual({
    User: new Set(['usercohort1']),
  });
  expect(
    CohortUtils.extractCohortIdsByGroupFromFlag(FLAGS['flag2']),
  ).toStrictEqual({
    User: new Set(['usercohort2']),
  });
  expect(
    CohortUtils.extractCohortIdsByGroupFromFlag(FLAGS['flag3']),
  ).toStrictEqual({
    User: new Set(['usercohort3', 'usercohort4']),
  });
  expect(
    CohortUtils.extractCohortIdsByGroupFromFlag(FLAGS['flag4']),
  ).toStrictEqual({
    User: new Set(['usercohort3', 'usercohort4']),
    'org name': new Set(['orgnamecohort1']),
  });
  expect(CohortUtils.extractCohortIds(FLAGS)).toStrictEqual(
    new Set([
      'usercohort1',
      'usercohort2',
      'usercohort3',
      'usercohort4',
      'orgnamecohort1',
    ]),
  );
});
