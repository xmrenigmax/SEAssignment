import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sidebar } from '../components/UI/Sidebar';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { SettingsPanel } from '../components/Settings/SettingsPanel';
import { MuseumTour } from '../components/Settings/Tabs/MuseumTour';
import { useSidebarResizer } from '../hooks/useSidebarResizer';
import clsx from 'clsx';


/**
* Landing Page Layout.
* Refactored for WCAG Reflow (400% zoom) by moving breakpoints to lg.
*/
const Landing = () => {
const { hasCompletedTour, setHasCompletedTour } = useOutletContext();
const [activeView, setActiveView] = useState('chat');
const [isCollapsed, setIsCollapsed] = useState(false);
const [isMobileOpen, setIsMobileOpen] = useState(false);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [isTourOpen, setIsTourOpen] = useState(false);


// Initialize the Resizer Hook here
const { sidebarWidth, startResizing, isResizing, sidebarRef } = useSidebarResizer(288);

  // Show welcome tour on first visit (localStorage persistence)
  // Tour explains Stoic philosophy and UI features to new users
useEffect(() => {
  if (!hasCompletedTour) {
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


 // Calculates dynamic width for the CSS variable
const currentSidebarWidth = isCollapsed ? '5rem' : `${ sidebarWidth }px`;


return (
  <div className="min-h-screen flex flex-wrap lg:flex-nowrap bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden transition-colors duration-200" style={{ '--sidebar-width': currentSidebarWidth, transition: isResizing ? 'none' : undefined }}>
    <MuseumTour isOpen={isTourOpen} onClose={handleTourClose} />
    <Sidebar activeView={ activeView } setActiveView={ handleViewChange } isCollapsed={ isCollapsed} toggleCollapse={ () => setIsCollapsed(!isCollapsed) } isMobileOpen={ isMobileOpen} toggleMobile={ () => setIsMobileOpen(!isMobileOpen) } sidebarWidth={ sidebarWidth } startResizing={ startResizing } isResizing={ isResizing } sidebarRef={ sidebarRef }/>
    <main className={ clsx( "flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out", "lg:ml-[var(--sidebar-width)]") } style={{ transition: isResizing ? 'none' : 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="lg:hidden hide-at-high-zoom p-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={ () => setIsMobileOpen(true) } className="p-2 mr-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]" aria-label="Open Sidebar Menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-serif font-bold text-lg">Marcus Aurelius</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatPanel toggleMobile={() => setIsMobileOpen(true)} />
      </div>
      { isSettingsOpen && ( <SettingsPanel onClose={ () => { setIsSettingsOpen(false); setActiveView('chat'); }} onStartTour={ () => setIsTourOpen(true) }/> )}
      </main>
    </div>
  );
};

export default Landing;