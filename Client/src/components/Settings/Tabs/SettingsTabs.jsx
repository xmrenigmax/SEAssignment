// Imports
import React from 'react'

// Tab navigation component for settings
export const SettingsTabs = ({ activeTab, setActiveTab }) => {
  // Available tab options
  const tabs = ['accessibility', 'data', 'legal']

  return (
    <div className="w-48 space-y-2">
      
      {/* Map through tabs and render buttons */}
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`w-full text-left p-3 rounded-lg capitalize ${
            activeTab === tab 
              ? 'bg-[var(--accent)] text-white' 
              : 'hover:bg-[var(--bg-secondary)]'
          }`}>
          {tab}
        </button>
      ))}
    </div>
  )
}