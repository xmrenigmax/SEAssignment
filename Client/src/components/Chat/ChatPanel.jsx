import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { AttachmentButton } from './AttachmentButton';
import { VoiceInputButton } from './VoiceInputButton';

// Main chat interface component
export const ChatPanel = () => {
  // Chat management hook for conversation handling
  const { 
    activeConversationId, 
    getActiveConversation, 
    addMessageToConversation,
    createNewConversation,
    isLoading
  } = useChat();
  
  // Backend health hook
  const { backendStatus, isConnected, isChecking } = useBackendHealth();
  
  // Local state for user input and UI controls
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const textareaRef = useRef(null);

  // Get current conversation data
  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  // Handle sending messages to the chat
  const handleSend = async () => {
    const messageText = transcribedText || input.trim();
    
    if (messageText || attachedFile) {
      let conversationId = activeConversationId;
      
      // Create new conversation if none exists
      if (!conversationId) {
        conversationId = await createNewConversation();
      }
      
      // Add user message to conversation via API
      const userMessage = { 
        text: messageText,
        isUser: true, 
        timestamp: new Date().toISOString(),
        attachment: attachedFile ? {
          name: attachedFile.name,
          type: attachedFile.type,
          size: attachedFile.size
        } : undefined
      };
      
      // This will call the API and update state automatically
      await addMessageToConversation(conversationId, userMessage);
      
      // Clear input states
      setInput('');
      setAttachedFile(null);
      setTranscribedText('');
      setIsRecording(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle file attachment
  const handleFileAttach = (file) => {
    setAttachedFile(file);
  };

  // Handle file removal
  const handleFileRemove = () => {
    setAttachedFile(null);
  };

  // Handle voice recording state
  const handleRecordingStart = () => {
    setIsRecording(true);
    setTranscribedText('');
  };

  // Handle voice recording stop and transcription
  const handleRecordingStop = (text = '') => {
    setIsRecording(false);
    if (text) {
      setTranscribedText(text);
    }
  };

  // Handle Enter key for sending, Shift+Enter for new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea as user types
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render chat interface
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-full">
      
      {/* Backend Status Indicator */}
      {!isChecking && !isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Using offline mode - conversations saved locally</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]"></div>
            <span className="text-sm text-gray-600">Marcus is contemplating...</span>
          </div>
        </div>
      )}
      
      {/* Messages Container - Scrollable chat history */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome screen for new conversations
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚔️</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Welcome to Marcus Aurelius AI</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
              Discuss Stoic philosophy, seek wisdom from Meditations, and explore timeless principles 
              for modern living with an AI inspired by the great Roman emperor.
            </p>
            {!isConnected && !isChecking && (
              <p className="text-sm text-yellow-600 max-w-md">
                <strong>Note:</strong> Currently in offline mode. Some features may be limited.
              </p>
            )}
          </div>
        ) : (
          // Chat messages display
          messages.map((message, index) => (
            <div key={message.id || index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                message.isUser
                  ? 'bg-[var(--accent)] text-white rounded-br-none'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] rounded-bl-none'
              }`}>
                {/* Message attachment display */}
                {message.attachment && (
                  <div className="mb-3 p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate">{message.attachment.name}</span>
                      <span className="text-xs opacity-70">{formatFileSize(message.attachment.size)}</span>
                    </div>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.text}
                </div>
                <div className={`text-xs mt-2 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area - Fixed at bottom with attachment and voice features */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto">
          
          {/* Attached File Display */}
          {attachedFile && (
            <div className="mb-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--accent)] rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium truncate max-w-xs">{attachedFile.name}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(attachedFile.size)}</div>
                  </div>
                </div>
                <button
                  onClick={handleFileRemove}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Voice Recording Visualization */}
          {isRecording && (
            <div className="mb-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
                <div className="text-xs text-red-500">Click stop to transcribe</div>
              </div>
              
              {/* Audio Visualization Bars */}
              <div className="flex items-end justify-center gap-1 h-8">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-t transition-all duration-300"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transcribed Text Display */}
          {transcribedText && !isRecording && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-sm font-medium">Transcribed Text</span>
                </div>
                <button
                  onClick={() => setTranscribedText('')}
                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                  aria-label="Clear transcription"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">{transcribedText}</p>
            </div>
          )}

          {/* Input Container with attachment button and send/voice buttons */}
          <div className="flex items-end gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:border-transparent">
            
            {/* Attachment Button - Left side */}
            <AttachmentButton onFileAttach={handleFileAttach} />
            
            {/* Text Input Area */}
            <textarea
              ref={textareaRef}
              value={transcribedText || input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Recording in progress..." : "Ask Marcus Aurelius about Stoic philosophy..."}
              className="flex-1 p-2 bg-transparent border-none outline-none resize-none min-h-[40px] max-h-[120px] placeholder-gray-500"
              rows="1"
              disabled={isRecording || isLoading}
            />
            
            {/* Action Buttons Container - Right side */}
            <div className="flex items-center gap-1">
              
              {/* Voice Input Button */}
              <VoiceInputButton 
                isRecording={isRecording}
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
                disabled={isLoading}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !transcribedText && !attachedFile) || isRecording || isLoading}
                className="p-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Helper Text */}
          <p className="text-xs text-center text-gray-500 mt-2">
            {isLoading ? 'Marcus is contemplating...' : 
             isRecording ? 'Recording... Click stop to transcribe' : 
             'Shift + Enter for new line • Enter to send'}
          </p>
        </div>
      </div>
    </div>
  );
};