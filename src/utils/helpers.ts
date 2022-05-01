export function shouldExists<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) {
    // eslint-disable-next-line no-debugger,no-restricted-syntax
    debugger;
    throw new Error('Should exists');
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function neverCall(value: never): unknown {
  throw new Error('Never call');
}
