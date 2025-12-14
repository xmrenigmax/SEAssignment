import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { get } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Main chat logic hook.
 * Auto-Sync with Server
 * Optimistic UI Updates
 * File Upload Support
 * @returns {Object} Chat state and methods
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
      if (!isFormData) headers['Content-Type'] = 'application/json';

      const response = await fetch(`${ API_BASE_URL }${ endpoint }`, { ...options, headers });
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

      const validList = Array.isArray(serverConversations) ? serverConversations : Object.values(serverConversations);
      // Sort by Newest
      validList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(validList);
    } catch (error) {
      console.warn('Sync failed (Server Offline?)');
    }
  }, [apiCall, setConversations]);

  // Send Function (Handles New & Existing Chats)
  const addMessageToConversation = async (conversationId, message) => {
    setIsLoading(true);
    if (!conversationId) {
      // Generate Temp IDs
      const tempConvId = `temp-conv-${Date.now()}`;
      const tempMsgId = `temp-msg-${Date.now()}`;

      const optimisticMessage = { ...message, id: tempMsgId };
      const optimisticConv = {
        id: tempConvId,
        title: 'New Conversation',
        messages: [optimisticMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Show the chat immediately with Temp ID
      setConversations(prev => [optimisticConv, ...prev]);
      setActiveConversationId(tempConvId);

      try {
        // Create Real Conversation on Server
        const newConvData = await apiCall('/conversations', { method: 'POST' });
        const realConvId = newConvData.id;

        // Send the Message to the Real ID
        let body;
        if (message.attachment) {
          const formData = new FormData();
          formData.append('text', message.text || '');
          formData.append('attachment', message.attachment);
          body = formData;
        } else {
          body = JSON.stringify({ text: message.text });
        }

        const msgResponse = await apiCall(`/conversations/${ realConvId }/messages`, {
          method: 'POST',
          body: body
        });

        // (Add -> Switch -> Delete)
        const realConversationWithMsg = get(msgResponse, 'conversation', newConvData);

        // Add Real Conversation to list
        setConversations(prev => {
            // Filter out realId just in case it exists to avoid dupes
            const cleanPrev = prev.filter(c => c.id !== realConvId);
            return [realConversationWithMsg, ...cleanPrev];
        });

        // Switch View to Real ID
        setActiveConversationId(realConvId);

        // Remove Temp ID
        setTimeout(() => {
            setConversations(prev => prev.filter(c => c.id !== tempConvId));
        }, 50);

      } catch (error) {
        console.error("Failed to sync new conversation", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const tempId = `temp-${ Date.now() }`;
    const optimisticMessage = { ...message, id: tempId };

    // Update UI immediately
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

    try {
      let body;
      if (message.attachment) {
        const formData = new FormData();
        formData.append('text', message.text || '');
        formData.append('attachment', message.attachment);
        body = formData;
      } else {
        body = JSON.stringify({ text: message.text });
      }

      const data = await apiCall(`/conversations/${ conversationId }/messages`, {
        method: 'POST',
        body: body
      });

      // Update with server response
      setConversations(prev => prev.map(conversation => {
        if (conversation.id === conversationId) {
          // Avoid crash
          return get(data, 'conversation', conversation);
        }
        return conversation;
      }));

    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Deletes a specific conversation.
   */
  const deleteConversation = async (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
    try { await apiCall(`/conversations/${ id }`, { method: 'DELETE' }); } catch (error) { console.warn(error); }
  };

  /**
   * Deletes ALL conversations history.
   */
  const clearAllConversations = async () => {
    setConversations([]);
    setActiveConversationId(null);
    try { await apiCall('/conversations', { method: 'DELETE' }); } catch (error) { console.warn("Failed to clear"); }
  };

  /**
   * Loads a specific conversation.
   */
  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    // Don't load if it's a temp ID (it exists only locally)
    if (id.toString().startsWith('temp-')) return;

    try {
      const data = await apiCall(`/conversations/${ id }`);
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
    addMessageToConversation,
    deleteConversation,
    clearAllConversations,
    loadConversation,
    syncConversations,
    getActiveConversation: () => conversations.find(c => c.id === activeConversationId),
    startNewChat: () => setActiveConversationId(null),
    isLoading
  };
};