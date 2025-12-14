/**
 * @file main.jsx
 * @description Application Entry Point.
 * Initializes the React application and mounts it to the DOM.
 * Applies global strict mode constraints.
 * @author Group 1
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Global CSS (Tailwind + Theme Variables)
import App from './App.jsx'; // Root Component

// Select the root DOM node from index.html
const rootElement = document.getElementById('root');

// Validate root existence before mounting (Safety Check)
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('Critical Error: Failed to find the root element. The app cannot mount.');
}