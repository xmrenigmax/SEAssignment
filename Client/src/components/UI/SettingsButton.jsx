import clsx from 'clsx';

/**
 * Settings Toggle Button.
 * Opens the Settings Modal overlay.
 * Positioned in the sidebar footer.
 * * @component
 * @param {Object} props
 * @param {string} props.activeView - Current view state.
 * @param {Function} props.setActiveView - State setter for view.
 * @param {boolean} props.isCollapsed - If true, hides the text label.
 */
export const SettingsButton = ({ activeView, setActiveView, isCollapsed }) => {
  return (
    <button
      onClick={ () => setActiveView(activeView === 'settings' ? 'chat' : 'settings') }
      className={ clsx(
        "flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200",
        activeView === 'settings'
          ? "bg-[var(--accent)] text-white shadow-md"
          : "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
        isCollapsed ? "justify-center w-10 h-10" : "flex-1 justify-center"
      )}
      title="Settings"
      aria-label={activeView === 'settings' ? "Close Settings" : "Open Settings"}
      aria-pressed={activeView === 'settings'}
      type="button"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      { !isCollapsed && ( <span className="text-sm font-medium whitespace-nowrap">Settings</span> )}
    </button>
  );
};