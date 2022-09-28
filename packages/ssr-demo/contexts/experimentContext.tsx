import { createContext } from 'react';

export const ExperimentContext = createContext(null);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ExperimentProvider = (props) => {
  const { value, children } = props;
  console.log('experiment provider', value);
  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
};
