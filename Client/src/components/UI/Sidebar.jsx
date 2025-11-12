import React, { useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SettingsButton } from './SettingsButton';
import { useChat } from '../../hooks/useChat';

// Sidebar component
export const Sidebar = ({ activeView, setActiveView, isOpen, toggleSidebar, sidebarWidth, setSidebarWidth }) => {
  // Chat hook for conversations
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    startNewChat,
    deleteConversation,
    loadConversation
  } = useChat();

  // Load conversation from backend when selected
  useEffect(() => {
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  // Handle starting a new chat
  const handleNewChat = () => {
    startNewChat();
    setActiveView('chat');
  };

  // Handle clicking on a conversation
  const handleConversationClick = async (conversationId) => {
    setActiveConversationId(conversationId);
    setActiveView('chat');
  };

  // Handle width adjustment
  const handleWidthChange = (newWidth) => {
    setSidebarWidth(newWidth);
  };

  // Render sidebar
  return (
    <>
      {/* Overlay for mobile only */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar - Different behavior for mobile vs desktop */}
      <div 
        className={`
          /* Mobile: Fixed overlay style */
          fixed lg:relative inset-y-0 left-0 z-50
          bg-[var(--bg-secondary)] border-r border-[var(--border)] 
          flex flex-col 
          /* Mobile: Slide in/out animation */
          transform transition-all duration-300 ease-in-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:min-w-0'}
        `}
        style={{ width: isOpen ? `${sidebarWidth}px` : '0', minWidth: isOpen ? `${sidebarWidth}px` : '0' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--accent)] whitespace-nowrap">Marcus Aurelius</h1>
            {/* Close button - show on both mobile and desktop */}
            <button 
              onClick={toggleSidebar} 
              className="p-1 rounded hover:bg-[var(--bg-primary)]"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2 flex-shrink-0">
          <button
            onClick={() => setActiveView('chat')}
            className={`w-full text-left p-3 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'chat' ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)]'
            }`}
          >
            💬 Chat
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 p-4 border-t border-[var(--border)] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium whitespace-nowrap">Conversations</h3>
            <button onClick={handleNewChat} className="text-sm text-[var(--accent)] hover:underline whitespace-nowrap">
              New
            </button>
          </div>

          <div className="space-y-1">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`p-2 rounded hover:bg-[var(--bg-primary)] cursor-pointer text-sm truncate flex justify-between items-center ${
                  activeConversationId === conversation.id ? 'bg-[var(--bg-primary)] border border-[var(--accent)]' : ''
                }`}
              >
                <span className="flex-1 truncate">{conversation.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="text-xs opacity-50 hover:opacity-100 ml-2 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-sm text-gray-500 text-center p-2">No conversations yet</p>
            )}
          </div>
        </div>

        {/* Width Controls - Only show on desktop when sidebar is open */}
        {isOpen && (
          <div className="p-2 border-t border-[var(--border)] flex justify-between items-center flex-shrink-0">
            <span className="text-xs text-gray-500 whitespace-nowrap">Width:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleWidthChange(256)}
                className={`text-xs px-2 py-1 rounded ${
                  sidebarWidth === 256 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white'
                }`}
              >
                S
              </button>
              <button
                onClick={() => handleWidthChange(320)}
                className={`text-xs px-2 py-1 rounded ${
                  sidebarWidth === 320 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white'
                }`}
              >
                M
              </button>
              <button
                onClick={() => handleWidthChange(384)}
                className={`text-xs px-2 py-1 rounded ${
                  sidebarWidth === 384 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white'
                }`}
              >
                L
              </button>
            </div>
          </div>
        )}

        {/* Footer with Theme Toggle and Settings */}
        <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <SettingsButton 
              activeView={activeView}
              setActiveView={setActiveView}
            />
          </div>
        </div>
      </div>
    </>
  );
};