import { ExperimentUser } from '../types/user';

export const convertUserToEvaluationContext = (
  user: ExperimentUser | undefined,
): Record<string, unknown> => {
  if (!user) {
    return {};
  }
  const userGroups = user.groups;
  const userGroupProperties = user.group_properties;
  const userGroupCohortIds = user.group_cohort_ids;
  const context: Record<string, unknown> = {};
  user = { ...user };
  delete user['groups'];
  delete user['group_properties'];
  delete user['group_cohort_ids'];
  if (Object.keys(user).length > 0) {
    context['user'] = user;
  }
  const groups: Record<string, Record<string, unknown>> = {};
  if (!userGroups) {
    return context;
  }
  for (const groupType of Object.keys(userGroups)) {
    const groupNames = userGroups[groupType];
    if (groupNames.length > 0 && groupNames[0]) {
      const groupName = groupNames[0];
      const groupNameMap: Record<string, unknown> = {
        group_name: groupName,
      };
      // Check for group properties
      const groupProperties = userGroupProperties?.[groupType]?.[groupName];
      if (groupProperties && Object.keys(groupProperties).length > 0) {
        groupNameMap['group_properties'] = groupProperties;
      }
      // Check for group cohort ids.
      const groupCohortIds = userGroupCohortIds?.[groupType]?.[groupName];
      if (groupCohortIds && Object.keys(groupCohortIds).length > 0) {
        groupNameMap['cohort_ids'] = groupCohortIds;
      }
      groups[groupType] = groupNameMap;
    }
  }
  if (Object.keys(groups).length > 0) {
    context['groups'] = groups;
  }
  return context;
};
