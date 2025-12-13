import React, { useState } from 'react';
import { Sidebar } from '../components/UI/Sidebar';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { SettingsPanel } from '../components/Settings/SettingsPanel';
import { ChatProvider } from '../context/ChatContext';

/**
 * Landing Page Layout.
 * Manages the "Gemini-style" responsive layout.
 * Logic:
 * - Mobile: Sidebar is an overlay (controlled by isMobileOpen).
 * - Desktop: Sidebar is a rail (controlled by isCollapsed).
 */
const Landing = () => {
  const [activeView, setActiveView] = useState('chat');

  // State for Desktop "Rail" Mode
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for Mobile Overlay
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'settings') setIsSettingsOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden transition-colors duration-200">
      <Sidebar
        activeView={activeView}
        setActiveView={handleViewChange}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        toggleMobile={() => setIsMobileOpen(!isMobileOpen)}
      />
      <main className={`
        flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? 'md:ml-20' : 'md:ml-72'}
      `}>
        <div className="md:hidden p-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 mr-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-serif font-bold text-lg">Marcus Aurelius</span>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatPanel />
        </div>
        {isSettingsOpen && (
          <SettingsPanel onClose={() => { setIsSettingsOpen(false); setActiveView('chat'); }} />
        )}
      </main>
    </div>
  );
};

export default Landing;