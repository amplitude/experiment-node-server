import evaluation from '@amplitude/evaluation-interop';

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
    const resultsString = evaluation.evaluate(
      JSON.stringify(flagConfigs),
      JSON.stringify(user),
    );
    this.logger.debug('[Experiment] evaluate - result:', resultsString);
    // Parse variant results
    const results: EvaluationResult = JSON.parse(resultsString);
    const variants: Variants = {};
    Object.keys(results).forEach((key) => {
      variants[key] = {
        value: results[key].variant.key,
        payload: results[key].variant.payload,
      };
    });
    return variants;
  }
}
