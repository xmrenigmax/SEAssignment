import { useState, useEffect, useCallback, useRef } from 'react';
import { MuseumGuideModal } from '../../History/MuseumGuideModal';

/**
 * MuseumTour Component.
 * Uses the MuseumGuideModal as the Welcome Slide.
 */
export const MuseumTour = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const TOOLTIP_WIDTH = 320;

  const observerRef = useRef(null);

  const steps = [
    {
      id: 'welcome',
      isWelcome: true,
      title: "Welcome"
    },
    {
      target: 'aside',
      title: "The Archives",
      description: "This sidebar is your gateway. Access your conversation history, start new chats, and manage your sessions here.",
      placement: 'right'
    },
    {
      target: '.flex-1.overflow-y-auto',
      title: "The Historic Chats",
      description: "This is where discourse happens. Your conversations with Marcus Aurelius will appear here in real-time.",
      placement: 'center'
    },
    {
      target: 'textarea',
      title: "The Discussion Chamber",
      description: "Type your questions here, or use the microphone for voice input. You can even attach documents for analysis.",
      placement: 'top'
    },
    {
      target: 'button[title="Settings"]',
      title: "Configurations",
      description: "Adjust themes, manage data, and configure accessibility options to suit your needs.",
      placement: 'right'
    }
  ];

  const currentStepData = steps[currentStep];
  const isWelcomeStep = currentStepData.isWelcome;
  const isLastStep = currentStep === steps.length - 1;

  const updatePosition = useCallback(() => {
    if (!isOpen || isWelcomeStep) {
      setIsVisible(true);
      return;
    }

    const element = document.querySelector(currentStepData.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;

      const highlight = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2)
      };

      let tooltipTop = 0;
      let tooltipLeft = 0;
      const placement = currentStepData.placement || 'bottom';

      if (placement === 'right') {
        tooltipLeft = highlight.left + highlight.width + 20;
        tooltipTop = highlight.top + 20;
      } else if (placement === 'top') {
        tooltipLeft = highlight.left;
        tooltipTop = highlight.top - 200;
      } else {
        tooltipLeft = highlight.left;
        tooltipTop = highlight.top + highlight.height + 20;
      }

      if (tooltipTop < 20) tooltipTop = 20;
      if (tooltipTop + 250 > window.innerHeight) tooltipTop = window.innerHeight - 270;

      if (tooltipLeft < 20) tooltipLeft = 20;
      const maxLeft = window.innerWidth - TOOLTIP_WIDTH - 20;
      if (tooltipLeft > maxLeft) tooltipLeft = maxLeft;

      setPosition({
        ...highlight,
        tooltipTop,
        tooltipLeft
      });
      setIsVisible(true);

    } else {
      setPosition({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150, width: 300, height: 200 });
      setIsVisible(true);
    }
  }, [isOpen, isWelcomeStep, currentStepData]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      observerRef.current = new ResizeObserver(() => requestAnimationFrame(updatePosition));
      observerRef.current.observe(document.body);
      observerRef.current.observe(document.documentElement);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { capture: true });

      return () => {
        if (observerRef.current) observerRef.current.disconnect();
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, { capture: true });
      };
    }
  }, [isOpen, currentStep, updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
      setTimeout(() => setCurrentStep(0), 300);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  if (!isOpen) return null;

  if (isWelcomeStep) {
    return (
      <MuseumGuideModal
        isOpen={ true }
        onClose={ onClose }
        onStartTour={ handleNext }
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      <div
        className="absolute transition-all duration-300 ease-out rounded-xl border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.75)]"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          opacity: isVisible ? 1 : 0
        }}
      />

      <div
        className="absolute transition-all duration-300 ease-out z-[101]"
        style={{
          top: position.tooltipTop,
          left: position.tooltipLeft,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          width: TOOLTIP_WIDTH
        }}
        role="dialog"
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] w-full p-6 rounded-2xl shadow-2xl relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
              { currentStepData.title }
            </h3>
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border)]">
              { currentStep + 1 } / { steps.length }
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            { currentStepData.description }
          </p>
          <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
            <button onClick={ onClose } className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors">
              Skip
            </button>
            <div className="flex gap-2">
              <button onClick={ handlePrev } className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
                Back
              </button>
              <button onClick={ handleNext } className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:opacity-90 shadow-sm transition-transform active:scale-95">
                { isLastStep ? 'Finish' : 'Next' }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};