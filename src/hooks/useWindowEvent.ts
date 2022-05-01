import { useEffect, useMemo, useRef } from 'react';

export function useWindowEvent(
  eventName: keyof WindowEventMap,
  callback: (event: Event) => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const handler = useMemo(
    () => (event: Event) => {
      callbackRef.current(event);
    },
    [],
  );

  useEffect(() => {
    window.addEventListener(eventName, handler, { passive: true });

    return () => {
      window.removeEventListener(eventName, handler);
    };
  }, []);
}
