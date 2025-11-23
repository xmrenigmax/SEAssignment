import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext'; // Using Context
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { AttachmentButton } from './AttachmentButton';
import { VoiceInputButton } from './VoiceInputButton';

export const ChatPanel = () => {
  const { 
    activeConversationId, 
    getActiveConversation, 
    addMessageToConversation,
    createNewConversation,
    isLoading
  } = useChatContext();
  
  const { backendStatus, isConnected, isChecking } = useBackendHealth();
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const textareaRef = useRef(null);

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  const handleSend = async () => {
    const messageText = transcribedText || input.trim();
    if (messageText || attachedFile) {
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
      
      await addMessageToConversation(conversationId, userMessage);
      
      setInput('');
      setAttachedFile(null);
      setTranscribedText('');
      setIsRecording(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileAttach = (file) => setAttachedFile(file);
  const handleFileRemove = () => setAttachedFile(null);
  const handleRecordingStart = () => { setIsRecording(true); setTranscribedText(''); };
  const handleRecordingStop = (text = '') => { setIsRecording(false); if (text) setTranscribedText(text); };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-full">
      {!isChecking && !isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 text-sm">
          <span>Using offline mode - conversations saved locally</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]"></div>
            <span className="text-sm text-gray-600">Marcus is contemplating...</span>
          </div>
        </div>
      )}
      
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mb-4 text-white text-2xl">
              M
            </div>
            <h2 className="text-2xl font-bold mb-3">Welcome to Marcus Aurelius AI</h2>
            <p className="text-[var(--text-secondary)] max-w-md mb-4">
              Discuss Stoic philosophy, seek wisdom from Meditations, and explore timeless principles.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id || index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                message.isUser
                  ? 'bg-[var(--message-user)] text-white rounded-br-none'
                  : 'bg-[var(--message-bot)] text-[var(--text-primary)] rounded-bl-none'
              }`}>
                {message.attachment && (
                  <div className="mb-3 p-2 bg-black/20 rounded-lg text-sm flex items-center gap-2">
                    <span className="truncate">{message.attachment.name}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto">
          {attachedFile && (
            <div className="mb-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg flex justify-between">
              <span className="text-sm truncate">{attachedFile.name}</span>
              <button onClick={handleFileRemove} className="text-red-500">×</button>
            </div>
          )}

          <div className="flex items-end gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus-within:ring-2 focus-within:ring-[var(--accent)]">
            <AttachmentButton onFileAttach={handleFileAttach} />
            <textarea
              ref={textareaRef}
              value={transcribedText || input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Emperor..."
              className="flex-1 p-2 bg-transparent border-none outline-none resize-none min-h-[40px] max-h-[120px]"
              rows="1"
            />
            <VoiceInputButton isRecording={isRecording} onRecordingStart={handleRecordingStart} onRecordingStop={handleRecordingStop} />
            <button onClick={handleSend} disabled={(!input.trim() && !transcribedText) || isLoading} className="p-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};