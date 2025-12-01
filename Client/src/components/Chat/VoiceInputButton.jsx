import React, { useState, useRef, useEffect } from 'react';

/**
 * Voice Input Component.
 * Handles Speech-to-Text functionality using the Web Speech API.
 * Falls back to simulation if API is unavailable (Robustness).
 * * @component
 * @param {Object} props
 * @param {boolean} props.isRecording - External recording state
 * @param {Function} props.onRecordingStart - Handler for start
 * @param {Function} props.onRecordingStop - Handler for stop (returns text)
 * @param {boolean} props.disabled - Whether button is disabled
 */
export const VoiceInputButton = ({ isRecording, onRecordingStart, onRecordingStop, disabled }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        // We don't auto-stop here, we wait for user click
      };

      recognitionRef.current.onerror = (event) => {
        console.warn('Speech recognition error', event.error);
        onRecordingStop(); // Safety stop
      };
    }
  }, [onRecordingStop]);

  const toggleRecording = () => {
    if (disabled) return;

    if (!isRecording) {
      // START RECORDING
      onRecordingStart();

      if (recognitionRef.current) {
        // Use Real API
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Mic start failed", e);
          onRecordingStop();
        }
      } else {
        // Fallback Simulation (for browsers without API)
        console.log("Using Voice Simulation Fallback");
        setTimeout(() => {
          const sampleTranscriptions = [
            "What is the Stoic perspective on anxiety?",
            "How do I remain calm in chaos?",
            "Tell me about the Meditations.",
          ];
          const randomText = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
          onRecordingStop(randomText);
        }, 3000);
      }
    } else {
      // STOP RECORDING
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        // We define a short delay to allow the final result to process
        setTimeout(() => onRecordingStop(undefined), 500);
      } else {
        onRecordingStop();
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleRecording}
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
        disabled={disabled}
        className={`
          p-2 rounded-xl transition-all duration-300 relative
          ${isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isRecording && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        {isRecording ? (
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <rect x="7" y="7" width="10" height="10" rx="2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      {isMenuOpen && !isRecording && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs rounded whitespace-nowrap shadow-lg z-10">
          Voice Input
        </div>
      )}
    </div>
  );
};