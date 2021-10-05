import { Experiment, ExperimentClient } from '@amplitude/experiment-js-client';
import { AppProps } from 'next/app';
import { ReactNode } from 'react';

import { ExperimentProvider } from '../contexts/experimentContext';
import { ExperimentServer } from '../lib/experiment';
import '../styles/globals.css';

let experiment: ExperimentClient;

function MyApp(appProps: AppProps): ReactNode {
  const { Component, pageProps } = appProps;
  console.debug('Rendering');
  const isServerSide = typeof window === 'undefined';
  if (isServerSide) {
    console.debug('Initializing Client Experiment');
    // on the server, we want to create a new ExperimentClient every time
    experiment = new ExperimentClient(
      'client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR',
      {
        debug: true,
        initialVariants: appProps['features'],
      },
    );
    experiment.setUser(appProps['user']);
  } else if (!experiment) {
    // in the client, we only want to create the ExperimentClient once
    experiment = Experiment.initialize(
      'client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR',
      {
        debug: true,
        initialVariants: appProps['features'],
      },
    );
  }
  // add Experiment to the global object for debugging
  globalThis.Experiment = experiment;
  return (
    <ExperimentProvider value={experiment}>
      <Component {...pageProps} />
    </ExperimentProvider>
  );
}

MyApp.getInitialProps = async ({ ctx }) => {
  if (ctx.req) {
    // called on server
    console.debug('Evaluating Experiment variants');
    const user = { user_id: 'brian.giori' };
    const allFeatures = await ExperimentServer.evaluate(user);
    return { user: user, features: allFeatures };
  } else {
    console.debug('Client side re-render');
    return {};
  }
};

export default MyApp;
