import { useLocalStorage } from './useLocalStorage';
import { useState, useCallback } from 'react';

// ✅ UPDATE: Production-Ready URL Selector
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Main chat logic hook.
 * Features: Auto-Sync, Optimistic UI, File Uploads, Backup Restore.
 */
export const useChat = () => {
  const [conversations, setConversations] = useLocalStorage('chat-conversations', []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage('active-conversation', null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Helper for API calls with standardized error handling.
   */
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const isFormData = options.body instanceof FormData;
      const headers = { ...options.headers };

      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 404) throw new Error('NOT_FOUND');
      if (!response.ok) throw new Error(`API error: ${ response.status }`);

      return await response.json();
    } catch (error) {
      console.error(`API Call Failed [${ endpoint }]:`, error);
      throw error;
    }
  }, []);

  /**
   * Syncs frontend list with backend reality.
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
        const exists = validList.find(conversation => conversation.id === activeConversationId);
        if (!exists) setActiveConversationId(null);
      }
    } catch (error) {
      console.warn('Sync failed (Server Offline?)');
    }
  }, [activeConversationId, apiCall, setConversations, setActiveConversationId]);

  /**
   * Creates a new conversation session.
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
   * Imports a conversation history.
   */
  const importConversations = useCallback(async (fileData) => {
    if (!Array.isArray(fileData)) {
      alert("Invalid import format: Expected an array.");
      return;
    }

    try {
      // Send Data to Backend
      const response = await fetch(`${API_BASE_URL}/conversations/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) throw new Error("Failed to save backup to server.");

      // Refresh State from Backend
      const refreshRes = await fetch(`${API_BASE_URL}/conversations`);
      const freshData = await refreshRes.json();

      setConversations(freshData);
      alert("Backup restored successfully!");

    } catch (error) {
      console.error("Import Failed:", error);
      alert("Error restoring backup. Check console details.");
    }
  }, [setConversations]);

  /**
   * Sends a message to the backend.
   */
  const addMessageToConversation = async (conversationId, message) => {
    // Generate a temporary ID for the optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = { ...message, id: tempId };

    // Optimistic UI Update
    setConversations(prev => prev.map(conversation => {
      if (conversation.id === conversationId) {
        return {
          ...conversation,
          messages: [...(conversation.messages || []), optimisticMessage],
          updatedAt: new Date().toISOString()
        };
      }
      return conversation;
    }));

    setIsLoading(true);

    try {
      let body;
      // Check if we have an attachment to send
      if (message.attachment) {
        const formData = new FormData();
        formData.append('text', message.text || '');
        formData.append('attachment', message.attachment);
        body = formData;
      } else {
        // Standard JSON for text-only
        body = JSON.stringify({ text: message.text });
      }

      const data = await apiCall(`/conversations/${ conversationId }/messages`, {
        method: 'POST',
        body: body
      });

      // Update with real server response
      setConversations(prev => prev.map(conversation => {
        if (conversation.id === conversationId) {
          return data.conversation;
        }
        return conversation;
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
   */
  const deleteConversation = async (id) => {
    setConversations(prev => prev.filter(conversation => conversation.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
    try { await apiCall(`/conversations/${ id }`, { method: 'DELETE' }); } catch (error) { console.warn(error) }
  };

  /**
   * Deletes ALL conversations history.
   */
  const clearAllConversations = async () => {
    if (!window.confirm("Are you sure you want to delete the entire history? This cannot be undone.")) return;

    setConversations([]);
    setActiveConversationId(null);
    try { await apiCall('/conversations', { method: 'DELETE' }); } catch (error) { console.warn("Failed to clear on server"); }
  };

  /**
   * Loads a specific conversation.
   */
  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiCall( `/conversations/${ id }` );
      setConversations(prev => {
        const index = prev.findIndex(conversation => conversation.id === id);
        if (index === -1) return [data, ...prev];

        const newList = [...prev];
        newList[index] = data;
        return newList;
      });
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        setConversations(prev => prev.filter(conversation => conversation.id !== id));
        if (activeConversationId === id) setActiveConversationId(null);
      }
    }
  }, [apiCall, activeConversationId, setConversations, setActiveConversationId]);

  const startConversationWithPrompt = async (promptText) => {
    try {
      const newId = await createNewConversation();
      setActiveConversationId(newId);
      await addMessageToConversation(newId, {
        text: promptText,
        isUser: true,
        timestamp: new Date().toISOString(),
      });
      return newId;
    } catch (error) {
      console.error('Failed to start conversation from prompt:', error);
      throw error;
    }
  };

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
    startConversationWithPrompt,
    getActiveConversation: () => conversations.find(conversation => conversation.id === activeConversationId),
    startNewChat: () => setActiveConversationId(null),
    isLoading
  };
};