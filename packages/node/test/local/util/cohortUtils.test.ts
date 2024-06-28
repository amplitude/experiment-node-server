import { CohortUtils } from 'src/util/cohort';

test('test extract cohortIds from flags', async () => {
  // Flag definition is not complete, only those useful for thest is included.
  const flags = [
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
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'user', 'cocoids'],
                values: ['nohaha'],
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
        {
          conditions: [
            [
              {
                op: 'set contains any',
                selector: ['context', 'gg', 'org name', 'cohort_ids'],
                values: ['nohahaorgname'],
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
  ].reduce((acc, flag) => {
    acc[flag.key] = flag;
    return acc;
  }, {});

  expect(CohortUtils.extractCohortIdsByGroup(flags)).toStrictEqual({
    User: new Set(['hahahaha1', 'hahahaha2', 'hahahaha3', 'hahahaha4']),
    'org name': new Set(['hahaorgname1']),
  });
  expect(CohortUtils.extractCohortIds(flags)).toStrictEqual(
    new Set([
      'hahahaha1',
      'hahahaha2',
      'hahahaha3',
      'hahahaha4',
      'hahaorgname1',
    ]),
  );
});
