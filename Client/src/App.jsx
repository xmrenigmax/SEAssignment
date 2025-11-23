/**
 * @file App.jsx
 * @description Main application entry point. Wraps the router in the ChatProvider
 * to ensure state is shared across Sidebar and ChatPanel.
 */

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext'; // The Shared Brain
import Landing from './pages/LandingPage';

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
    // Wrap the Router in the Provider so all pages share the same chat state
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  );
}

export default App;