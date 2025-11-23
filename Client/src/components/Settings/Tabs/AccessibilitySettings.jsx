import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

/**
 * Accessibility Settings Panel.
 * Implements NFR9 (Font Size) and NFR7 (High Contrast).
 * * @component
 */
export const AccessibilitySettings = () => {
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useLocalStorage('high-contrast', false);

  // Handle Font Size Change
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'small') root.style.fontSize = '14px';
    if (fontSize === 'medium') root.style.fontSize = '16px';
    if (fontSize === 'large') root.style.fontSize = '18px';
  }, [fontSize]);

  // Handle High Contrast Change
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.style.filter = 'contrast(1.5)';
    } else {
      root.style.filter = 'none';
    }
  }, [highContrast]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2">Accessibility</h2>
        <p className="text-[var(--text-secondary)]">Customize the interface to suit your needs.</p>
      </div>
      
      {/* NFR9: Font Size */}
      <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
        <label className="block text-sm font-semibold mb-4">Text Size (NFR9)</label>
        <div className="grid grid-cols-3 gap-4">
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`py-3 px-4 rounded-lg border transition-all ${
                fontSize === size 
                  ? 'bg-[var(--accent)] text-white border-transparent ring-2 ring-offset-2 ring-[var(--accent)]' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              <span className={`capitalize ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}>
                {size} Aa
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* NFR7: High Contrast */}
      <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] flex justify-between items-center">
        <div>
          <label className="block text-sm font-semibold">High Contrast Mode (NFR7)</label>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Increases visual distinction between elements.</p>
        </div>
        <button 
          onClick={() => setHighContrast(!highContrast)}
          className={`w-14 h-8 rounded-full transition-colors relative ${highContrast ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${highContrast ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
};