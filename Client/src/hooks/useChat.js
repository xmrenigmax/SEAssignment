import { useLocalStorage } from './useLocalStorage';
import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Main chat logic hook.
 * * Contains fixes for:
 * 1. 404 Synchronization (Syncs list on load)
 * 2. Instant UI Updates (React state updates immediately)
 */
export const useChat = () => {
  const [conversations, setConversations] = useLocalStorage('chat-conversations', []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage('active-conversation', null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper for API calls
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      
      if (response.status === 404) throw new Error('NOT_FOUND');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error(`API Call Failed [${endpoint}]:`, error);
      throw error;
    }
  }, []);

  /**
   * CRITICAL FIX: Syncs frontend list with backend reality.
   * Removes stale IDs that cause 404 errors.
   */
  const syncConversations = useCallback(async () => {
    try {
      // 1. Get the real list from server
      const serverConversations = await apiCall('/conversations');
      
      // 2. Update frontend list (Object.values handles if server sends a map)
      const validList = Array.isArray(serverConversations) 
        ? serverConversations 
        : Object.values(serverConversations);
      
      setConversations(validList);
      
      // 3. Verify active conversation still exists
      if (activeConversationId) {
        const exists = validList.find(c => c.id === activeConversationId);
        if (!exists) {
          console.warn('Active conversation no longer exists on server. Resetting.');
          setActiveConversationId(null);
        }
      }
    } catch (error) {
      console.warn('Could not sync with server (Offline?)');
    }
  }, [activeConversationId, apiCall, setConversations, setActiveConversationId]);

  const createNewConversation = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/conversations', { method: 'POST' });
      // Add new chat to the TOP of the list
      setConversations(prev => [data, ...prev]);
      setActiveConversationId(data.id);
      setIsLoading(false);
      return data.id;
    } catch (error) {
      // Offline fallback
      const newConv = { id: Date.now().toString(), title: 'New Conversation', messages: [], createdAt: new Date().toISOString() };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setIsLoading(false);
      return newConv.id;
    }
  };

  const addMessageToConversation = async (conversationId, message) => {
    setIsLoading(true);
    try {
      // 1. Send to backend
      const data = await apiCall(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: message.text })
      });
      
      // 2. INSTANT UPDATE: Update the specific conversation in the list
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          // Backend returns the FULL updated conversation object
          return data.conversation; 
        }
        return conv;
      }));
      
      setIsLoading(false);
      return data;
    } catch (error) {
      console.warn('Message failed, using offline mode');
      setIsLoading(false);
      // ... (Keep your existing offline logic here if you wish) ...
    }
  };

  const deleteConversation = async (id) => {
    try { await apiCall(`/conversations/${id}`, { method: 'DELETE' }); } catch (e) {}
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
  };

  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiCall(`/conversations/${id}`);
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return [data, ...prev]; // If missing, add it
        
        // Update existing item
        const newList = [...prev];
        newList[index] = data;
        return newList;
      });
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        // If 404, remove it locally to stop the loop
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) setActiveConversationId(null);
      }
    }
  }, [apiCall, activeConversationId, setConversations, setActiveConversationId]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    addMessageToConversation,
    deleteConversation,
    loadConversation,
    syncConversations, // Exporting this so Sidebar can use it
    getActiveConversation: () => conversations.find(c => c.id === activeConversationId),
    startNewChat: () => setActiveConversationId(null),
    isLoading
  };
};