// eslint-disable-next-line import/order
import EventSource from 'eventsource';
import { SdkStreamFlagApi } from 'src/local/stream-flag-api';

// const flagName = "peter-test-5";
const flagName = 'peter-test-2';
test('FlagConfigUpdater.connect, success', async () => {
  jest.setTimeout(100000);
  let notConnected = new Set([]);
  let noFlagReceived = new Set([]);
  let changed = new Set([]);
  let noFlag = 0;
  let errs = {};
  let connectError = {};
  let totalUpdates = 0;
  for (let i = 0; i < 1; i++) {
    const maxJ = 1;
    for (let j = 0; j < maxJ; j++) {
      const n = i * maxJ + j;
      notConnected.add(n);
      noFlagReceived.add(n);
      const api = new SdkStreamFlagApi(
        'server-tUTqR62DZefq7c73zMpbIr1M5VDtwY8T',
        'https://skylab-stream.stag2.amplitude.com',

        // 'server-DGZM7VCQz8pAnq0w7JKCsmPKFFJcFc73',
        // 'server-pkO9htcbpp0jtF4JdaNUx1QRzV5xCoWI',
        // 'http://localhost:7999',
        // 'https://stream.lab.amplitude.com',

        // 'server-xTVBeoujVeuXhOHzbt0wfoMO7qR0YYzK',
        // 'server-BH9F9X8Hcbkw4qqhktGPX70bZ2iAB0ku',
        // 'server-6LH7ZitI6lKImPA8iS49lNPpipM2JSCa',
        // 'https://stream.lab.eu.amplitude.com',
        (url, params) => new EventSource(url, params),
        // 1500,
        // 1500,
        // 1,
      );
      api.onError = async (err) => {
        errs[n] = err;
        console.log('error!!!!!!', err);
      };
      api.onUpdate = async (flags) => {
        changed[n] = true;
        noFlagReceived.delete(n);
        totalUpdates++;
        if (!flags) {
          noFlag++;
        }
        console.log(
          totalUpdates,
          notConnected.size < 10 ? notConnected : notConnected.size,
          noFlagReceived.size < 10 ? noFlagReceived : noFlagReceived.size,
          noFlag,
          connectError,
          errs,
        );
      };
      api
        .connect()
        .then(() => {
          notConnected.delete(n);
          console.log(
            totalUpdates,
            notConnected.size < 10 ? notConnected : notConnected.size,
            noFlagReceived.size < 10 ? noFlagReceived : noFlagReceived.size,
            noFlag,
            connectError,
            errs,
          );
        })
        .catch((err) => {
          connectError[n] = err;
          console.log(
            totalUpdates,
            notConnected.size < 10 ? notConnected : notConnected.size,
            noFlagReceived.size < 10 ? noFlagReceived : noFlagReceived.size,
            noFlag,
            connectError,
            errs,
          );
        });
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 20000));
});
