import React, { useState, useRef } from 'react';

/**
 * File Attachment Button.
 * Supports images and documents with size validation.
 * * @component
 * @param {Object} props
 * @param {Function} props.onFileAttach - Callback when file is selected
 */
export const AttachmentButton = ({ onFileAttach }) => {
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validation (10MB Limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File is too large. Maximum size is 10MB.');
        return;
      }
      onFileAttach(file);
    }
    setIsHovered(false);
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.txt,.doc,.docx,.jpg,.png"
        aria-label="Upload file"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors duration-200"
        aria-label="Attach file"
        title="Attach file"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs rounded whitespace-nowrap shadow-lg z-10">
          Attach (10MB Max)
        </div>
      )}
    </div>
  );
};