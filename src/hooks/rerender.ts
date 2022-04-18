import { useRef, useState } from 'react';

export function useRerender() {
  const [, setId] = useState(0);
  const valueRef = useRef(0);

  return () => {
    setId(++valueRef.current);
  };
}
