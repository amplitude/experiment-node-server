import { assert } from 'console';

import { EvaluationFlag } from '@amplitude/experiment-core';
import { CohortUtils } from 'src/util/cohort';

test('test extract cohortIds from flags', async () => {
  // Flag definition is not complete, only those useful for thest is included.
  const rawFlags = [
    {
      key: 'flag1',
      segments: [
        {
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'user', 'cohort_ids'],
                values: ['hahahaha1'],
              },
            ],
          ],
        },
        {
          metadata: {
            segmentName: 'All Other Users',
          },
          variant: 'off',
        },
      ],
      variants: {},
    },
    {
      key: 'flag2',
      segments: [
        {
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'user', 'cohort_ids'],
                values: ['hahahaha2'],
              },
            ],
          ],
          metadata: {
            segmentName: 'Segment 1',
          },
          variant: 'off',
        },
        {
          metadata: {
            segmentName: 'All Other Users',
          },
          variant: 'off',
        },
      ],
      variants: {},
    },
    {
      key: 'flag3',
      metadata: {
        deployed: true,
        evaluationMode: 'local',
        experimentKey: 'exp-1',
        flagType: 'experiment',
        flagVersion: 6,
      },
      segments: [
        {
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'user', 'cohort_ids'],
                values: ['hahahaha3'],
              },
            ],
          ],
          variant: 'off',
        },
        {
          metadata: {
            segmentName: 'All Other Users',
          },
          variant: 'off',
        },
      ],
      variants: {},
    },
    {
      key: 'flag5',
      segments: [
        {
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'user', 'cohort_ids'],
                values: ['hahahaha3', 'hahahaha4'],
              },
            ],
          ],
        },
        {
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'groups', 'org name', 'cohort_ids'],
                values: ['hahaorgname1'],
              },
            ],
          ],
          metadata: {
            segmentName: 'Segment 1',
          },
        },
      ],
      variants: {},
    },
  ];

  const flags: Record<string, EvaluationFlag> = {};
  for (const f of rawFlags) {
    flags[f.key] = f;
  }
  const expected: Record<string, Set<string>> = {
    User: new Set(['hahahaha1', 'hahahaha2', 'hahahaha3', 'hahahaha4']),
    'org name': new Set(['hahaorgname1']),
  };
  const actual = CohortUtils.extractCohortIdsByGroup(flags);
  expect(actual).toStrictEqual(expected);
});
