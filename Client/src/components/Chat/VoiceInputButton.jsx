import React, { useState } from 'react';

// Voice input button component for speech-to-text functionality
export const VoiceInputButton = ({ isRecording, onRecordingStart, onRecordingStop }) => {
  // State for UI feedback
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle voice recording start/stop
  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      onRecordingStart();
      
      // Simulate transcription after 3 seconds (replace with actual Web Speech API)
      setTimeout(() => {
        if (isRecording) {
          const sampleTranscriptions = [
            "What is the Stoic perspective on dealing with adversity?",
            "How can I practice mindfulness in daily life?",
            "Tell me about Marcus Aurelius's teachings on virtue",
            "What does Stoicism say about controlling emotions?"
          ];
          const randomText = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
          onRecordingStop(randomText);
        }
      }, 3000);
    } else {
      // Stop recording
      onRecordingStop();
    }
  };

  // Render voice input button with recording states
  return (
    <div className="relative">
      {/* Voice Input Button */}
      <button
        onClick={toggleRecording}
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isRecording 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'text-gray-500 hover:text-[var(--accent)] hover:bg-[var(--bg-primary)]'
        }`}
        aria-label={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isRecording ? (
          // Recording active state - Stop icon
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          // Default microphone state
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Tooltip on hover */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg text-sm whitespace-nowrap z-10">
          {isRecording ? 'Click to stop recording' : 'Start voice input'}
        </div>
      )}
    </div>
  );
};