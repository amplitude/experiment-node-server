import {
  Experiment,
  Exposure,
  Source,
  Variant,
} from '@amplitude/experiment-js-client';
import {
  AmplitudeCookie,
  LocalEvaluationClient,
} from '@amplitude/experiment-node-server';

import { ExperimentServer } from '../lib/experiment';

let cachedVariants = undefined;
let cachedExperiment = undefined;

// Utility function to generate random string
const randomString = (length: number): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export async function getServerSideProps({ req, res }) {
  if (!req) {
    console.debug('Client side re-render');
    return {
      props: { variants: {} },
    };
  }

  if (cachedVariants) {
    return { props: { variants: cachedVariants } };
  }

  const cookieName = AmplitudeCookie.cookieName('4122ebf1f0', true);

  let variants: Record<string, Variant>;
  // Parse device id from cookie, or generate if the cookie is not set.
  const cookie = req.headers?.cookie;
  let deviceId: string | undefined;

  if (cookie) {
    const cookieValue =
      cookie.match('(^|;)\\s*' + cookieName + '\\s*=\\s*([^;]+)')?.pop() || '';
    deviceId = AmplitudeCookie.parse(cookieValue, true).device_id;
  }

  if (!deviceId) {
    // Generate device id if not found in cookie
    deviceId = randomString(32);
    res.setHeader(
      'set-cookie',
      `${cookieName}=${AmplitudeCookie.generate(deviceId)}`,
    );
  }

  const user = { device_id: deviceId };
  if (ExperimentServer instanceof LocalEvaluationClient) {
    // Evaluate user locally
    await ExperimentServer.start();
    variants = await ExperimentServer.evaluate(user);
  } else {
    // Fetch variants remotely
    variants = await ExperimentServer.fetch(user);
  }
  cachedVariants = variants;
  return { props: { variants } };
}

export function initializeExperimentClient(apiKey, initialVariants) {
  if (cachedExperiment) {
    return cachedExperiment;
  }
  const experiment = Experiment.initializeWithAmplitudeAnalytics(apiKey, {
    initialVariants: initialVariants,
    source: Source.InitialVariants,
    exposureTrackingProvider: {
      track(exposure: Exposure) {
        if (typeof window !== 'undefined') {
          console.log('Exposure:', exposure);
        }
      },
    },
  });
  cachedExperiment = experiment;
  return experiment;
}
