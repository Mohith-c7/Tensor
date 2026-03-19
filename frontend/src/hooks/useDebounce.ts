import { useState, useEffect } from 'react';

/**
 * Debounce a value by the given delay in ms.
 * Requirements: 6.2, 13.6
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
