import { createContext } from 'react';

export const ExperimentContext = createContext(null);

export const ExperimentProvider = (props) => {
  const { value, children } = props;
  return (
    <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>
  );
};
