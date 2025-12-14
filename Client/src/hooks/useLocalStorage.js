import { useState, useEffect } from 'react';

/**
 * Custom hook to manage state synchronized with localStorage.
 * Ensures data persistence across page reloads.
 * * @template T
 * @param {string} key - The localStorage key to store data under.
 * @param {T} initialValue - The default value if key doesn't exist.
 * @returns {[T, Function]} - Returns state value and setter function.
 */
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${ key }":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${ key }":`, error);
    }
  }, [key, value]);

  return [value, setValue];
};