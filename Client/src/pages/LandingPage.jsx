import React, { useState } from 'react'

// Components for main page
import { Sidebar } from '../components/UI/Sidebar'
import { ChatPanel } from '../components/Chat/ChatPanel'
import { SettingsPanel } from '../components/Settings/SettingsPanel'

// Main Layout Component
const Landing = () => {
  /*
  * activeView for which view we see (chat or setting)
  * isSidebar is to check if the sidebar is open or not
  */

  const [activeView, setActiveView] = useState('chat')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)


  // Render Landing.jsx
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

export default Landing