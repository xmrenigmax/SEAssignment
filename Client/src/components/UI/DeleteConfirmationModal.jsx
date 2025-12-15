import React from 'react';

/**
 * Confirmation modal for deleting conversations.
 * Styled to match the site's theme and design system.
 * @param {object} props
 * @param {boolean} props.isOpen - Visibility state of the modal
 * @param {function} props.onClose - Function to close/cancel the modal
 * @param {function} props.onConfirm - Function to confirm deletion
 * @param {string} props.conversationTitle - Title of the conversation to delete
 */
export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, conversationTitle }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={ handleBackdropClick }
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-[var(--bg-primary)] p-6 border-b border-[var(--border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-50" aria-hidden="true"></div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-red-500 opacity-80" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" role="img" aria-label="Warning icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Confirm Action</h2>
          </div>
          <h1 id="delete-modal-title" className="text-2xl font-serif font-bold text-[var(--text-primary)]">Delete Conversation</h1>
        </div>
        <div id="delete-modal-description" className="p-6 space-y-4">
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to delete this conversation? This action cannot be undone.
          </p>
          <div className="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border)]">
            <p className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 tracking-wide">Conversation</p>
            <p className="text-sm text-[var(--text-primary)] font-medium truncate">
              { conversationTitle || 'New Chat' }
            </p>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={ onClose }
            className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-all text-sm font-medium border border-[var(--border)]"
            type="button"
            aria-label="Cancel deletion and close dialog"
          >
            Cancel
          </button>
          <button
            onClick={ onConfirm }
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:shadow-lg transition-all text-sm font-medium flex items-center gap-2"
            type="button"
            aria-label={`Confirm deletion of conversation: ${conversationTitle || 'New Chat'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
