import evaluation from '@amplitude/evaluation-js';

import { ConsoleLogger } from '../logger/console';
import { FlagConfig } from '../types/flag';
import { ExperimentUser } from '../types/user';
import { Variants } from '../types/variant';
import { Logger } from '../util/logger';

type EvaluationVariant = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
};

type FlagResult = {
  variant: EvaluationVariant;
};

type EvaluationResult = Record<string, FlagResult>;

export class FlagConfigEvaluator {
  private readonly logger: Logger;
  public constructor(debug = false) {
    this.logger = new ConsoleLogger(debug);
  }
  /**
   * Locally evaluates variants for a user given an array of
   * {@link FlagConfig}s.
   *
   * @param user The user to evaluate
   * @param flags The flags to evaluate.
   * @returns The evaluated variants
   */
  public async evaluate(
    user: ExperimentUser,
    flagConfigs: FlagConfig[],
  ): Promise<Variants> {
    this.logger.debug(
      '[Experiment] evaluate - user:',
      user,
      'flagConfigs:',
      flagConfigs,
    );
    const results: Variants = evaluation.evaluate(flagConfigs, user);
    this.logger.debug('[Experiment] evaluate - result: ', results);
    return results;
  }
}
