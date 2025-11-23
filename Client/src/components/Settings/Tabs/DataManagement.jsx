import React from 'react';
import { useChat } from '../../../hooks/useChat';

/**
 * Data Management Panel.
 * Implements FR10 (Export) and FR9 (Clear History).
 * * @component
 */
export const DataManagement = () => {
  const { conversations, setConversations } = useChat();

  const handleExport = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marcus_aurelius_chat_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all history? This cannot be undone.')) {
      localStorage.removeItem('chat-conversations');
      window.location.reload(); // Hard reset to clear state
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Management</h2>
        <p className="text-[var(--text-secondary)]">Manage your conversation history and exports.</p>
      </div>

      {/* FR10: Export */}
      <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Export Data (FR10)</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Download your entire chat history as a JSON file for your records.</p>
            <button 
              onClick={handleExport}
              disabled={conversations.length === 0}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>

      {/* FR9: Clear History */}
      <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
        <h3 className="font-semibold text-lg text-red-700 dark:text-red-400">Danger Zone</h3>
        <p className="text-sm text-red-600/70 mb-4">Permanently delete all conversation history.</p>
        <button 
          onClick={handleClearAll}
          className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Clear All History
        </button>
      </div>
    </div>
  );
};