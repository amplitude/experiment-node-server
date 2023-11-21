import { ExperimentUser } from '../types/user';

export const convertUserToContext = (
  user: ExperimentUser | undefined,
): Record<string, unknown> => {
  if (!user) {
    return {};
  }
  const context: Record<string, unknown> = { user: user };
  const groups: Record<string, Record<string, unknown>> = {};
  if (!user.groups) {
    return context;
  }
  for (const groupType of Object.keys(user.groups)) {
    const groupNames = user.groups[groupType];
    if (groupNames.length > 0 && groupNames[0]) {
      const groupName = groupNames[0];
      const groupNameMap: Record<string, unknown> = {
        group_name: groupName,
      };
      // Check for group properties
      const groupProperties = user.group_properties?.[groupType]?.[groupName];
      if (groupProperties && Object.keys(groupProperties).length > 0) {
        groupNameMap['group_properties'] = groupProperties;
      }
      groups[groupType] = groupNameMap;
    }
  }
  if (Object.keys(groups).length > 0) {
    context['groups'] = groups;
  }
  delete context.user['groups'];
  delete context.user['group_properties'];
  return context;
};
