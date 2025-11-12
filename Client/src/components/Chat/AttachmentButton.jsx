import React, { useState, useRef } from 'react';

// Attachment button component for file uploads
export const AttachmentButton = ({ onFileAttach }) => {
  // State for managing attachment menu visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection from input
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const isValidType = validTypes.some(type => file.type.includes(type.replace('*', '')));
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        alert('Please select a valid file type (images, PDF, text, Word documents)');
        return;
      }
      
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Pass file to parent component
      onFileAttach(file);
    }
    setIsMenuOpen(false);
  };

  // Open file dialog when button is clicked
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Render attachment button with hidden file input
  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.txt,.doc,.docx,image/*"
        aria-label="File upload"
      />
      
      {/* Attachment Button */}
      <button
        onClick={handleButtonClick}
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
        className="p-2 text-gray-500 hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] rounded-lg transition-all duration-200"
        aria-label="Attach files"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      {/* Tooltip on hover */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg text-sm whitespace-nowrap z-10">
          Attach files (10MB max)
        </div>
      )}
    </div>
  );
};