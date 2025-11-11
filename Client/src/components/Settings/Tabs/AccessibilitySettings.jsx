// Imports
import React, { useState } from 'react'

// Accessibility settings component
export const AccessibilitySettings = () => {
  // State for accessibility settings
  const [fontSize, setFontSize] = useState('medium')
  const [ttsEnabled, setTtsEnabled] = useState(false)

  return (
    <div className="space-y-6">
      
      {/* Font size selector section */}
      <div>
        <label className="block mb-2 font-medium">Font Size</label>
        <div className="flex gap-2">
          
          {/* Font size options */}
          {['small', 'medium', 'large', 'x-large'].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-4 py-2 rounded capitalize ${
                fontSize === size 
                  ? 'bg-[var(--accent)] text-white' 
                  : 'bg-[var(--bg-primary)]'
              }`}>
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
            onChange={(e) => setTtsEnabled(e.target.checked)}
          />
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
  )
}