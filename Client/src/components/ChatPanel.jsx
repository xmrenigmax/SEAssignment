// Imports
import React, { useState } from 'react'

// Chat Panel
export const ChatPanel = () => {

  // State for chat messages and input
  const [messages, setMessages] = useState([]) // Array of message objects
  const [input, setInput] = useState('') // Current input text

  // Handle sending messages
  const handleSend = () => {
    if (input.trim()) {
      // Add user message to chat
      setMessages([...messages, { text: input, isUser: true }])
      setInput('') // Clear input field
      // TODO: Add chatbot API call here for response
    }
  }

  // render
  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Messages Container - Scrollable area */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome message when no chat history
          <div className="text-center mt-20">
            <h2 className="text-2xl font-bold mb-4">Welcome to Marcus Aurelius Chat</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ask questions about Stoic philosophy and the teachings of Marcus Aurelius
            </p>
          </div>
        ) : (
          // Display chat messages
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>

                {/*theme depending on whose chatting*/}
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${
                  message.isUser
                    ? 'bg-[var(--accent)] text-white rounded-br-none'
                    : 'bg-[var(--bg-secondary)] rounded-bl-none'}`}>
                {message.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-6 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)} // Update input state
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} // Send on Enter
            placeholder="Ask about Stoic philosophy..."
            className="flex-1 p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />

          {/* send button */}
          <button
            onClick={handleSend}
            className="p-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
            Send
          </button>
        </div>

        
        {/* Additional input options */}
        <div className="flex justify-center mt-3 space-x-4">
          <button className="text-sm text-[var(--accent)] hover:underline">
            🎤 Voice Input
          </button>
          <button className="text-sm text-[var(--accent)] hover:underline">
            📁 Attach Files
          </button>
        </div>
      </div>
    </div>
  )
}