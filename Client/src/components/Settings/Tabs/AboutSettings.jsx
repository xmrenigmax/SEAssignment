import clsx from 'clsx';

/**
 * About/System Tab Component.
 * Good for "Project Report" visibility.
 * @component
 * @returns {JSX.Element} The AboutSettings component.
 */
export const AboutSettings = () => {

  /**
   * Defines the list of technologies used in the tech stack.
   * @type {string[]}
   */
  const techStack = [ 'React', 'Express', 'Tailwind', 'Hugging Face', 'Vite' ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border shadow-sm">
          <img src="/icons/marcus-aurelius.png" alt="Marcus Aurelius Bust" className="w-full h-full object-cover rounded-full"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Marcus Aurelius</h2>
          <p className="text-[var(--text-secondary)]">Stoic AI Companion</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold mb-2 text-[var(--text-primary)]">Development Team</h3>
          <p className="text-sm text-[var(--text-secondary)]">Group 1</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Software Engineering 25/26</p>
        </div>
        <div className="p-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold mb-2 text-[var(--text-primary)]">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            { techStack.map((tech) => (
              <span key={ tech } className={ clsx( "text-xs px-2 py-1 rounded-md border", "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]" )}>
                { tech }
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};