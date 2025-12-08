import React, { createContext, useContext, useState, useEffect } from 'react';

// Context Creation
const ThemeContext = createContext();

/**
 * Theme Provider.
 * Manages the global state of the application theme (Dark/Light).
 * Handles LocalStorage persistence and DOM class manipulation.
 */
export const ThemeProvider = ({ children }) => {

  // Priority: LocalStorage -> System Preference -> Default to True (Dark)
  const [isDark, setIsDark] = useState(() => {
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

  // Centralised Effect to update DOM and Storage
  useEffect(() => {

    // Write to Storage
    window.localStorage.setItem('theme', JSON.stringify(isDark));

    // Update HTML Class
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
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