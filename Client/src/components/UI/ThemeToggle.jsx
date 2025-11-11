
// Import
import { useState, useEffect } from 'react';

// Theme toggle component for light/dark mode
export const ThemeToggle = () => {

  // State for tracking current theme
  const [isDark, setIsDark] = useState(true);

  // Initialize theme
  useEffect(() => {
    // saved data
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply light theme if set // preferred
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
      setIsDark(false);
      document.documentElement.classList.add('light');
    }
    // Default is dark theme 
    else {
      setIsDark(true);
      document.documentElement.classList.remove('light');
    }
  }, []);

  // Toggle modes
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } 
    else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // returns main component
  return (
    <button
    // calls theme toggle
      onClick={toggleTheme}
      className="p-2 rounded-md transition-all duration-200 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
      // Accessible label changes based on current theme
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/*Using Heroicons rather than emojis or lucide react (outdated)*/}
      {isDark ? (
        // Sun icon - shows when in dark mode (click to switch to light)
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon - shows when in light mode (click to switch to dark)
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};