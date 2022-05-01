import { useRef } from 'react';

import { useForceUpdate } from './useForceUpdate';

export function useStateRef<T>(
  value: T,
): [{ readonly current: T }, (v: T) => void] {
  const currentValue = useRef<T>(value);
  const update = useForceUpdate();

  return [
    currentValue,
    (newValue: T) => {
      if (currentValue.current !== newValue) {
        currentValue.current = newValue;
        update();
      }
    },
  ];
}
