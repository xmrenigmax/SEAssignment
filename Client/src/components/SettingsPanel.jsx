// Imports
import React, { useState } from 'react'

// Setting Panel
export const SettingsPanel = () => {
  // State for active tab and settings
  const [activeTab, setActiveTab] = useState('accessibility') // Current active tab
  const [fontSize, setFontSize] = useState('medium') // Font size setting
  const [ttsEnabled, setTtsEnabled] = useState(false) // Text-to-speech toggle

  // Render 
  return (
    // Title
    <div className="flex-1 max-w-4xl mx-auto w-full p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="flex gap-6">

        {/* Left Tabs - Navigation */}
        <div className="w-48 space-y-2">

          {/* button to stylise depending on active or inactive tabs*/}
          {['accessibility', 'data', 'legal'].map((tab) => (
            
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left p-3 rounded-lg capitalize ${
                activeTab === tab ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-secondary)]' }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Right Content - Tab panels */}
        <div className="flex-1 bg-[var(--bg-secondary)] rounded-lg p-6">
          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              {/* Font size selector */}
              <div>
                <label className="block mb-2 font-medium">Font Size</label>
                <div className="flex gap-2">

                  {/*style depending on selected size v unselected size*/}
                  {['small', 'medium', 'large', 'x-large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-4 py-2 rounded capitalize ${
                        fontSize === size? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-primary)]'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Text-to-speech toggle */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    onChange={(e) => setTtsEnabled(e.target.checked)}/>
                  Text-to-Speech
                </label>
              </div>

              {/* High contrast mode toggle */}
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  High Contrast Mode
                </label>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <button className="button bg-red-500 hover:bg-red-600">
                Delete All Chat History
              </button>
              <button className="button bg-green-500 hover:bg-green-600">
                Export Data as JSON
              </button>
            </div>
          )}

          {/* Legal Tab */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <button className="block w-full text-left p-3 hover:bg-[var(--bg-primary)] rounded">
                Terms of Service
              </button>
              <button className="block w-full text-left p-3 hover:bg-[var(--bg-primary)] rounded">
                Privacy Policy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}