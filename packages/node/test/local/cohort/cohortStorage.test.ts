import { InMemoryCohortStorage } from 'src/local/cohort/storage';
import { USER_GROUP_TYPE } from 'src/types/cohort';

const C_A = {
  cohortId: 'c_a',
  groupType: 'a',
  groupTypeId: 0,
  lastComputed: 0,
  lastModified: 0,
  size: 2,
  memberIds: new Set<string>(['membera1', 'membera2']),
};
const C_B = {
  cohortId: 'c_b',
  groupType: 'b',
  groupTypeId: 1,
  lastComputed: 1,
  lastModified: 1,
  size: 2,
  memberIds: new Set<string>(['memberb1', 'memberball']),
};
const C_B2 = {
  cohortId: 'c_b2',
  groupType: 'b',
  groupTypeId: 1,
  lastComputed: 1,
  lastModified: 1,
  size: 2,
  memberIds: new Set<string>(['memberb2', 'memberball']),
};
const C_U1 = {
  cohortId: 'c_u1',
  groupType: USER_GROUP_TYPE,
  groupTypeId: 1,
  lastComputed: 1,
  lastModified: 1,
  size: 2,
  memberIds: new Set<string>(['user1', 'user2']),
};
const C_U2 = {
  cohortId: 'c_u2',
  groupType: USER_GROUP_TYPE,
  groupTypeId: 1,
  lastComputed: 1,
  lastModified: 1,
  size: 3,
  memberIds: new Set<string>(['user1', 'user2', 'user3']),
};
const C_U3 = {
  cohortId: 'c_u3',
  groupType: USER_GROUP_TYPE,
  groupTypeId: 1,
  lastComputed: 1,
  lastModified: 1,
  size: 1,
  memberIds: new Set<string>(['user1']),
};

test('cohort storage put, delete, getAllCohortIds, getCohort', async () => {
  const storage = new InMemoryCohortStorage();

  // {C_A}
  storage.put(C_A);
  expect(storage.getAllCohortIds()).toStrictEqual(
    new Set<string>([C_A.cohortId]),
  );
  expect(storage.getCohort(C_A.cohortId)).toBe(C_A);
  expect(storage.getCohort(C_B.cohortId)).toBeUndefined();

  // {C_B}
  storage.delete(C_A.cohortId);
  storage.put(C_B);
  expect(storage.getAllCohortIds()).toStrictEqual(
    new Set<string>([C_B.cohortId]),
  );
  expect(storage.getCohort(C_A.cohortId)).toBeUndefined();
  expect(storage.getCohort(C_B.cohortId)).toBe(C_B);

  // {C_A, C_B, C_B2}
  storage.put(C_A);
  storage.put(C_B);
  storage.put(C_B2);
  expect(storage.getAllCohortIds()).toStrictEqual(
    new Set<string>([C_A.cohortId, C_B.cohortId, C_B2.cohortId]),
  );
  expect(storage.getCohort(C_A.cohortId)).toBe(C_A);
  expect(storage.getCohort(C_B.cohortId)).toBe(C_B);
  expect(storage.getCohort(C_B2.cohortId)).toBe(C_B2);

  // {C_B, C_B2}
  storage.delete(C_A.cohortId);
  expect(storage.getAllCohortIds()).toStrictEqual(
    new Set<string>([C_B.cohortId, C_B2.cohortId]),
  );
});

test('cohort storage getCohortsForGroup', async () => {
  const storage = new InMemoryCohortStorage();

  // {C_A}
  storage.put(C_A);

  expect(
    storage.getCohortsForGroup(
      'a',
      'membera1',
      new Set<string>([C_A.cohortId]),
    ),
  ).toStrictEqual(new Set<string>([C_A.cohortId]));
  expect(
    storage.getCohortsForGroup(
      'a',
      'membera1',
      new Set<string>([C_A.cohortId, C_B.cohortId]),
    ),
  ).toStrictEqual(new Set<string>(['c_a']));
  expect(
    storage.getCohortsForGroup(
      'b',
      'memberb1',
      new Set<string>([C_A.cohortId, C_B.cohortId]),
    ),
  ).toStrictEqual(new Set<string>());

  // {C_A, C_B, C_B2}
  storage.put(C_B);
  storage.put(C_B2);

  expect(
    storage.getCohortsForGroup(
      'a',
      'membera1',
      new Set<string>(['c_a', C_B.cohortId]),
    ),
  ).toStrictEqual(new Set<string>(['c_a']));
  expect(
    storage.getCohortsForGroup(
      'b',
      'memberb1',
      new Set<string>(['c_a', C_B.cohortId]),
    ),
  ).toStrictEqual(new Set<string>([C_B.cohortId]));
  expect(
    storage.getCohortsForGroup(
      'b',
      'memberball',
      new Set<string>(['c_a', C_B.cohortId, C_B2.cohortId]),
    ),
  ).toStrictEqual(new Set<string>([C_B.cohortId, C_B2.cohortId]));
});

test('cohort storage getCohortsForUser', async () => {
  const storage = new InMemoryCohortStorage();
  storage.put(C_U1);
  storage.put(C_U2);
  storage.put(C_U3);

  expect(
    storage.getCohortsForUser(
      'user1',
      new Set<string>([C_U1.cohortId, C_U2.cohortId, C_U3.cohortId]),
    ),
  ).toStrictEqual(
    new Set<string>([C_U1.cohortId, C_U2.cohortId, C_U3.cohortId]),
  );

  expect(
    storage.getCohortsForUser(
      'user2',
      new Set<string>([C_U1.cohortId, C_U2.cohortId, C_U3.cohortId]),
    ),
  ).toStrictEqual(new Set<string>([C_U1.cohortId, C_U2.cohortId]));

  expect(
    storage.getCohortsForUser(
      'user3',
      new Set<string>([C_U1.cohortId, C_U2.cohortId, C_U3.cohortId]),
    ),
  ).toStrictEqual(new Set<string>([C_U2.cohortId]));

  expect(
    storage.getCohortsForUser(
      'nonexistinguser',
      new Set<string>([C_U1.cohortId, C_U2.cohortId, C_U3.cohortId]),
    ),
  ).toStrictEqual(new Set<string>());

  expect(
    storage.getCohortsForUser(
      'user1',
      new Set<string>([C_U1.cohortId, C_U2.cohortId]),
    ),
  ).toStrictEqual(new Set<string>([C_U1.cohortId, C_U2.cohortId]));
});
