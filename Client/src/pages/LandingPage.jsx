import React, { useState } from 'react';
import { Sidebar } from '../components/UI/Sidebar';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { SettingsPanel } from '../components/Settings/SettingsPanel';

// Main landing page component - Marcus Aurelius Chat interface
const Landing = () => {
  // State management for active view, sidebar visibility, and sidebar width
  const [activeView, setActiveView] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar open by default on desktop
  const [sidebarWidth, setSidebarWidth] = useState(260); // Default sidebar width matching professional chat apps

  // Render the main application layout
  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar - Conditionally rendered when open for clean DOM management */}
      {isSidebarOpen && (
        <Sidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
        />
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navigation Header - Only visible on mobile devices */}
        <div className="lg:hidden p-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-primary)] transition-colors"
            aria-label="Open sidebar menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Desktop Sidebar Toggle - Appears when sidebar is closed on desktop */}
        {!isSidebarOpen && (
          <div className="hidden lg:flex items-center p-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white transition-all duration-200"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="ml-3 text-lg font-semibold text-[var(--accent)]">Marcus Aurelius</h1>
          </div>
        )}

        {/* Dynamic Content Area - Switches between Chat and Settings views */}
        <div className="flex-1 flex flex-col">
          {activeView === 'chat' ? <ChatPanel /> : <SettingsPanel />}
        </div>
      </main>
    </div>
  );
};

export default Landing;