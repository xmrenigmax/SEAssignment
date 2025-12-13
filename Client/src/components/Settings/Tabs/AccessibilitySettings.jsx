import React, { useEffect } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Enhanced Accessibility Controls Component.
 * @component
 * @returns {JSX.Element} The AccessibilitySettings component.
 */
export const AccessibilitySettings = () => {
  /**
   * State hook for managing the base font size, stored in local storage.
   * @type {[number, (value: number) => void]}
   */
  const [fontSize, setFontSize] = useLocalStorage('font-size-px', 16);

  /**
   * State hook for managing the high contrast mode setting.
   * @type {[boolean, (value: boolean) => void]}
   */
  const [highContrast, setHighContrast] = useLocalStorage('high-contrast', false);

  /**
   * State hook for managing the dyslexia friendly font setting.
   * @type {[boolean, (value: boolean) => void]}
   */
  const [dyslexicFont, setDyslexicFont] = useLocalStorage('dyslexic-font', false);

  /**
   * State hook for managing the reduced motion setting.
   * @type {[boolean, (value: boolean) => void]}
   */
  const [reducedMotion, setReducedMotion] = useLocalStorage('reduced-motion', false);

  /**
   * Context hook to access the current theme state and toggle function.
   * @type {{isDark: boolean, toggleTheme: () => void}}
   */
  const { isDark, toggleTheme } = useTheme();

  //  Apply the selected font size to the document's root element.
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  // Apply High Contrast
  useEffect(() => {
    document.documentElement.style.filter = highContrast ? 'contrast(1.5)' : 'none';
  }, [highContrast]);

  // Apply Dyslexic Font
  useEffect(() => {
    if (dyslexicFont) {
      document.body.style.fontFamily = 'Comic Sans MS, "Chalkboard SE", "Comic Neue", sans-serif';
      document.body.style.letterSpacing = '0.05em';
      document.body.style.lineHeight = '1.6';
    } else {
      document.body.style.fontFamily = '';
      document.body.style.letterSpacing = '';
      document.body.style.lineHeight = '';
    }
  }, [dyslexicFont]);

  // Apply Reduced Motion
  useEffect(() => {
    /** @type {HTMLElement} */
    const root = document.documentElement;

    if (reducedMotion) {
      root.style.scrollBehavior = 'auto';

      const style = document.createElement('style');
      style.id = 'reduced-motion-style';
      style.innerHTML = '*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }';
      document.head.appendChild(style);

    } else {
      root.style.scrollBehavior = 'smooth';

      const existing = document.getElementById('reduced-motion-style');
      if (existing) existing.remove();
    }
  }, [reducedMotion]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Accessibility & View</h2>
        <p className="text-[var(--text-secondary)]">Customize the interface for your reading comfort.</p>
      </div>
      <div className="p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <label htmlFor="font-slider" className="font-semibold">Text Size</label>
          <span className="text-sm font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border)]">
            {fontSize}px
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-[var(--text-secondary)]">A</span>
          <input
            id="font-slider"
            type="range"
            min="12"
            max="24"
            step="1"
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="flex-1 h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            aria-label="Adjust font size"
          />
          <span className="text-xl font-bold text-[var(--text-secondary)]">A</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-3">Drag to adjust the base text size.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleCard
          label="Dark Mode"
          description="Switch between light and dark themes."
          active={isDark}
          onToggle={toggleTheme}
        />
        <ToggleCard
          label="High Contrast"
          description="Increases visual distinction."
          active={highContrast}
          onToggle={() => setHighContrast(!highContrast)}
        />
        <ToggleCard
          label="Dyslexia Friendly"
          description="Uses accessible fonts and spacing."
          active={dyslexicFont}
          onToggle={() => setDyslexicFont(!dyslexicFont)}
        />
        <ToggleCard
          label="Reduced Motion"
          description="Disables animations and transitions."
          active={reducedMotion}
          onToggle={() => setReducedMotion(!reducedMotion)}
        />
      </div>
    </div>
  );
};

// Helper component for cleaner code
/**
 * A reusable card component for toggling accessibility settings.
 * @component
 * @param {object} props - The component props.
 * @param {string} props.label - The title of the toggle setting.
 * @param {string} props.description - A short description of the setting's function.
 * @param {boolean} props.active - The current state of the toggle (on/off).
 * @param {function(): void} props.onToggle - The function to call when the toggle is activated.
 * @returns {JSX.Element} The ToggleCard component.
 */
const ToggleCard = ({ label, description, active, onToggle }) => (
  <button
    onClick={onToggle}
    className={`p-4 rounded-xl border text-left transition-all duration-200 flex justify-between items-center ${
      active
        ? 'bg-[var(--bg-primary)] border-[var(--accent)] ring-1 ring-[var(--accent)]'
        : 'bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--text-secondary)]'
    }`}
    aria-pressed={active}
  >
    <div>
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-[var(--text-secondary)] mt-1">{description}</div>
    </div>
    <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${active ? 'bg-[var(--accent)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${active ? 'left-6.5 translate-x-1' : 'left-0.5'}`} />
    </div>
  </button>
);