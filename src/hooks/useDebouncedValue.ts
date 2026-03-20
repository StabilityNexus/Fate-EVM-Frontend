import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * The returned value only updates after the specified delay
 * has elapsed since the last change, preventing excessive
 * re-renders and computations (e.g. filtering large lists).
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds (default: 300ms).
 * @returns The debounced value.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
