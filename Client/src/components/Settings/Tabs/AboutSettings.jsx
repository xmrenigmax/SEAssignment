import React from 'react';

/**
 * About/System Tab.
 * Good for "Project Report" visibility.
 * * @component
 */
export const AboutSettings = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white text-3xl font-serif shadow-lg">
          M
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Marcus Aurelius</h2>
          <p className="text-[var(--text-secondary)]">Stoic AI Companion</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold mb-2">Development Team</h3>
          <p className="text-sm text-[var(--text-secondary)]">Group 1</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Software Engineering 25/26</p>
        </div>

        <div className="p-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'Express', 'Tailwind', 'Hugging Face', 'Vite'].map(tech => (
              <span key={tech} className="text-xs px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};