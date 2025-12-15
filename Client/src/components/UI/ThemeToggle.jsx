import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';

/**
 * Theme Toggle Component.
 * Switches between Light and Dark modes.
 * @component Consumes global ThemeContext to ensure all buttons stay in sync.
 * @param {Object} props
 * @param {boolean} props.isCollapsed If true, hides the text label and centers the icon.
 */
export const ThemeToggle = ({ isCollapsed }) => {

  // Use the global state instead of local state
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      onClick={ toggleTheme } 
      className={ clsx("flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200", "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)]", "hover:border-[var(--accent)] hover:text-[var(--accent)]", "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]", isCollapsed ? 'justify-center w-10 h-10' : 'flex-1 justify-center') }
      title={ isDark ? "Switch to Light Mode" : "Switch to Dark Mode" }
      aria-label={ isDark ? "Switch to Light Mode" : "Switch to Dark Mode" }
      type="button"
    >
      { isDark ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
      { !isCollapsed && ( <span className="text-sm font-medium whitespace-nowrap"> { isDark ? 'Light' : 'Dark' } </span> )}
    </button>
  );
};