import { useState, useEffect } from 'react';

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
  const API_BASE_URL = 'http://localhost:5000/api';

  /**
   * Pings the health endpoint.
   */
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const health = await response.json();
        setHealthData(health);
        setBackendStatus('connected');
        return { isConnected: true, health };
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      setBackendStatus('disconnected');
      return { isConnected: false, error: error.message };
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    backendStatus,
    healthData,
    checkBackendHealth,
    isConnected: backendStatus === 'connected',
    isChecking: backendStatus === 'checking'
  };
};