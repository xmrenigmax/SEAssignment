import React from 'react';

/**
 * Navigation Sidebar for Settings Modal.
 * Uses a modern "Ghost" style for tabs to fit the UI better.
 * * @component
 * @param {Object} props
 * @param {string} props.activeTab - ID of the current tab
 * @param {Function} props.setActiveTab - State setter
 */
export const SettingsTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'accessibility', label: 'Accessibility', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: 'data', label: 'Data', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { id: 'legal', label: 'Legal', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
    // New Tab for Assignment Credits
    { id: 'about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="w-full md:w-64 space-y-1 pr-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
            activeTab === tab.id
              ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <svg className={`w-5 h-5 ${activeTab === tab.id ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
          </svg>
          <span>{tab.label}</span>
          {activeTab === tab.id && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>
      ))}
    </div>
  );
};