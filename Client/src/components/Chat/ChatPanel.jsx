import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { AttachmentButton } from './AttachmentButton';
import { VoiceInputButton } from './VoiceInputButton';
import clsx from 'clsx';
import { get } from 'lodash';

/**
 * ChatPanel Component
 * Handles Text, Files, and embedded Audio (Base64).
 */
export const ChatPanel = () => {
  const {
    activeConversationId,
    getActiveConversation,
    addMessageToConversation,
    createNewConversation,
    focusTrigger,
    isLoading
  } = useChatContext();

  const { isConnected } = useBackendHealth();

  // Local State
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  // Store the Base64 audio string locally before sending
  const [audioData, setAudioData] = useState(null);

  // Refs
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Safe access using Lodash to prevent crashes if context is initializing
  const activeConversation = getActiveConversation();
  const messages = get(activeConversation, 'messages', []);

  /**
   * Effect: Auto-scroll to bottom
   * Triggers when messages change, recording status changes, or loading state changes.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording, isLoading]);

  /**
   * Effect: Auto-focus textarea when a new chat is opened
   * Triggers when activeConversationId changes or when focus is explicitly requested
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeConversationId, focusTrigger]);

  /**
   * Handles Recording Completion.
   * Receives { audioData, text }
   */
  const handleRecordingComplete = (result) => {
    setIsRecording(false);
    if (result) {
      // Save the Audio Blob (Base64) for the player
      if (result.audioData) setAudioData(result.audioData);

      // Save the Text for the LLM
      if (result.text && result.text.trim().length > 0) {
        setTranscribedText(result.text);
      } else if (!transcribedText) {
        setTranscribedText("Voice Message");
      }
    }
  };

  const handleSend = async () => {
    const messageText = transcribedText || input.trim();

    // Guard clause
    if (!messageText && !attachedFile && !audioData) return;

    // Capture UI state BEFORE clearing
    const userMessage = {
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString(),
      attachment: attachedFile,
      audio: audioData
    };

    // CLEAR UI
    setInput('');
    setAttachedFile(null);
    setTranscribedText('');
    setAudioData(null);
    setIsRecording(false);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Send to Context/Backend
    try {
      await addMessageToConversation(activeConversationId, userMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /**
   * Handles key press events in the textarea.
   * Submits on Enter (without Shift).
   * * @param {React.KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  /**
   * Manages textarea auto-resize based on content.
   * * @param {React.ChangeEvent<HTMLTextAreaElement>} event - The change event.
   */
  const handleInputChange = (event) => {
    setInput(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  const isSendDisabled = (!input.trim() && !transcribedText && !attachedFile && !audioData) || isLoading;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] relative">
      <div className="flex-none h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md flex items-center px-6 justify-between z-10">
        <div className="flex flex-col">
          <h2 className="font-semibold text-[var(--text-primary)]">
            { get(activeConversation, 'title', 'New Conversation') }
          </h2>
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <span className={ clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500') }></span>
            { isLoading ? 'Thinking...' : 'Marcus Aurelius' }
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
        { messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-30 h-30 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--border)]">
            <img 
              src="/icons/Marcus_Aurelius2_Dark.png" 
              alt="Marcus Aurelius" 
              className="w-22 h-20 rounded-full scale-[1.75]"
            />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">Marcus Aurelius</h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
              Emperor of Rome (161–180 AD) and Stoic philosopher. His <em>Meditations</em> offer timeless wisdom on duty, resilience, and the nature of the human mind.
            </p>
          </div>
        ) : 
        (
          messages.map((msg, idx) => (
            <div key={ msg.id || idx } className={ clsx('flex', msg.isUser ? 'justify-end' : 'justify-start') }>
              { !msg.isUser && (
                <div className="relative w-10 h-15 mr-1 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-serif">
                  <img src="/icons/Marcus_Aurelius2_Dark.png" 
                  alt="Marcus Aurelius" 
                  className="w-full h-full object-cover scale-[1.25]"/>
                </div>
              )}
              <div className={ clsx(
                'max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm',
                msg.isUser
                  ? 'bg-[var(--accent)] text-white rounded-br-sm'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
              )}>
                { msg.attachment && (
                  <div className="mb-3 p-2 bg-black/10 rounded-lg flex gap-2 text-xs">
                    <span className="truncate">{ get(msg, 'attachment.name', 'Attachment') }</span>
                  </div>
                )}
                { msg.audio && (
                  <div className="mb-2">
                    <audio controls src={ msg.audio } className="h-8 w-full max-w-[200px]" />
                  </div>
                )}
                <div className="whitespace-pre-wrap">{ msg.text }</div>
              </div>
            </div>
          ))
        )}
        { isLoading && (
          <div className="flex justify-start ml-11">
            <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl border border-[var(--border)] flex gap-1.5">
              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={ messagesEndRef } />
      </div>
      <div className="flex-none p-4 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-sm p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all">
          <AttachmentButton onFileAttach={ setAttachedFile } />
          <div className="flex-1 min-w-0 py-1.5">
            { (attachedFile || audioData) && (
              <div className="flex items-center gap-2 mb-2 text-xs text-[var(--accent)] bg-[var(--bg-primary)] w-fit px-2 py-1 rounded">
                <span>{ attachedFile ? attachedFile.name : 'Voice Message Ready' }</span>
                <button onClick={ () => { setAttachedFile(null); setAudioData(null); }} className="hover:text-red-500">×</button>
              </div>
            )}
            <textarea
              ref={ textareaRef }
              value={ transcribedText || input }
              onChange={ handleInputChange }
              onKeyDown={ handleKeyDown }
              placeholder={ isRecording ? "Listening..." : "Ask the Emperor..." }
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none max-h-[150px]"
              rows={ 1 }
              style={{ minHeight: '24px' }}
            />
          </div>
          <VoiceInputButton
            isRecording={ isRecording }
            onRecordingStart={ () => { setIsRecording(true); setTranscribedText(''); }}
            onRecordingStop={ handleRecordingComplete }
            disabled={ isLoading }
          />
          <button onClick={ handleSend } disabled={ isSendDisabled } className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 shadow-sm disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};