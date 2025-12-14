import React, { createContext, useContext, useState, useLayoutEffect } from 'react';

// Context Creation
const ThemeContext = createContext();

/**
 * Theme Provider.
 * Manages the global state of the application theme (Dark/Light).
 * Handles LocalStorage persistence and DOM class manipulation.
 */
export const ThemeProvider = ({ children }) => {

  // LocalStorage -> System Preference -> Default to True (Dark)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;

    try {
      const item = window.localStorage.getItem('theme');
      if (item !== null) {
        return JSON.parse(item);
      }
      // Fallback to system preference if no storage found
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      return true;
    }
  });

  // Use useLayoutEffect to prevent "flash of unstyled content" (FOUC) regarding colors
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    // Write to Storage
    window.localStorage.setItem('theme', JSON.stringify(isDark));

    // Update HTML Class and Style
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      { children }
    </ThemeContext.Provider>
  );
};

// Custom Hook for easy consumption
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};