// Imports
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// Page components
import Landing from './pages/LandingPage'

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

// returns everything above into the router
function App() {
  return <RouterProvider router={router} />
}

export default App