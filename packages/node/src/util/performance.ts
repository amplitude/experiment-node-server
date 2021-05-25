// eslint-disable-next-line @typescript-eslint/no-explicit-any
let performance = (global as any).performance;
if (!performance) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    performance = require('perf_hooks').performance;
  } catch {
    // pass
  }
}

if (!performance) {
  performance = {
    now: (): number => new Date().getTime(),
  };
}

export { performance };
