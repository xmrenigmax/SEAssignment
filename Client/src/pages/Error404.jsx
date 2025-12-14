import { useNavigate, useRouteError } from 'react-router-dom';
import { get } from 'lodash';
import clsx from 'clsx';

/**
 * Error404 Page.
 * Displays a Stoic-themed error message when a route is not found or crashes.
 */
const Error404 = () => {
  const navigate = useNavigate();
  const error = useRouteError();

  // Safely extract error message using Lodash
  const errorMessage = get(error, 'statusText') || get(error, 'message') || "Unknown Routing Error";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 text-center transition-colors duration-200">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-[var(--accent)] blur-[60px] opacity-20 rounded-full animate-pulse" />
        <svg className="w-32 h-32 text-[var(--text-primary)] relative z-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-4 text-[var(--accent)]">
        404
      </h1>
      <h2 className="text-xl md:text-2xl font-medium mb-2">
        The Path is Lost
      </h2>
      { error && (
        <div className="mb-8 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-left max-w-lg w-full overflow-auto text-xs font-mono text-red-400">
          <p className="font-bold mb-1">Error Diagnostics:</p>
          { errorMessage }
        </div>
      )}
      <button
        onClick={ () => navigate('/') }
        className={ clsx("group relative px-8 py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95", "bg-[var(--accent)] text-white hover:opacity-90 hover:shadow-[var(--accent)]/20") }>
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to the Museum Exhibit
        </span>
      </button>
      <div className="mt-12 text-[var(--text-secondary)] text-xs opacity-50 font-serif">
        Marcus Aurelius
      </div>
    </div>
  );
};

export default Error404;