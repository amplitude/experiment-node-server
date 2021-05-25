import { SkylabClient } from '@amplitude/skylab-js-client';
import { AppProps } from 'next/app';
import { ReactNode } from 'react';

import { SkylabProvider } from '../contexts/skylabContext';
import { SkylabServer } from '../lib/skylab';
import '../styles/globals.css';

let skylab;

function MyApp(appProps: AppProps): ReactNode {
  const { Component, pageProps } = appProps;
  console.debug('Rendering');
  const isServerSide = typeof window === 'undefined';
  if (isServerSide) {
    console.debug('Initializing Client Skylab');
    // on the server, we want to create a new SkylabClient every time
    skylab = new SkylabClient('client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR', {
      initialFlags: appProps['features'],
      isServerSide,
    });
  } else {
    if (!skylab) {
      // in the client, we only want to create the SkylabClient once
      skylab = new SkylabClient('client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR', {
        initialFlags: appProps['features'],
        isServerSide,
      });
    }
  }
  // add Skylab to the global object for debugging
  globalThis.Skylab = skylab;
  return (
    <SkylabProvider value={skylab}>
      <Component {...pageProps} />
    </SkylabProvider>
  );
}

MyApp.getInitialProps = async ({ ctx }) => {
  // Fetch data from external APIs
  if (ctx.req) {
    // called on server
    console.debug('Fetching Skylab variants');
    const allFeatures = await SkylabServer.instance().getVariants({
      id: 'userId',
    });
    return { features: allFeatures };
  } else {
    console.debug('Client side re-render');
    return {};
  }
};

export default MyApp;
