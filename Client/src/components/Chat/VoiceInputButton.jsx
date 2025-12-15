import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { get } from 'lodash';

/**
 * Voice Input Component.
 * * @component
 * @param {Object} props
 * @param {boolean} props.isRecording - External recording state
 * @param {Function} props.onRecordingStart - Handler for start
 * @param {Function} props.onRecordingStop - Handler for stop (returns object { text, audioData })
 * @param {boolean} props.disabled - Whether button is disabled
 */
export const VoiceInputButton = ({ isRecording, onRecordingStart, onRecordingStop, disabled }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptRef = useRef('');

  // Initialize Web Speech API (for Text)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      // Capture the text result
      recognitionRef.current.onresult = (event) => {

        // Lodash get protects against deep access crashes in the results array
        const currentTranscript = Array.from(event.results)
          .map(result => get(result, '0.transcript', ''))
          .join('');

        transcriptRef.current = currentTranscript;
      };
    }
  }, []);

  const startRecording = async () => {
    onRecordingStart();
    audioChunksRef.current = [];
    transcriptRef.current = '';

    try {
      // Start Audio Recording (For Storage/Playback)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();

      // Start Speech Recognition (For Text)
      // Web Speech API transcribes speech to text in real-time (no server needed)
      // We run BOTH simultaneously: audio for playback, text for searchability
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

    } catch (err) {
      console.error("Microphone access denied:", err);
      onRecordingStop(null);
    }
  };

  const stopRecording = () => {
    // Stop Audio Recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // Wait a moment for the final "dataavailable" event
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Convert Blob to Base64 String for transmission/storage
        // Base64 allows us to embed binary audio data in JSON without corruption
        // Alternative would be multipart/form-data, but this is simpler for the API
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;

          // Stop Speech Recognition
          if (recognitionRef.current) recognitionRef.current.stop();

          // Wait slightly for recognition to finalize
          setTimeout(() => {
            onRecordingStop({
              audioData: base64Audio,
              text: transcriptRef.current
            });
          }, 500);
        };
      };
    } else {
      onRecordingStop(null);
    }

    // Stop all tracks to release mic
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleRecording = () => {
    if (disabled) return;

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={ toggleRecording }
        onMouseEnter={ () => setIsMenuOpen(true) }
        onMouseLeave={ () => setIsMenuOpen(false) }
        disabled={ disabled }
        className={ clsx(
          'p-2 rounded-xl transition-all duration-300 relative',
          isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={ isRecording ? "Stop voice recording" : "Start voice recording" }
        aria-pressed={ isRecording }
        type="button"
      >
        { isRecording && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        { isRecording ? (
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="7" width="10" height="10" rx="2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
        { isRecording && (
          <span className="sr-only" role="status" aria-live="polite">Recording in progress</span>
        )}
      </button>
      { isMenuOpen && !isRecording && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs rounded whitespace-nowrap shadow-lg z-10" role="tooltip" aria-hidden="true">
          Voice Input
        </div>
      )}
    </div>
  );
};