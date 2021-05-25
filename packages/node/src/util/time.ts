export const sleep = (millis: number): Promise<void> => {
  if (millis === 0) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, millis));
};
