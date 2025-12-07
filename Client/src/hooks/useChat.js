import { useLocalStorage } from './useLocalStorage';
import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Main chat logic hook.
 * Features:
 * 1. Auto-Sync with Server
 * 2. Optimistic UI Updates (Immediate user feedback)
 * 3. clearAllConversations support
 * * @returns {Object} Chat state and methods
 */
export const useChat = () => {
  const [conversations, setConversations] = useLocalStorage('chat-conversations', []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage('active-conversation', null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Helper for API calls with standardized error handling.
   * @param {string} endpoint - API endpoint (e.g., '/conversations')
   * @param {Object} options - Fetch options
   */
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
   * Syncs frontend list with backend reality.
   * Prevents 404 errors by removing stale IDs.
   */
  const syncConversations = useCallback(async () => {
    try {
      const serverConversations = await apiCall('/conversations');

      // Normalize response (handle Map vs Array)
      const validList = Array.isArray(serverConversations)
        ? serverConversations
        : Object.values(serverConversations);

      // Sort by newest first
      validList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setConversations(validList);

      // Reset active ID if it no longer exists on server
      if (activeConversationId) {
        const exists = validList.find(c => c.id === activeConversationId);
        if (!exists) setActiveConversationId(null);
      }
    } catch (error) {
      console.warn('Sync failed (Server Offline?)');
    }
  }, [activeConversationId, apiCall, setConversations, setActiveConversationId]);

  /**
   * Creates a new conversation session.
   * Falls back to offline mode if server fails.
   */
  const createNewConversation = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/conversations', { method: 'POST' });
      setConversations(prev => [data, ...prev]);
      setActiveConversationId(data.id);
      setIsLoading(false);
      return data.id;
    } catch (error) {
      // Offline fallback
      const newConv = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString()
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setIsLoading(false);
      return newConv.id;
    }
  };

  /**
   * Imports a conversation history from a JSON file.
   * Merges with existing conversations (avoiding ID duplicates).
   * @param {Array} fileData - The parsed JSON array of conversations.
   */
  const importConversations = useCallback((fileData) => {
    if (!Array.isArray(fileData)) {
      throw new Error("Invalid import format: Expected an array.");
    }

    setConversations(prev => {
      // Create a Map of existing IDs to prevent duplicates
      const existingIds = new Set(prev.map(c => c.id));
      const newConversations = fileData.filter(c => !existingIds.has(c.id));

      // Combine and sort by newest
      const combined = [...newConversations, ...prev].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );

      return combined;
    });
  }, [setConversations]);

  /**
   * Sends a message to the backend.
   * * IMPLEMENTS OPTIMISTIC UPDATES:
   * 1. Immediately adds user message to local state.
   * 2. Sends request to backend.
   * 3. Updates state with real backend response (User msg + AI response).
   * * @param {string} conversationId
   * @param {Object} message - { text, isUser, timestamp, attachment }
   */
  const addMessageToConversation = async (conversationId, message) => {
    // Generate a temporary ID for the optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = { ...message, id: tempId };

    // Update UI immediately before network request
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...(conv.messages || []), optimisticMessage],
          updatedAt: new Date().toISOString()
        };
      }
      return conv;
    }));

    setIsLoading(true);

    try {
      // Send to backend
      const data = await apiCall(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: message.text })
      });

      // Confirms the user message was saved and adds the AI's response.
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return data.conversation;
        }
        return conv;
      }));

      setIsLoading(false);
      return data;
    } catch (error) {
      console.warn('Message failed, using offline mode or rolling back');

      // Turn off loading.
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Deletes a specific conversation.
   * @param {string} id
   */
  const deleteConversation = async (id) => {
    // Optimistic delete
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);

    try { await apiCall(`/conversations/${id}`, { method: 'DELETE' }); } catch (e) {}
  };

  /**
   * Deletes ALL conversations history.
   * Requires user confirmation.
   */
  const clearAllConversations = async () => {
    if (!window.confirm("Are you sure you want to delete the entire history? This cannot be undone.")) return;

    setConversations([]);
    setActiveConversationId(null);

    try {
      await apiCall('/conversations', { method: 'DELETE' });
    } catch (e) {
      console.warn("Failed to clear on server");
    }
  };

  /**
   * Loads a specific conversation details from server.
   * @param {string} id
   */
  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiCall(`/conversations/${id}`);
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return [data, ...prev];

        const newList = [...prev];
        newList[index] = data;
        return newList;
      });
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
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
    clearAllConversations,
    loadConversation,
    syncConversations,
    importConversations,
    getActiveConversation: () => conversations.find(c => c.id === activeConversationId),
    startNewChat: () => setActiveConversationId(null),
    isLoading
  };
};