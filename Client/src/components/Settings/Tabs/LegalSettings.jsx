// Imports
import React from 'react'

// Legal settings component
export const LegalSettings = () => {
  return (
    <div className="space-y-4">
      
      {/* Terms of Service link */}
      <button className="block w-full text-left p-3 hover:bg-[var(--bg-primary)] rounded">
        Terms of Service
      </button>
      
      {/* Privacy Policy link */}
      <button className="block w-full text-left p-3 hover:bg-[var(--bg-primary)] rounded">
        Privacy Policy
      </button>
    </div>
  )
}