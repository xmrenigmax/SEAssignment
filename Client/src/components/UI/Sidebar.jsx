import React, { useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SettingsButton } from './SettingsButton';
import { useChatContext } from '../../context/ChatContext'; // Using Context

export const Sidebar = ({ activeView, setActiveView, isOpen, toggleSidebar, sidebarWidth, setSidebarWidth }) => {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    startNewChat, 
    deleteConversation, 
    syncConversations,
    loadConversation // <--- This was missing before!
  } = useChatContext();

  // 1. Sync with server on mount
  useEffect(() => {
    syncConversations();
  }, [syncConversations]);

  // 2. Load the active conversation details
  useEffect(() => {
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  const handleNewChatClick = () => {
    startNewChat(); 
    setActiveView('chat');
    if (window.innerWidth < 1024) toggleSidebar();
  };

  const handleHistoryClick = (id) => {
    setActiveConversationId(id);
    setActiveView('chat');
    if (window.innerWidth < 1024) toggleSidebar();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
      )}
      
      <div 
        className={`fixed lg:relative inset-y-0 left-0 z-50 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:min-w-0'}`}
        style={{ width: isOpen ? `${sidebarWidth}px` : '0', minWidth: isOpen ? `${sidebarWidth}px` : '0' }}
      >
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h1 className="text-xl font-bold text-[var(--accent)] truncate">Marcus Aurelius</h1>
          <button onClick={toggleSidebar} className="lg:hidden p-1 rounded hover:bg-[var(--bg-primary)]">✕</button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleNewChatClick}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 ${activeView === 'chat' && !activeConversationId ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)]'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 p-4 border-t border-[var(--border)] overflow-y-auto">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">History</h3>
          <div className="space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleHistoryClick(conv.id)}
                className={`group p-2 rounded cursor-pointer text-sm flex justify-between items-center ${activeConversationId === conv.id ? 'bg-[var(--bg-primary)] border-l-4 border-[var(--accent)]' : 'hover:bg-[var(--bg-primary)]'}`}
              >
                <span className="truncate flex-1 pr-2">{conv.title || 'New Conversation'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] italic text-center mt-4">No history found.</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]">
          <ThemeToggle />
          <SettingsButton activeView={activeView} setActiveView={setActiveView} />
        </div>
      </div>
    </>
  );
};