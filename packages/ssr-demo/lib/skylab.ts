let SkylabServer;
if (typeof window === 'undefined') {
  console.debug('Initializing Server Skylab');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SkylabServer = require('@amplitude/skylab-js-server').Skylab;
  SkylabServer.init('client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR', {
    debug: true,
  });
}

export { SkylabServer };
