/**
 * @file App.jsx
 * @description Main application entry point. Wraps the router in the ChatProvider
 * to ensure state is shared across Sidebar and ChatPanel.
 */

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Landing from './pages/LandingPage';
import { ThemeProvider } from './context/ThemeContext';

// Create router with future flags
const router = createBrowserRouter([
  {
    path: "/*",
    element: <Landing />,
  }
], {
  future: {
    v7_startTransition: true, // navigation
    v7_relativeSplatPath: true // linking
  }
});

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <RouterProvider router={router} />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;