import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { AttachmentButton } from './AttachmentButton';
import { VoiceInputButton } from './VoiceInputButton';

/**
 * ChatPanel Component
 * * The main interface for the chat interaction. Handles message display,
 * user input (text/voice/file), and auto-scrolling logic.
 * * @component
 * @returns {JSX.Element} The rendered ChatPanel component.
 */
export const ChatPanel = () => {
  const {
    activeConversationId,
    getActiveConversation,
    addMessageToConversation,
    createNewConversation,
    isLoading
  } = useChatContext();

  const { isConnected } = useBackendHealth();

  // Local State
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  // Refs
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  /**
   * Effect: Auto-scroll to bottom
   * Triggers when messages change, recording status changes, or loading state changes.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording, isLoading]);

  /**
   * Handles the submission of a new message.
   * * Orchestrates the following:
   * 1. Validates input.
   * 2. Ensures a conversation ID exists.
   * 3. Clears UI immediately for optimistic feedback.
   * 4. Dispatches message to context/backend.
   */
  const handleSend = async () => {
    const messageText = transcribedText || input.trim();

    // Guard clause: Do nothing if empty and no file
    if (!messageText && !attachedFile) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
    }

    const userMessage = {
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString(),
      attachment: attachedFile
    };

    // 1. CLEAR UI IMMEDIATELY (Optimistic Update)
    // This makes the UI feel responsive while the backend processes.
    setInput('');
    setAttachedFile(null);
    setTranscribedText('');
    setIsRecording(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 2. Send to Context/Backend
    // NOTE: Ensure addMessageToConversation updates local state *before* awaiting the API
    try {
      await addMessageToConversation(conversationId, userMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: Restore input on error here if desired
    }
  };

  /**
   * Handles key press events in the textarea.
   * Submits on Enter (without Shift).
   * * @param {React.KeyboardEvent} e - The keyboard event.
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Manages textarea auto-resize based on content.
   * * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event.
   */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] relative">
      {/* Header Section */}
      <div className="flex-none h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md flex items-center px-6 justify-between z-10">
        <div className="flex flex-col">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {activeConversation?.title || 'New Conversation'}
          </h2>
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isLoading ? 'Thinking...' : 'Marcus Aurelius'}
          </span>
        </div>
      </div>

  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--border)]">
              <span className="text-4xl font-serif">M</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">Marcus Aurelius</h1>
            <p className="text-[var(--text-secondary)] max-w-sm">
              "The happiness of your life depends upon the quality of your thoughts."
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              {!msg.isUser && (
                <div className="w-8 h-8 mr-3 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border)] text-xs font-serif">
                  M
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                msg.isUser
                  ? 'bg-[var(--accent)] text-white rounded-br-sm'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
              }`}>
                {msg.attachment && (
                  <div className="mb-3 p-2 bg-black/10 rounded-lg flex gap-2 text-xs">
                    <span className="truncate">{msg.attachment.name}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start ml-11">
            <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl border border-[var(--border)] flex gap-1.5">
              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none p-4 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-sm p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all">
          <AttachmentButton onFileAttach={setAttachedFile} />

          <div className="flex-1 min-w-0 py-1.5">
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 text-xs text-[var(--accent)] bg-[var(--bg-primary)] w-fit px-2 py-1 rounded">
                <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="hover:text-red-500">×</button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={transcribedText || input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening..." : "Ask the Emperor..."}
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none max-h-[150px]"
              rows={1}
              style={{ minHeight: '24px' }}
            />
          </div>

          <VoiceInputButton
            isRecording={isRecording}
            onRecordingStart={() => { setIsRecording(true); setTranscribedText(''); }}
            onRecordingStop={(text) => { setIsRecording(false); if (text) setTranscribedText(text); }}
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && !transcribedText && !attachedFile) || isLoading}
            className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};