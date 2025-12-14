import React, { createContext, useContext, useMemo } from 'react';
import { useChat } from '../hooks/useChat';

/**
 * Context for managing Chat state across the application.
 * Stores conversation history, active IDs, and loading states.
 */
const ChatContext = createContext(null);

/**
 * ChatProvider Component
 * * Wraps the application (or chat section) to provide access to the chat logic.
 * Initializes the useChat hook once and passes the result down.
 * * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} Provider component.
 */
export const ChatProvider = ({ children }) => {
  // Initialize the hook ONCE here
  const chatState = useChat();

  // Memoize state to prevent unnecessary re-renders in consumers
  const value = useMemo(() => chatState, [chatState]);

  return (
    <ChatContext.Provider value={ value }>
      { children }
    </ChatContext.Provider>
  );
};

/**
 * Hook to consume the ChatContext.
 * * @throws {Error} If used outside of a ChatProvider.
 * @returns {Object} The chat state object returned by useChat().
 */
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};