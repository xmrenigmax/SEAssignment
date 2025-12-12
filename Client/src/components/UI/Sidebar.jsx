import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SettingsButton } from './SettingsButton';
import { SidebarSearch } from './SidebarSearch';
import { MuseumGuideModal } from '../History/MusuemGuideModal';
import { useChatContext } from '../../context/ChatContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useSidebarResizer } from '../../hooks/UseSidebarResizer';

/**
 * Navigation Sidebar.
 */
export const Sidebar = ({
  activeView,
  setActiveView,
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  toggleMobile
}) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    startNewChat,
    deleteConversation,
    syncConversations,
    loadConversation
  } = useChatContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [showMuseumModal, setShowMuseumModal] = useState(false);

  // Debounce search term by 300ms
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Custom hook for resizing logic
  const { sidebarWidth, startResizing, isResizing, sidebarRef } = useSidebarResizer(288);

  // --- Effects ---
  useEffect(() => {
    syncConversations();
  }, [syncConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  // Filtering
  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    (conv.messages?.[0]?.text || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Handlers
  const handleNewChat = () => {
    startNewChat();
    setActiveView('chat');
    setSearchTerm('');
    if (window.innerWidth < 768) toggleMobile();
  };

  return (
    <>
      <MuseumGuideModal isOpen={showMuseumModal} onClose={() => setShowMuseumModal(false)} />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 bg-[var(--bg-secondary)] border-r border-[var(--border)]
          flex flex-col
          /* Mobile Logic: Fixed width, slide in/out */
          ${isMobileOpen ? 'translate-x-0 w-[85vw] max-w-xs shadow-2xl' : '-translate-x-full md:translate-x-0'}
          /* Desktop Logic: Dynamic width or fixed collapsed width */
          ${isCollapsed ? 'md:w-20' : ''}
        `}
        style={{
          // Only apply dynamic width on Desktop when Expanded
          width: !isCollapsed && !isMobileOpen ? sidebarWidth : undefined,
          // CRITICAL: Disable transition while resizing to prevent lag/rubber-banding
          transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease-in-out'
        }}
        aria-label="Sidebar Navigation"
      >
        {/* Resize Handle (Desktop Only, Expanded Only) */}
        {!isCollapsed && !isMobileOpen && (
          <div
            onMouseDown={startResizing}
            className={`
              absolute top-0 right-[-4px] w-2 h-full cursor-col-resize z-50 transition-colors
              ${isResizing ? 'bg-[var(--accent)]' : 'hover:bg-[var(--accent)]/50'}
            `}
            title="Drag to resize"
          />
        )}

        {/* Top Section */}
        <div className="p-4 flex flex-col gap-6 flex-shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3 pl-1 animate-in fade-in duration-200 overflow-hidden">
                <div className="w-8 h-8 flex-shrink-0 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white font-serif font-bold shadow-sm">
                  M
                </div>
                <h1 className="text-lg font-serif font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                  Marcus Aurelius
                </h1>
              </div>
            )}
            <div className="flex items-center">
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-full hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden md:block"
                title={isCollapsed ? "Expand menu" : "Collapse menu"}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={toggleMobile}
                className="md:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded-full"
              >
                ✕
              </button>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className={`
              flex items-center gap-3 transition-all duration-200 group
              ${isCollapsed
                ? 'w-10 h-10 justify-center rounded-full bg-[var(--bg-primary)] hover:text-[var(--accent)] mx-auto'
                : 'px-4 py-3 rounded-xl bg-[var(--bg-primary)] hover:shadow-md text-[var(--text-secondary)] hover:text-[var(--accent)]'
              }
            `}
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">New Chat</span>}
          </button>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-2">
          {!isCollapsed && (
            <div className="mb-4 animate-in fade-in duration-200">
              <SidebarSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
          )}

          {!isCollapsed && <div className="border-t border-[var(--border)] mx-2 mb-4" role="presentation" />}

          {!isCollapsed ? (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between px-3 mb-2">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  {debouncedSearchTerm ? 'Results' : 'Recent'}
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                  {filteredConversations.length}
                </span>
              </div>

              {filteredConversations.length === 0 && (
                <p className="px-3 text-xs text-[var(--text-secondary)] opacity-60">No history found.</p>
              )}

              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                    ${activeConversationId === conv.id
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:border-[var(--border)]'
                    }
                  `}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="truncate flex-1 text-sm">{conv.title || 'New Chat'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('Delete this conversation?')) deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-secondary)] hover:text-red-500 rounded-md transition-all"
                    title="Delete Conversation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-2 opacity-30">
              {[1, 2, 3].map(i => (<div key={i} className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full" />))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col gap-3">
          {/* Museum Button: Full width block above settings */}
          <button
            onClick={() => setShowMuseumModal(true)}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-all
              ${isCollapsed ? 'justify-center w-full' : 'w-full'}
            `}
            title="About Marcus Aurelius"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium">Exhibit Guide</span>}
          </button>

          {/* Settings & Theme Row */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between border-t border-[var(--border)] pt-3'}`}>
             <ThemeToggle isCollapsed={isCollapsed} />
             {!isCollapsed && <div className="h-4 w-px bg-[var(--border)]" role="presentation" />}
             <SettingsButton activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
};