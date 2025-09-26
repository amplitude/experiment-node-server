import { Experiment } from 'src/factory';
import { LocalEvaluationClient } from 'src/local/client';
import { RemoteEvaluationClient } from 'src/remote/client';

describe('Factory instance name tests', () => {
  const API_KEY = 'test-api-key';

  afterEach(() => {
    // Clear singleton instances between tests
    (Experiment as any).remoteEvaluationInstances = {};
    (Experiment as any).localEvaluationInstances = {};
  });

  describe('initializeRemote', () => {
    test('should return same instance for same API key without instance name', () => {
      const client1 = Experiment.initializeRemote(API_KEY);
      const client2 = Experiment.initializeRemote(API_KEY);
      expect(client1).toBe(client2);
    });

    test('should return different instances for same API key with different instance names', () => {
      const client1 = Experiment.initializeRemote(API_KEY, {
        instanceName: 'instance1',
      });
      const client2 = Experiment.initializeRemote(API_KEY, {
        instanceName: 'instance2',
      });
      expect(client1).not.toBe(client2);
    });

    test('should return same instance for same API key with same instance name', () => {
      const client1 = Experiment.initializeRemote(API_KEY, {
        instanceName: 'instance1',
      });
      const client2 = Experiment.initializeRemote(API_KEY, {
        instanceName: 'instance1',
      });
      expect(client1).toBe(client2);
    });
  });

  describe('initializeLocal', () => {
    test('should return same instance for same API key without instance name', () => {
      const client1 = Experiment.initializeLocal(API_KEY);
      const client2 = Experiment.initializeLocal(API_KEY);
      expect(client1).toBe(client2);
    });

    test('should return different instances for same API key with different instance names', () => {
      const client1 = Experiment.initializeLocal(API_KEY, {
        instanceName: 'instance1',
      });
      const client2 = Experiment.initializeLocal(API_KEY, {
        instanceName: 'instance2',
      });
      expect(client1).not.toBe(client2);
    });

    test('should return same instance for same API key with same instance name', () => {
      const client1 = Experiment.initializeLocal(API_KEY, {
        instanceName: 'instance1',
      });
      const client2 = Experiment.initializeLocal(API_KEY, {
        instanceName: 'instance1',
      });
      expect(client1).toBe(client2);
    });
  });

  test('should isolate remote and local instances', () => {
    const remoteClient = Experiment.initializeRemote(API_KEY);
    const localClient = Experiment.initializeLocal(API_KEY);
    expect(remoteClient).not.toBe(localClient);
    expect(remoteClient).toBeInstanceOf(RemoteEvaluationClient);
    expect(localClient).toBeInstanceOf(LocalEvaluationClient);
  });
});
