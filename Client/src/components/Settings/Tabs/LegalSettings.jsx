import React from 'react';

/**
 * Legal and About Information.
 * * @component
 */
export const LegalSettings = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2">About & Legal</h2>
        <p className="text-[var(--text-secondary)]">Project information and attributions.</p>
      </div>

      <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white text-xl font-serif">
            M
          </div>
          <div>
            <h3 className="font-bold text-lg">Marcus Aurelius Chatbot</h3>
            <p className="text-sm text-[var(--text-secondary)]">Version 1.0.0 (Release Candidate)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h4 className="font-semibold mb-1">Assignment</h4>
            <p className="text-[var(--text-secondary)]">Software Engineering 25/26</p>
          </div>
          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h4 className="font-semibold mb-1">University</h4>
            <p className="text-[var(--text-secondary)]">Bournemouth University</p>
          </div>
          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h4 className="font-semibold mb-1">Developers</h4>
            <p className="text-[var(--text-secondary)]">Group 1</p>
          </div>
          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h4 className="font-semibold mb-1">Tech Stack</h4>
            <p className="text-[var(--text-secondary)]">React, Express, Tailwind, Hugging Face</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          <p className="italic text-center text-[var(--text-secondary)] font-serif">
            "Waste no more time arguing what a good man should be. Be one."
          </p>
        </div>
      </div>
    </div>
  );
};