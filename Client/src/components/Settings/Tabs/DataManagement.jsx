import React, { useRef, useState } from 'react';
import { useChatContext } from '../../../context/ChatContext';

/**
 * Data Management Tab.
 * Styled to match the Accessibility UI.
 * Addresses FR9 (Clear), FR10 (Export), and Import functionality.
 * * @component
 */
export const DataManagement = () => {
  const {
    conversations,
    clearAllConversations,
    importConversations
  } = useChatContext();

  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState('');

  /**
   * TriggerExport
   * Serializes current conversations to JSON and triggers browser download.
   */
  const handleExport = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `marcus-aurelius-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /**
   * triggerImportClick
   * Proxies the click to the hidden file input.
   */
  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * handleFileChange
   * Reads the selected JSON file and attempts to merge into context.
   */
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        importConversations(json);
        setImportStatus('success');

        // Reset success message after 3s
        setTimeout(() => setImportStatus(''), 3000);
      } catch (error) {
        console.error("Import failed:", error);
        setImportStatus('error');
        setTimeout(() => setImportStatus(''), 3000);
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Data & Privacy</h2>
        <p className="text-[var(--text-secondary)]">Control your conversation data.</p>
      </div>
      <div className="grid gap-4">
        <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">Export History (FR10)</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Download JSON backup.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={conversations.length === 0}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 text-[var(--text-primary)]"
          >
            Download
          </button>
        </div>
        <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">Import History</h3>
              {importStatus === 'success' && <span className="text-xs text-green-500 font-medium">Success!</span>}
              {importStatus === 'error' && <span className="text-xs text-red-500 font-medium">Invalid JSON</span>}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Restore conversations from backup.</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={triggerImportClick}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[var(--text-primary)]"
          >
            Import JSON
          </button>
        </div>
        <div className="p-6 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">Clear Data (FR9)</h3>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">Permanently delete all chats from server & local.</p>
          </div>
          <button
            onClick={clearAllConversations}
            className="px-4 py-2 bg-white dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>
  );
};