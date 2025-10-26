
// Imports
import React, { useState } from 'react'
import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom'

// Components for main page
import { Sidebar } from './components/Sidebar'
import { ChatPanel } from './components/ChatPanel'
import { SettingsPanel } from './components/SettingsPanel'

// Main Layout Component
const MainLayout = () => {
  /*
  * activeView for which view we see (chat or setting)
  * isSidebar is to check if the sidebar is open or not
  */

  const [activeView, setActiveView] = useState('chat')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)


// Render App.jsx
  return (
     <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Left Sidebar */}
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeView === 'chat' ? (
          <ChatPanel /> ) : ( <SettingsPanel /> )}
      </main>
    </div>
  )
}


// Create router with future flags 
const router = createBrowserRouter([
  {
    path: "/*",
    element: <MainLayout />,
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