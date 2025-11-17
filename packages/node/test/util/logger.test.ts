import { LogLevel } from 'src/types/loglevel';
import { AmplitudeLogger, LoggerProvider } from 'src/util/logger';

describe('AmplitudeLogger', () => {
  let mockLoggerProvider: jest.Mocked<LoggerProvider>;

  beforeEach(() => {
    mockLoggerProvider = {
      verbose: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  const logLevels = ['verbose', 'debug', 'info', 'warn', 'error'] as const;
  type LogMethod = (typeof logLevels)[number];

  const callAllLogMethods = (logger: AmplitudeLogger) => {
    logLevels.forEach((level) => logger[level](`${level} message`));
  };

  const expectCalled = (method: LogMethod) => {
    expect(mockLoggerProvider[method]).toHaveBeenCalledWith(
      `${method} message`,
      [],
    );
  };

  const expectNotCalled = (...methods: LogMethod[]) => {
    methods.forEach((method) => {
      expect(mockLoggerProvider[method]).not.toHaveBeenCalled();
    });
  };

  describe('log level filtering', () => {
    const testCases: Array<{
      level: LogLevel;
      description: string;
      shouldLog: LogMethod[];
    }> = [
      {
        level: LogLevel.Disable,
        description: 'should not log any messages when log level is Disable',
        shouldLog: [],
      },
      {
        level: LogLevel.Error,
        description: 'should only log error messages',
        shouldLog: ['error'],
      },
      {
        level: LogLevel.Warn,
        description: 'should log warn and error messages',
        shouldLog: ['warn', 'error'],
      },
      {
        level: LogLevel.Info,
        description: 'should log info, warn, and error messages',
        shouldLog: ['info', 'warn', 'error'],
      },
      {
        level: LogLevel.Debug,
        description: 'should log debug, info, warn, and error messages',
        shouldLog: ['debug', 'info', 'warn', 'error'],
      },
      {
        level: LogLevel.Verbose,
        description: 'should log all messages',
        shouldLog: ['verbose', 'debug', 'info', 'warn', 'error'],
      },
    ];

    testCases.forEach(({ level, description, shouldLog }) => {
      it(description, () => {
        const logger = new AmplitudeLogger(level, mockLoggerProvider);
        callAllLogMethods(logger);

        const shouldNotLog = logLevels.filter((l) => !shouldLog.includes(l));
        expectNotCalled(...shouldNotLog);
        shouldLog.forEach(expectCalled);
      });
    });
  });
});
