// Some test flags.
// FLAGS are normal flags with cohortIds.
// NEW_FLAGS adds a flag with cohortId `anewcohortid` on top of FLAGS.

export const getFlagStrWithCohort = (
  cohortId: string,
) => `{"key":"flag_${cohortId}","segments":[{
      "conditions":[[{"op":"set contains any","selector":["context","user","cohort_ids"],"values":["${cohortId}"]}]],
      "metadata":{"segmentName": "Segment 1"},"variant": "off"
      }],"variants": {}}`;

export const getFlagWithCohort = (cohortId: string) =>
  JSON.parse(getFlagStrWithCohort(cohortId));

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
              values: ['usercohort1'],
            },
          ],
        ],
        metadata: {
          segmentName: 'Segment 1',
        },
        variant: 'on',
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {
      on: { key: 'on', value: 'on' },
      off: { key: 'off', metadata: { default: true } },
    },
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
              values: ['usercohort2'],
            },
          ],
        ],
        metadata: {
          segmentName: 'Segment 1',
        },
        variant: 'on',
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {
      on: { key: 'on', value: 'on' },
      off: { key: 'off', metadata: { default: true } },
    },
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
              values: ['usercohort3'],
            },
          ],
        ],
        variant: 'var1',
      },
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['usercohort4'],
            },
          ],
        ],
        variant: 'var2',
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
        variant: 'var2',
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {
      var1: { key: 'var1', value: 'var1value' },
      var2: { key: 'var2', value: 'var2value' },
      off: { key: 'off', metadata: { default: true } },
    },
  },
  {
    key: 'flag4',
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['usercohort3', 'usercohort4'],
            },
          ],
        ],
        variant: 'var1',
      },
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'groups', 'org name', 'cohort_ids'],
              values: ['orgnamecohort1'],
            },
          ],
        ],
        metadata: {
          segmentName: 'Segment 2',
        },
        variant: 'var2',
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
          segmentName: 'Segment 3',
        },
        variant: 'var3',
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {
      var1: { key: 'var1', value: 'var1value' },
      var2: { key: 'var2', value: 'var2value' },
      var3: { key: 'var3', value: 'var3value' },
      off: { key: 'off', metadata: { default: true } },
    },
  },
].reduce((acc, flag) => {
  acc[flag.key] = flag;
  return acc;
}, {});

export const NEW_FLAGS = {
  ...FLAGS,
  flag5: {
    key: 'flag5',
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
        variant: 'on',
      },
      {
        variant: 'off',
      },
    ],
    variants: {
      on: { key: 'on', value: 'on' },
      off: { key: 'off', metadata: { default: true } },
    },
  },
};

export const COHORTS = {
  usercohort1: {
    cohortId: 'usercohort1',
    groupType: 'User',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 1,
    size: 1,
    memberIds: new Set<string>(['membera1']),
  },
  usercohort2: {
    cohortId: 'usercohort2',
    groupType: 'User',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 2,
    size: 3,
    memberIds: new Set<string>(['membera1', 'membera2', 'membera3']),
  },
  usercohort3: {
    cohortId: 'usercohort3',
    groupType: 'User',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 10,
    size: 3,
    memberIds: new Set<string>(['membera1', 'membera3']),
  },
  usercohort4: {
    cohortId: 'usercohort4',
    groupType: 'User',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 10,
    size: 2,
    memberIds: new Set<string>(['membera1', 'membera2']),
  },
  orgnamecohort1: {
    cohortId: 'orgnamecohort1',
    groupType: 'org name',
    groupTypeId: 100,
    lastComputed: 6,
    lastModified: 10,
    size: 2,
    memberIds: new Set<string>(['org name 1', 'org name 2']),
  },
};
