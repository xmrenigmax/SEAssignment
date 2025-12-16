import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { useTypewriter } from '../../hooks/useTypewriter';
import { AttachmentButton } from './AttachmentButton';
import { VoiceInputButton } from './VoiceInputButton';

const BackgroundImage = '/icons/BackgroundImage/roman-pillars.png';

const Message = ({ msg, idx }) => {
  // Only apply typewriter effect to the most recent bot message for better UX
  // Previous messages appear instantly to avoid re-animation on scroll
  const isLastBotMessage = !msg.isUser && idx === msg.isLastBotIndex;
  const { displayedText } = useTypewriter(
    msg.text || '',
    8,  // 8ms delay per character = ~125 chars/second (natural reading pace)
    isLastBotMessage
  );

  const displayText = isLastBotMessage ? displayedText : msg.text;

  return (
    <div className={ `flex ${ msg.isUser ? 'justify-end' : 'justify-start' }` }>
      { !msg.isUser && (
        <div className="w-10 h-10 mr-3 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border mb-6 shadow-sm">
          <img src="/icons/marcus-aurelius.png" alt="" className="w-full h-full object-cover rounded-full" aria-hidden="true"/>
        </div>
      )}
      <div
        className={ `max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${ msg.isUser ? 'bg-[var(--accent)] text-white rounded-br-sm' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm' }` }
        role="article"
        aria-label={ msg.isUser ? "You said" : "Marcus Aurelius said" }
      >
        { msg.attachment && (
          <div className="mb-3 p-2 bg-black/10 rounded-lg flex gap-2 text-xs">
            <span className="truncate">{ msg.attachment.name }</span>
          </div>
        )}
        { msg.audio && (
          <div className="mb-2">
            <audio controls src={ msg.audio } className="h-8 w-full max-w-[200px]" aria-label="Audio message" />
          </div>
        )}
        <div className="whitespace-pre-wrap">{ displayText }</div>
      </div>
    </div>
  );
};

/**
 * ChatPanel Component
 * Updated Tab Order: Input & Send = 1
 */
export const ChatPanel = ({ toggleMobile }) => {
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
  }, [messages, isRecording, isLoading])

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

      await addMessageToConversation(conversationId, userMessage);

    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
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
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] relative" role="region" aria-label="Chat Interface">
      <div className="hide-at-high-zoom flex-none h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md flex items-center px-6 justify-between z-10">
        <div className="flex flex-col">
          <h2 className="font-semibold text-[var(--text-primary)]" aria-live="polite">
            { activeConversation?.title || 'New Conversation' }
          </h2>
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5" aria-label={ isConnected ? "System Online" : "System Offline" }>
            <span className={ `w-1.5 h-1.5 rounded-full ${ isConnected ? 'bg-green-500' : 'bg-red-500' }` } aria-hidden="true"></span>
            { isLoading ? 'Thinking...' : 'Marcus Aurelius' }
          </span>
        </div>
      </div>
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-30 z-0 pointer-events-none" style={{ backgroundImage: `url('${BackgroundImage}')` }} aria-hidden="true" />
        <div className="absolute inset-0 z-10 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth" role="log" aria-label="Message History">
          { messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--border)] overflow-hidden">
                <img src="/icons/marcus-aurelius.png" alt="Portrait bust of Marcus Aurelius, Roman Emperor and Stoic philosopher" className="w-full h-full object-cover rounded-full"/>
              </div>
              <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">Marcus Aurelius</h1>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
                Emperor of Rome (161–180 AD) and Stoic philosopher. His <em>Meditations</em> offer timeless wisdom on duty, resilience, and the nature of the human mind.
              </p>
            </div>
          ) : (
            // IIFE to find last bot message for typewriter effect
            (() => {
              let lastBotIndex = -1;
              for (let i = messages.length - 1; i >= 0; i--) {
                if (!messages[i].isUser) {
                  lastBotIndex = i;
                  break;
                }
              }

              return messages.map((msg, idx) => (
                <Message
                  key={ msg.id || idx }
                  msg={{ ...msg, isLastBotIndex: idx === lastBotIndex ? idx : -1 }}
                  idx={ idx }
                />
              ));
            })()
          )}
          { isLoading && (
            <div className="flex justify-start ml-11" role="status" aria-live="polite" aria-label="Marcus Aurelius is thinking">
              <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl border border-[var(--border)] flex gap-1.5">
                {/* Three dots with staggered animation delays */}
                <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" aria-hidden="true" />
                <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true" />
                <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true" />
              </div>
            </div>
          )}
          <div ref={ messagesEndRef } />
        </div>
      </div>

      <div className="flex-none p-4 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          {toggleMobile && (
            <button 
              onClick={toggleMobile} 
              className="lg:hidden p-3 bg-[var(--accent)] text-white hover:opacity-90 rounded-xl shadow-lg transition-all flex-shrink-0"
              aria-label="Open Sidebar Menu"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-sm p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all">
            <div tabIndex={1}>
            <AttachmentButton onFileAttach={ setAttachedFile } />
          </div>
          <div className="flex-1 min-w-0 py-1.5">
            { (attachedFile || audioData) && (
              <div className="flex items-center gap-2 mb-2 text-xs text-[var(--accent)] bg-[var(--bg-primary)] w-fit px-2 py-1 rounded" role="status">
                <span>{ attachedFile ? attachedFile.name : 'Voice Message Ready' }</span>
                <button 
                  onClick={ () => { setAttachedFile(null); setAudioData(null); }} 
                  className="hover:text-red-500" 
                  aria-label={`Remove ${attachedFile ? 'file attachment' : 'voice message'}`}
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            )}
            <textarea
              ref={ textareaRef }
              value={ transcribedText || input }
              onChange={ handleInputChange }
              onKeyDown={ handleKeyDown }
              placeholder={ isRecording ? "Listening..." : "Ask the Emperor..." }
              className="w-full bg-transparent border-none outline-none focus-visible:outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none max-h-[150px]"
              rows={ 1 }
              style={{ minHeight: '24px' }}
              aria-label="Type your message to Marcus Aurelius"
              aria-describedby="message-help"
              tabIndex={1}
            />
          </div>
          <div tabIndex={1}>
            <VoiceInputButton isRecording={ isRecording } onRecordingStart={ () => { setIsRecording(true); setTranscribedText(''); }} onRecordingStop={ handleRecordingComplete } disabled={ isLoading }/>
          </div>
          <button 
            onClick={ handleSend } 
            disabled={( !input.trim() && !transcribedText && !attachedFile && !audioData) || isLoading } 
            className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
            aria-label={isLoading ? "Sending message, please wait" : "Send message to Marcus Aurelius"}
            type="button"
            tabIndex={1}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};