import React from 'react';
import { useChatContext } from '../../../context/ChatContext';

/**
 * Data Management Tab.
 * Styled to match the Accessibility UI.
 * Addresses FR9 (Clear) and FR10 (Export).
 * * @component
 */
export const DataManagement = () => {
  const { conversations, syncConversations } = useChatContext();

  const handleExport = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marcus-aurelius-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure? This will wipe your local history.')) {
      localStorage.removeItem('chat-conversations');
      localStorage.removeItem('active-conversation');
      // Force sync to clear UI
      syncConversations();
      window.location.reload(); 
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Data & Privacy</h2>
        <p className="text-[var(--text-secondary)]">Control your conversation data.</p>
      </div>

      <div className="grid gap-4">
        {/* Export Card */}
        <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Export History (FR10)</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Download JSON backup.</p>
          </div>
          <button 
            onClick={handleExport}
            disabled={conversations.length === 0}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            Download
          </button>
        </div>

        {/* Delete Card */}
        <div className="p-6 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">Clear Data (FR9)</h3>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">Permanently delete all chats.</p>
          </div>
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 bg-white dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>
  );
};