import { useState, useEffect } from 'react';
import clsx from 'clsx';

/**
 * Navigation Sidebar for Settings Modal Component.
 * @component
 * @param {object} props - The component props.
 * @param {string} props.activeTab - ID of the currently selected tab.
 * @param {function(string): void} props.setActiveTab - State setter function to change the active tab.
 * @returns {JSX.Element} The SettingsTabs component, including loading/error states.
 */
export const SettingsTabs = ({ activeTab, setActiveTab, onStartTour }) => {

  /**
   * State hook to store the navigation tabs, fetched from the public JSON file.
   * @type {[Array<TabItem>, function(Array<TabItem>): void]}
   */
  const [tabs, setTabs] = useState([]);

  /**
   * State hook for managing the data fetching status (e.g., 'loading', 'error', 'success').
   * @type {[string, function(string): void]}
   */
  const [status, setStatus] = useState('loading');

  // useEffect hook to fetch tab data from the public JSON file when the component mounts.
  useEffect(() => {
    const controller = new AbortController();
    const settingsPath = '/data/settings-tabs.json';

    /**
     * Fetches the navigation tab configuration from the public directory.
     * @async
     * @returns {void}
     */
    const fetchTabs = async () => {
      try {
        setStatus('loading');

        const response = await fetch(settingsPath, { signal: controller.signal });

        if (!response.ok) {
          console.error(`Fetch failed for path: ${ settingsPath }. HTTP Status: ${ response.status }`);
          throw new Error(`Failed to load settings data. HTTP Status: ${ response.status }`);
        };

        const data = await response.json();
        setTabs(data);
        setStatus('success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Critical error fetching settings tabs.", error);
          setStatus('error');
        }
      };
    };

    fetchTabs();

    return () => controller.abort();
  }, []);

  return (
    <div className="w-full md:w-64 space-y-1 pr-2">
      { tabs.map((tab) => (
        <button
          key={ tab.id }
          onClick={ () => setActiveTab(tab.id) }
          className={ clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
            activeTab === tab.id
              ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          <svg className={ clsx("w-5 h-5", activeTab === tab.id && "animate-pulse") } fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d={ tab.icon } />
          </svg>
          <span>{ tab.label }</span>
          { activeTab === tab.id && ( <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]"/> )}
        </button>
      ))}
      <div className="pt-4 mt-2 border-t border-[var(--border)]">
        <button onClick={ onStartTour } className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 font-medium">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Take a Tour</span>
        </button>
      </div>
    </div>
  );
};