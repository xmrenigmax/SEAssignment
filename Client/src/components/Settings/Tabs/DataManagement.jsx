// Imports
import React from 'react'

// Data management settings component
export const DataManagement = () => {
  return (
    <div className="space-y-4">
      
      {/* Delete chat history button */}
      <button className="button bg-red-500 hover:bg-red-600">
        Delete All Chat History
      </button>
      
      {/* Export data button */}
      <button className="button bg-green-500 hover:bg-green-600">
        Export Data as JSON
      </button>
    </div>
  )
}