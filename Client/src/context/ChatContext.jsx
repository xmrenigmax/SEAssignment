import React, { createContext, useContext } from 'react';
import { useChat } from '../hooks/useChat';

// Create the context
const ChatContext = createContext(null);

// Create the provider component
export const ChatProvider = ({ children }) => {
  // Initialize the hook ONCE here
  const chatState = useChat();

  return (
    <ChatContext.Provider value={chatState}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to access the shared state
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};