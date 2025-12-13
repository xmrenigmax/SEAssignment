import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sidebar } from '../components/UI/Sidebar';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { SettingsPanel } from '../components/Settings/SettingsPanel';
// CHECK THIS PATH: Where did you save MuseumTour.jsx?
import { MuseumTour } from '../components/Settings/Tabs/MuseumTour';

/**
 * Landing Page Layout.
 * Logic:
 * Mobile: Sidebar is an overlay (controlled by isMobileOpen).
 * Desktop: Sidebar is a rail (controlled by isCollapsed).
 */
const Landing = () => {
  // Safe Context Access
  const context = useOutletContext();

  // Fallback if context is missing (prevents crash)
  const hasCompletedTour = context ? context.hasCompletedTour : true;
  const setHasCompletedTour = context ? context.setHasCompletedTour : () => {};

  const [activeView, setActiveView] = useState('chat');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  /**
   * Effect: Check for first-time visit.
   */
  useEffect(() => {
    // Explicit check for false to avoid undefined issues
    if (hasCompletedTour === false) {
      setIsTourOpen(true);
    }
  }, [hasCompletedTour]);

  const handleTourClose = () => {
    setIsTourOpen(false);
    setHasCompletedTour(true);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'settings') setIsSettingsOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden transition-colors duration-200">
      <MuseumTour isOpen={ isTourOpen } onClose={ handleTourClose } />
      <Sidebar
        activeView={ activeView }
        setActiveView={ handleViewChange }
        isCollapsed={ isCollapsed}
        toggleCollapse={ () => setIsCollapsed(!isCollapsed) }
        isMobileOpen={ isMobileOpen}
        toggleMobile={ () => setIsMobileOpen(!isMobileOpen) }
      />
      <main className={`flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out ${ isCollapsed ? 'md:ml-20' : 'md:ml-72' }` }>
        <div className="md:hidden p-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center">
          <button onClick={() => setIsMobileOpen(true) } className="p-2 mr-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-serif font-bold text-lg">Marcus Aurelius</span>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatPanel />
        </div>
        { isSettingsOpen && (
          <SettingsPanel
            onClose={ () => { setIsSettingsOpen(false); setActiveView('chat'); }}
            onStartTour={ () => setIsTourOpen(true) }
          />
        )}
      </main>
    </div>
  );
};

export default Landing;