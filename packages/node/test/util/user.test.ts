import { USER_GROUP_TYPE } from 'src/types/cohort';
import { ExperimentUser } from 'src/types/user';
import { convertUserToEvaluationContext } from 'src/util/user';

describe('userToEvaluationContext', () => {
  test('user, groups and group properties', () => {
    const user: ExperimentUser = {
      device_id: 'device_id',
      user_id: 'user_id',
      country: 'country',
      city: 'city',
      language: 'language',
      platform: 'platform',
      version: 'version',
      user_properties: { k: 'v' },
      groups: { type: ['name'] },
      group_properties: { type: { name: { gk: 'gv' } } },
    };
    const context = convertUserToEvaluationContext(user);
    expect(context).toEqual({
      user: {
        device_id: 'device_id',
        user_id: 'user_id',
        country: 'country',
        city: 'city',
        language: 'language',
        platform: 'platform',
        version: 'version',
        user_properties: { k: 'v' },
      },
      groups: {
        type: {
          group_name: 'name',
          group_properties: { gk: 'gv' },
        },
      },
    });
  });
  test('only user', () => {
    const user: ExperimentUser = {
      device_id: 'device_id',
      user_id: 'user_id',
      country: 'country',
      city: 'city',
      language: 'language',
      platform: 'platform',
      version: 'version',
      user_properties: { k: 'v' },
    };
    const context = convertUserToEvaluationContext(user);
    expect(context).toEqual({
      user: {
        device_id: 'device_id',
        user_id: 'user_id',
        country: 'country',
        city: 'city',
        language: 'language',
        platform: 'platform',
        version: 'version',
        user_properties: { k: 'v' },
      },
    });
  });
  test('only groups and group properties', () => {
    const user: ExperimentUser = {
      groups: { type: ['name'] },
      group_properties: { type: { name: { gk: 'gv' } } },
    };
    const context = convertUserToEvaluationContext(user);
    expect(context).toEqual({
      groups: {
        type: {
          group_name: 'name',
          group_properties: { gk: 'gv' },
        },
      },
    });
  });
  test('only groups', () => {
    const user: ExperimentUser = {
      groups: { type: ['name'] },
    };
    const context = convertUserToEvaluationContext(user);
    expect(context).toEqual({
      groups: {
        type: {
          group_name: 'name',
        },
      },
    });
  });
  test('cohorts', () => {
    const user: ExperimentUser = {
      user_id: 'userId',
      groups: { grouptype: ['groupname'] },
      cohort_ids: ['cohort1'],
      group_cohort_ids: {
        grouptype: {
          groupname: ['cohort1'],
        },
      },
    };

    const context = convertUserToEvaluationContext(user);
    expect(context).toEqual({
      user: {
        user_id: 'userId',
        cohort_ids: ['cohort1'],
      },
      groups: {
        grouptype: {
          group_name: 'groupname',
          cohort_ids: ['cohort1'],
        },
      },
    });
  });
});
