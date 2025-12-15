import React, { useRef, useState } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { DeleteConfirmationModal } from '../../UI/DeleteConfirmationModal';
import clsx from 'clsx';
import { get } from 'lodash';

/**
 * Data Management Tab Component.
 * @component
 * @returns {JSX.Element} The DataManagement component.
 */
export const DataManagement = () => {
  /**
   * Destructures necessary functions and data from the chat context.
   * @type {{conversations: Array<Object>, clearAllConversations: function(): void, importConversations: function(Array<Object>): void}}
   */
  const { conversations, clearAllConversations, importConversations } = useChatContext();

  /**
   * Ref for accessing the hidden file input element.
   * @type {React.RefObject<HTMLInputElement>}
   */
  const fileInputRef = useRef(null);

  /**
   * State for managing the import operation status (e.g., 'success', 'error', or '').
   * @type {[string, function(string): void]}
   */
  const [importStatus, setImportStatus] = useState('');

  /**
   * State for managing the delete all confirmation modal.
   * @type {[boolean, function(boolean): void]}
   */
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  /**
   * Serializes current conversations to JSON and triggers browser download.
   * @returns {void}
   */
  const handleExport = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `marcus-aurelius-history-${ new Date().toISOString().split('T')[0] }.json`;
    link.click();

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /**
   * Proxies the click to the hidden file input element to open the file selection dialog.
   * @returns {void}
   */
  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * handleFileChange
   * Reads the selected JSON file and attempts to merge into the chat context.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file change event.
   * @returns {void}
   */
  const handleFileChange = async (event) => {

    // Safe access even if event structure is unexpected
    const file = get(event, 'target.files.0');
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (fileReaderEvent) => {
      try {
        const json = JSON.parse(fileReaderEvent.target.result);
        importConversations(json);
        setImportStatus('success');

        // Reset success message after 3s
        setTimeout(() => setImportStatus(''), 3000);
      } catch (error) {
        console.error("Import failed:", error);
        setImportStatus('error');
        setTimeout(() => setImportStatus(''), 3000);
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllModal(true);
  };

  const handleDeleteAllConfirm = () => {
    clearAllConversations();
    setShowDeleteAllModal(false);
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllConfirm}
        conversationTitle="All Conversations"
      />
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Data & Privacy</h2>
        <p className="text-[var(--text-secondary)]">Control your conversation data.</p>
      </div>
      <div className="grid gap-4">
        <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">Export History</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Download JSON backup.</p>
          </div>
          <button
            onClick={ handleExport }
            disabled={ conversations.length === 0 }
            className={ clsx( "px-4 py-2 border rounded-lg transition-colors", "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]", "hover:border-[var(--accent)] hover:text-[var(--accent)]", "disabled:opacity-50 disabled:cursor-not-allowed" )}>
            Download
          </button>
        </div>
        <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">Import History</h3>
              { importStatus && (
                <span className={ clsx("text-xs font-medium", importStatus === 'success' ? "text-green-500" : "text-red-500") }>
                  { importStatus === 'success' ? "Success!" : "Invalid JSON" }
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Restore conversations from backup.</p>
          </div>
          <input type="file" ref={ fileInputRef } onChange={ handleFileChange } accept=".json" className="hidden"/>
          <button onClick={ triggerImportClick } className={ clsx( "px-4 py-2 border rounded-lg transition-colors", "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]", "hover:border-[var(--accent)] hover:text-[var(--accent)]" )}>
            Import JSON
          </button>
        </div>
        <div className="p-6 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">Clear Data </h3>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">Permanently delete all chats from server & local.</p>
          </div>
          <button onClick={ handleDeleteAllClick } className={ clsx("px-4 py-2 border rounded-lg transition-colors", "bg-white dark:bg-red-950/30 border-red-200 dark:border-red-800", "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20") }>
            Delete All
          </button>
        </div>
      </div>
      </div>
    </>
  );
};