export const FLAGS = [
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

export const NEW_FLAGS = {
  ...FLAGS,
  flag6: {
    key: 'flag6',
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['anewcohortid'],
            },
          ],
        ],
      },
    ],
    variants: {},
  },
};
