import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom hook to monitor the connection status of the Express backend.
 * * @returns {Object} healthStatus
 * @returns {string} healthStatus.backendStatus - 'checking', 'connected', or 'disconnected'.
 * @returns {boolean} healthStatus.isConnected - True if backend is reachable.
 * @returns {Function} healthStatus.checkBackendHealth - Manual trigger function.
 */
export const useBackendHealth = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);

  /**
   * Pings the health endpoint.
   * Uses AbortController to handle component unmounting safely.
   */
  const checkBackendHealth = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${ API_BASE_URL }/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const health = await response.json();
        setHealthData(health);
        setBackendStatus('connected');
        return { isConnected: true, health };
      } else {
        throw new Error(`HTTP error: ${ response.status }`);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setBackendStatus('disconnected');
      }
      return { isConnected: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return {
    backendStatus,
    healthData,
    checkBackendHealth,
    isConnected: backendStatus === 'connected',
    isChecking: backendStatus === 'checking'
  };
};