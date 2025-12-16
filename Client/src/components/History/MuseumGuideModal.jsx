import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';

/**
 * Modal displaying context about the AI Persona (Marcus Aurelius).
 * Features historical biography, philosophy summary, and suggested prompts.
 * * Updated to support "Tour Mode".
 * @param {object} props
 * @param {boolean} props.isOpen - Visibility state.
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} [props.onStartTour] - Optional. If provided, changes button to "Start Tour".
 */
export const MuseumGuideModal = ({ isOpen, onClose, onStartTour }) => {
  const { startConversationWithPrompt } = useChatContext();
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/data/suggested-prompts.json', { signal: controller.signal })
      .then(response => response.json())
      .then(data => setSuggestedPrompts(data))
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Failed to load suggested prompts:', error);

          // Fallback prompts if file missing
          setSuggestedPrompts([
            "How do I deal with difficult people?",
            "I feel overwhelmed by the future.",
            "What is the nature of the human mind?"
          ]);
        }
      });

    return () => controller.abort();
  }, []);

  const handlePromptClick = async (text) => {
    try {
      if (onClose) onClose();
      await startConversationWithPrompt(text);
    } catch (error) {
      console.error('Failed to start conversation from prompt:', error);
    }
  };

  if (!isOpen) return null;

  // Dual-mode: regular modal or tour welcome screen based on onStartTour prop
  const isTourMode = typeof onStartTour === 'function';
  const handleAction = isTourMode ? onStartTour : onClose;
  const buttonText = isTourMode ? "Start Tour" : "Enter Discussion";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[var(--bg-primary)] p-6 border-b border-[var(--border)] relative flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent)] opacity-50"></div>
          { !isTourMode && (
            <button
              onClick={ onClose }
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close Marcus Aurelius information modal"
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[var(--accent)] opacity-80" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" role="img" aria-label="Museum building icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Interactive Exhibit</h2>
          </div>
          <h1 id="modal-title" className="text-2xl font-serif font-bold text-[var(--text-primary)]">Marcus Aurelius</h1>
          <p className="text-sm text-[var(--text-secondary)] italic">121 AD – 180 AD • Rome</p>
        </div>
        <div id="modal-description" className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1" role="document">
          <section className="prose prose-sm prose-invert max-w-none" aria-labelledby="philosopher-king-heading">
            <h3 id="philosopher-king-heading" className="text-[var(--text-primary)] font-serif font-bold text-lg mb-2">The Philosopher King</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Marcus Aurelius was the last of the "Five Good Emperors" of Rome. Despite being the most powerful man in the world, he is best known for his humility and his private journal, <em>Meditations</em>. Written during military campaigns, these writings were never meant for publication but have become the cornerstone of Stoic philosophy.
            </p>
          </section>
          <section className="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border)]" aria-labelledby="core-principles-heading">
            <h4 id="core-principles-heading" className="text-xs font-bold uppercase text-[var(--accent)] mb-2 tracking-wide">Core Principles</h4>
            <ul className="space-y-2 text-sm text-[var(--text-primary)]" aria-label="Marcus Aurelius's philosophical principles">
              <li className="flex gap-2 items-start">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span><strong>Dichotomy of Control:</strong> Focus only on what you can control (your mind and actions); accept what you cannot.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span><strong>Memento Mori:</strong> Remember that you will die. Use this not to despair, but to live with urgency and virtue.</span>
              </li>
            </ul>
          </section>
          <section aria-labelledby="consulting-heading">
            <h3 id="consulting-heading" className="text-[var(--text-primary)] font-serif font-bold text-lg mb-3">Consulting the Emperor</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              This AI simulates Marcus's perspective. He will not give modern technical advice, but will frame your problems through Stoic reason.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase" id="suggested-prompts-label">Suggested Inquiries</p>
              {/* Generate clickable prompt buttons that start conversations when clicked */}
              <div role="list" aria-labelledby="suggested-prompts-label">
                { suggestedPrompts.map((prompt, index) => (
                  <button
                    key={ index }
                    onClick={ () => handlePromptClick(prompt) }
                    className="w-full text-left p-2 rounded hover:bg-[var(--bg-primary)] text-sm text-[var(--accent)] transition-colors border border-transparent hover:border-[var(--border)]"
                    type="button"
                    aria-label={`Start conversation with prompt: ${prompt}`}
                    role="listitem"
                  >
                    "{ prompt }"
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
        <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border)] flex justify-end flex-shrink-0">
          <button
            onClick={ handleAction }
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:shadow-lg hover:opacity-90 transition-all text-sm font-medium flex items-center gap-2"
            type="button"
            aria-label={ isTourMode ? "Start guided tour of the application" : "Close modal and enter discussion with Marcus Aurelius" }
          >
            { buttonText }
            { isTourMode && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};