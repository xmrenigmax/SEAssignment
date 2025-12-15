import React from 'react';

/**
 * Search Input Component for the Sidebar.
 * Filters conversation history based on title/content matches.
 * @component
 * @param {Object} props
 * @param {string} props.searchTerm - The current search query string.
 * @param {Function} props.onSearchChange - Function to update the search query.
 */
export const SidebarSearch = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="px-4 py-2">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
          <svg
            className="h-4 w-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={ searchTerm }
          onChange={ (error) => onSearchChange(error.target.value) }
          placeholder="Search conversations..."
          className="w-full pl-10 pr-8 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
          aria-label="Search conversations"
          role="searchbox"
        />
        { searchTerm && (
          <button
            onClick={ () => onSearchChange('') }
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--accent)]"
            aria-label="Clear search query"
            type="button"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};