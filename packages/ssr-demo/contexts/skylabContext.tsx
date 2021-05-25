import { createContext } from 'react';

export const SkylabContext = createContext(null);

export const SkylabProvider = (props) => {
  const { value, children } = props;
  return (
    <SkylabContext.Provider value={value}>{children}</SkylabContext.Provider>
  );
};
