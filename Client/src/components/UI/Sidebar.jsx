// Imports
import React from 'react'
import { ThemeToggle } from './ThemeToggle'

// Sidebar component with props for navigation state
export const Sidebar = ({ activeView, setActiveView, isOpen, toggleSidebar }) => {
   
   // If sidebar is closed, show minimal toggle button
   if (!isOpen) {
    return (
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-[var(--bg-secondary)] rounded-md border border-[var(--border)]"
        aria-label="Open sidebar">

        {/* Hamburger menu icon */}
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    )
  }

  // Main sidebar when open
  return (
    <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col">
      {/* Header with title and close button */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--accent)]">Marcus Aurelius</h1>

          {/* Close sidebar button */}
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-[var(--bg-primary)]" aria-label="Close sidebar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main navigation buttons */}
      <div className="p-4 space-y-2">

        {/* Chat view button */}
        <button
          onClick={() => setActiveView('chat')}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            activeView === 'chat' ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)]'}`}>
          💬 Chat
        </button>

        {/* Settings view button */}
        <button
          onClick={() => setActiveView('settings')}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            activeView === 'settings' 
              ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)]'}`}>
          ⚙️ Settings
        </button>
      </div>

      {/* Chat history section */}
      <div className="flex-1 p-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Conversations</h3>
          
          {/* New chat button */}
          <button className="text-sm text-[var(--accent)] hover:underline">New</button>
        </div>

        {/* Chat history list - placeholder items */}
        <div className="space-y-1">
          <div className="p-2 rounded hover:bg-[var(--bg-primary)] cursor-pointer text-sm truncate">
            Discussion about Stoicism
          </div>
          <div className="p-2 rounded hover:bg-[var(--bg-primary)] cursor-pointer text-sm truncate">
            Philosophy questions
          </div>
        </div>
      </div>

      {/* Footer with theme toggle */}
      <div className="p-4 border-t border-[var(--border)]">
        <ThemeToggle />
      </div>
    </div>
  )
}