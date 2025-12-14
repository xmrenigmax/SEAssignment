import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { AttachmentButton } from './AttachmentButton';
import { VoiceInputButton } from './VoiceInputButton';


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
    loadConversation,
    isLoading,
    startNewChat,
    newChatTrigger
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

  // Flag to prevent fetching history while we are locally creating a chat
  const isCreatingConversation = useRef(false);

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  // When the ID changes, fetch history UNLESS we are in the middle of creating it
  useEffect(() => {
    if (activeConversationId) {
      // If we are manually creating this chat, skip the fetch.
      // We do NOT reset the flag here, because Strict Mode would break it.
      if (isCreatingConversation.current) {
        return;
      }
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  /**
   * Effect: Auto-scroll to bottom
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording, isLoading]);

  /**
   * Effect: Auto-focus textarea when conversation changes or becomes null
   */
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeConversationId, newChatTrigger]);

  /**
   * Effect: Focus on mount
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleRecordingComplete = (result) => {
    setIsRecording(false);
    if (result) {
      if (result.audioData) setAudioData(result.audioData);
      if (result.text && result.text.trim().length > 0) {
        setTranscribedText(result.text);
      } else if (!transcribedText) {
        setTranscribedText("Voice Message");
      }
    }
  };

  const handleSend = async () => {
    const messageText = transcribedText || input.trim();
    if (!messageText && !attachedFile && !audioData) return;

    let conversationId = activeConversationId;

    try {
      // 1. If no conversation exists, flag that we are creating one.
      // This tells the useEffect to IGNORE the ID change that is about to happen.
      if (!conversationId) {
        isCreatingConversation.current = true;
        conversationId = await createNewConversation();
      }

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
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      // 2. Send the message (Optimistic update happens here)
      await addMessageToConversation(conversationId, userMessage);

    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      // 3. ONLY reset the flag once the entire process is complete.
      isCreatingConversation.current = false;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] relative">
      <div className="flex-none h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md flex items-center px-6 justify-between z-10">
        <div className="flex flex-col">
          <h2 className="font-semibold text-[var(--text-primary)]">
            { activeConversation?.title || 'New Conversation' }
          </h2>
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <span className={ `w-1.5 h-1.5 rounded-full ${ isConnected ? 'bg-green-500' : 'bg-red-500' }` }></span>
            { isLoading ? 'Thinking...' : 'Marcus Aurelius' }
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
        { messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--border)] overflow-hidden">
              <img src="/icons/marcus-aurelius.png" alt="Marcus Aurelius Bust" className="w-full h-full object-cover rounded-full"/>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">Marcus Aurelius</h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
              Emperor of Rome (161–180 AD) and Stoic philosopher. His <em>Meditations</em> offer timeless wisdom on duty, resilience, and the nature of the human mind.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={ msg.id || idx } className={ `flex ${ msg.isUser ? 'justify-end' : 'justify-start' }` }>
              { !msg.isUser && (
                <div className="w-10 h-10 mr-3 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border mb-6  shadow-sm">
                  <img src="/icons/marcus-aurelius.png" alt="Marcus Aurelius Bust" className="w-full h-full object-cover rounded-full"/>
                </div>
              )}
              <div className={ `max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                msg.isUser
                  ? 'bg-[var(--accent)] text-white rounded-br-sm'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
              }`}>
                { msg.attachment && (
                  <div className="mb-3 p-2 bg-black/10 rounded-lg flex gap-2 text-xs">
                    <span className="truncate">{ msg.attachment.name }</span>
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
          <button onClick={ handleSend } disabled={( !input.trim() && !transcribedText && !attachedFile && !audioData) || isLoading } className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 shadow-sm disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
