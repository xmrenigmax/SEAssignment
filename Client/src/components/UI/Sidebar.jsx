import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SettingsButton } from './SettingsButton';
import { SidebarSearch } from './SidebarSearch';
import { useChatContext } from '../../context/ChatContext';

/**
 * Gemini-Style Navigation Sidebar.
 * Supports two visual states: "Expanded" (Full width) and "Collapsed" (Icon Rail).
 * * **Functional Requirements Met:**
 * - FR8: Displays scrollable history of current conversation.
 * - FR9: Allows user to clear/delete conversation history.
 * * **UX Features:**
 * - Responsive design (Mobile Overlay vs Desktop Rail).
 * - Search filtering for history.
 * - Collapsible interface to maximize chat space (NFR1).
 * * @component
 * @param {Object} props - Component props
 * @param {string} props.activeView - Current active view ('chat' or 'settings').
 * @param {Function} props.setActiveView - State setter to switch views.
 * @param {boolean} props.isCollapsed - Desktop rail state (true = icons only).
 * @param {Function} props.toggleCollapse - Toggles desktop rail.
 * @param {boolean} props.isMobileOpen - Mobile menu state.
 * @param {Function} props.toggleMobile - Toggles mobile menu.
 */
export const Sidebar = ({
  activeView,
  setActiveView,
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  toggleMobile
}) => {
  // Global Chat State from Context
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    startNewChat,
    deleteConversation,
    syncConversations,
    loadConversation
  } = useChatContext();

  // Local state for filtering history
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Effect: Syncs conversation list with the backend on mount.
   * Prevents "404 Not Found" errors by ensuring local IDs match server IDs.
   */
  useEffect(() => {
    syncConversations();
  }, [syncConversations]);

  /**
   * Effect: Loads full details (messages) when a conversation is selected.
   */
  useEffect(() => {
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  /**
   * Filters the conversation list based on the search input.
   * Checks against Conversation Title and Message Content.
   */
  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.messages?.[0]?.text || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Resets the view to a fresh chat session.
   * Clears search filters and closes mobile menu if open.
   */
  const handleNewChat = () => {
    startNewChat();
    setActiveView('chat');
    setSearchTerm('');
    if (window.innerWidth < 768) toggleMobile();
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[var(--bg-secondary)] border-r border-[var(--border)]
          flex flex-col transition-all duration-300 ease-in-out
          /* Mobile Logic */
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          /* Desktop Logic (Rail vs Full) */
          ${isCollapsed ? 'md:w-20' : 'md:w-72'}
        `}
        aria-label="Sidebar Navigation"
      >
        <div className="p-4 flex flex-col gap-6 flex-shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3 pl-1 animate-in fade-in duration-200">
                <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white font-serif font-bold shadow-sm">
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
                aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={toggleMobile} className="md:hidden p-2 text-[var(--text-secondary)]" aria-label="Close menu">✕</button>
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
            aria-label="Start new chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">New Chat</span>}
          </button>
        </div>
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
                  {searchTerm ? 'Results' : 'Recent'}
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
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setActiveConversationId(conv.id)}
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
                    aria-label="Delete Conversation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-2 opacity-30" title="History hidden">
              <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full" />
            </div>
          )}
        </div>
        <div className={`p-4 border-t border-[var(--border)] flex ${isCollapsed ? 'flex-col gap-4 items-center' : 'items-center justify-between'}`}>
          <ThemeToggle isCollapsed={isCollapsed} />
          {!isCollapsed && <div className="h-6 w-px bg-[var(--border)] mx-1" role="presentation" />}
          <SettingsButton activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
};