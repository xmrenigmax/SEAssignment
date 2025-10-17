// Imports
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

// Navigation bar component
export const Navbar = () => {
  // current route
  const location = useLocation() 
  
  // Dynamic class generator for navigation links
  const navLinkClass = (path) => 
    `nav-link ${location.pathname === path ? 'active' : ''}`

  return (
    // Main navigation container
    <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Left section - Title and Navigation links */}
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-[var(--accent)]">Marcus Aurelius</h1>
            <div className="flex items-center space-x-4">
              <Link to="/" className={navLinkClass('/')}>Home</Link>
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
              <Link to="/chatbot" className={navLinkClass('/chatbot')}>Chatbot</Link>
              <Link to="/settings" className={navLinkClass('/settings')}>Settings</Link>
              <Link to="/logs" className={navLinkClass('/logs')}>Logs</Link>
            </div>
          </div>

          {/* Right section - Theme toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  ) 
}