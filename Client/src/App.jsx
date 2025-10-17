
// Imports
import React from 'react'
import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom'

// Components and pages
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
// import { Home } from './pages/Home'
// import { Chatbot } from './pages/Chatbot'
// import { Dashboard } from './pages/Dashboard'
// import { Settings } from './pages/Settings'
// import { Logs } from './pages/Logs'


// Your page components
const Home = () => <div className="p-8 text-center">Home - Main Page (informatitive)</div>
const Dashboard = () => <div className="p-8 text-center">Dashboard (unnecessary but could be fun)</div>
const Chatbot = () => <div className="p-8 text-center">Chatbot (main chat bot)</div>
const Settings = () => <div className="p-8 text-center">Settings (user settings, accessibility, ectras)</div>
const Logs = () => <div className="p-8 text-center">Logs (see data logs and chat logs)</div>

// Layout defining all pages
const PageLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

// Create router with future flags
const router = createBrowserRouter([
  {
    path: "/*",
    element: <PageLayout />,
  }
], {
  future: {
    v7_startTransition: true, // navigation
    v7_relativeSplatPath: true // linking
  }
});

function App() {
  return <RouterProvider router={router} />
}

export default App