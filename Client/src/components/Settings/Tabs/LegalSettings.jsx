import React from 'react';
import clsx from 'clsx';

/**
 * Legal Information Tab Component.
 * Displays software licensing, model attribution, and essential disclaimers.
 * Styled to match the unified card layout of other settings tabs.
 * @component
 * @returns {JSX.Element} The LegalSettings component.
 */
export const LegalSettings = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Legal Information</h2>
        <p className="text-[var(--text-secondary)]">Attributions and licenses.</p>
      </div>

      <div className={ clsx( "p-6 rounded-xl border space-y-4", "bg-[var(--bg-primary)] border-[var(--border)]" )}>
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <span className="font-semibold text-[var(--text-primary)]">Software License</span>
          <span className="text-sm bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-primary)]">
            MIT
          </span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <span className="font-semibold text-[var(--text-primary)]">AI Model</span>
          <span className="text-sm text-[var(--accent)] font-medium">Llama </span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <span className="font-semibold text-[var(--text-primary)]">Compliance with GDPR</span>
        </div>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2">
          This application connects to the Hugging Face Inference API.
          Conversations are processed by third-party AI models.
          Do not share sensitive personal information.
        </div>
      </div>
    </div>
  );
};