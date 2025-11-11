// Imports
import React, { useState } from 'react'

// Tab imports
import { SettingsTabs } from './Tabs/SettingsTabs'
import { AccessibilitySettings } from './Tabs/AccessibilitySettings'
import { DataManagement } from './Tabs/DataManagement'
import { LegalSettings } from './Tabs/LegalSettings'

// Main Settings Panel Component
export const SettingsPanel = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('accessibility')

  // Render settings panel with tab navigation and content
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="flex gap-6">
        
        {/* Left Navigation Tabs */}
        <SettingsTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        
        {/* Right Content Area */}
        <div className="flex-1 bg-[var(--bg-secondary)] rounded-lg p-6">
          
          {/* Accessibility Tab Content */}
          {activeTab === 'accessibility' && <AccessibilitySettings />}
          
          {/* Data Management Tab Content */}
          {activeTab === 'data' && <DataManagement />}
          
          {/* Legal Tab Content */}
          {activeTab === 'legal' && <LegalSettings />}
        </div>
      </div>
    </div>
  )
}