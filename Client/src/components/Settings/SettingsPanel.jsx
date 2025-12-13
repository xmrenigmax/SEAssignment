import React, { useState, useEffect } from 'react';
import { SettingsTabs } from './Tabs/SettingsTabs';
import { AccessibilitySettings } from './Tabs/AccessibilitySettings';
import { DataManagement } from './Tabs/DataManagement';
import { LegalSettings } from './Tabs/LegalSettings';
import { AboutSettings } from './Tabs/AboutSettings';

/**
 * Main Settings Modal Component.
 * Renders as a full-screen overlay on top of the main application interface.
 * @component
 * @param {object} props - The component props.
 * @param {function(): void} props.onClose - Function to close the modal and return to the chat view.
 * @returns {JSX.Element} The SettingsPanel component modal interface.
 */
export const SettingsPanel = ( { onClose } ) => {
  /**
   * State hook for managing which tab is currently visible in the panel.
   * Defaults to 'accessibility'.
   * @type {[string, function(string): void]}
   */
  const [activeTab, setActiveTab] = useState('accessibility');

  // Close modal on escape key
  useEffect(() => {
    /**
     * Handles the keydown event to close the modal on 'Escape'.
     * @param {KeyboardEvent} event - The keyboard event object.
     * @returns {void}
     */
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      };
    };
    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={ onClose }
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="bg-[var(--bg-secondary)] w-full max-w-4xl max-h-[85vh] min-h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[var(--border)] animate-in zoom-in-95 duration-200"
        onClick={ ( event ) => event.stopPropagation() }
      >
        <div className="md:hidden p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="font-bold text-lg">Settings</h2>
          <button onClick={ onClose } className="p-2 hover:bg-[var(--bg-primary)] rounded-full">
            ✕
          </button>
        </div>
        <div className="w-full md:w-64 bg-[var(--bg-primary)] p-4 border-r border-[var(--border)] flex flex-col">
          <h2 className="hidden md:block text-2xl font-bold mb-6 px-2">Settings</h2>
          <SettingsTabs activeTab={ activeTab } setActiveTab={ setActiveTab } />
          <div className="mt-auto hidden md:block pt-6 border-t border-[var(--border)]">
            <button
              onClick={ onClose }
              className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              ← Back to Chat
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          { activeTab === 'accessibility' && <AccessibilitySettings /> }
          { activeTab === 'data' && <DataManagement /> }
          { activeTab === 'legal' && <LegalSettings /> }
          { activeTab === 'about' && <AboutSettings /> }
        </div>
        <button
          onClick={ onClose }
          className="hidden md:flex absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-[var(--border)]"
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>
    </div>
  );
};