import { useLocalStorage } from './useLocalStorage';
import { useState } from 'react';

// API base URL - adjust for your environment
const API_BASE_URL = 'http://localhost:5000/api';

export const useChat = () => {
  const [conversations, setConversations] = useLocalStorage('chat-conversations', []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage('active-conversation', null);
  const [isLoading, setIsLoading] = useState(false);

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Check backend health (non-hook version for external use)
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const health = await response.json();
        return { isConnected: true, health };
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      return { isConnected: false, error: error.message };
    }
  };

  // Create new conversation via API
  const createNewConversation = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/conversations', {
        method: 'POST',
      });
      
      setConversations(prev => [data, ...prev]);
      setActiveConversationId(data.id);
      setIsLoading(false);
      return data.id;
    } catch (error) {
      console.warn('API failed, using local storage fallback');
      // Fallback to local storage if API fails
      const newConversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      setIsLoading(false);
      return newConversation.id;
    }
  };

  // Send message via API
  const addMessageToConversation = async (conversationId, message) => {
    setIsLoading(true);
    try {
      const data = await apiCall(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          text: message.text,
          attachment: message.attachment
        }),
      });
      
      // Update local state with API response
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return data.conversation;
        }
        return conv;
      }));
      
      setIsLoading(false);
      return data;
      
    } catch (error) {
      console.warn('API failed, using local storage fallback');
      // Fallback to local storage
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedMessages = [...conv.messages, message];
          const newTitle = conv.messages.length === 0 ? 
            message.text.slice(0, 30) + (message.text.length > 30 ? '...' : '') : 
            conv.title;
          
          return {
            ...conv,
            title: newTitle,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };
        }
        return conv;
      }));
      setIsLoading(false);
      
      // Simulate Marcus response for fallback
      return {
        userMessage: message,
        marcusMessage: {
          id: Date.now().toString(),
          text: "Even technical difficulties cannot disturb a Stoic mind. Let us continue our discussion.",
          isUser: false,
          timestamp: new Date().toISOString()
        },
        conversation: conversations.find(conv => conv.id === conversationId)
      };
    }
  };

  // Load conversation from API when selected
  const loadConversation = async (conversationId) => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const data = await apiCall(`/conversations/${conversationId}`);
      
      // Update local state with loaded conversation
      setConversations(prev => {
        const existing = prev.find(conv => conv.id === conversationId);
        if (existing) {
          return prev.map(conv => conv.id === conversationId ? data : conv);
        } else {
          return [data, ...prev];
        }
      });
      
      setIsLoading(false);
      return data;
      
    } catch (error) {
      console.warn('Failed to load conversation from API, using local storage');
      setIsLoading(false);
      // Conversation will be loaded from local storage
      return conversations.find(conv => conv.id === conversationId);
    }
  };

  // Delete conversation via API
  const deleteConversation = async (conversationId) => {
    setIsLoading(true);
    try {
      await apiCall(`/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('API delete failed, using local storage');
    }
    
    // Always update local state
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
    setIsLoading(false);
  };

  // Sync all conversations from backend (for initial load)
  const syncConversations = async () => {
    try {
      const data = await apiCall('/conversations');
      // Convert object to array for local storage
      const conversationsArray = Object.values(data);
      setConversations(conversationsArray);
      return conversationsArray;
    } catch (error) {
      console.warn('Failed to sync conversations from backend');
      return conversations;
    }
  };

  const getActiveConversation = () => {
    return conversations.find(conv => conv.id === activeConversationId);
  };

  const startNewChat = () => {
    setActiveConversationId(null);
  };

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    addMessageToConversation,
    deleteConversation,
    getActiveConversation,
    startNewChat,
    loadConversation,
    syncConversations,
    checkBackendHealth,
    isLoading
  };
};