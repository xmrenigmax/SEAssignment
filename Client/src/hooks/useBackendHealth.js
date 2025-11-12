import { useState, useEffect } from 'react';

// Custom hook for checking backend health
export const useBackendHealth = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Check backend connection
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
      console.error('Backend health check failed:', error);
      setBackendStatus('disconnected');
      return { isConnected: false, error: error.message };
    }
  };

  // Check health on mount and periodically
  useEffect(() => {
    checkBackendHealth();
    
    // Optional: Set up periodic health checks
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds
    
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