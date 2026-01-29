import { Assignment } from 'src/assignment/assignment';
import { ExperimentUser } from 'src/types/user';

describe('Assignment.canonicalize()', () => {
  test('canonicalizes with string user_id and device_id', () => {
    const user: ExperimentUser = {
      user_id: 'user123',
      device_id: 'device456',
    };
    const results = {
      'flag-key-1': { key: 'on', value: 'on' },
      'flag-key-2': { key: 'control', value: 'control' },
    };
    const assignment = new Assignment(user, results);
    expect(assignment.canonicalize()).toBe(
      'user123 device456 flag-key-1 on flag-key-2 control ',
    );
  });

  test('handles non-string user_id and device_id without throwing', () => {
    const user: ExperimentUser = {
      user_id: 12345 as any,
      device_id: 67890 as any,
    };
    const results = {
      'flag-key-1': { key: 999 as any, value: 'on' },
    };
    const assignment = new Assignment(user, results);
    expect(() => assignment.canonicalize()).not.toThrow();
    expect(assignment.canonicalize()).toBe('12345 67890 flag-key-1 999 ');
  });
});
