import React, { useState, useEffect, useCallback } from 'react';

/**
 * MuseumTour Component.
 * Provides an interactive, step-by-step tour of the application interface.
 * Uses a "spotlight" effect to highlight specific DOM elements.
 * * @component
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the tour is active.
 * @param {function} props.onClose - Handler to close the tour.
 */
export const MuseumTour = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const TOOLTIP_WIDTH = 320; // Fixed width for tooltip

  // Tour Steps Configuration
  const steps = [
    {
      target: 'welcome', // Special target for the first slide (no element needed)
      title: "Welcome to the Meditations!",
      description: "You've successfully connected to the Enigma Logic Agency's Marcus Aurelius Chat Engine. This quick tour will guide you through the interface.",
      isWelcome: true
    },
    {
      target: 'aside', // Selector for Sidebar
      title: "The Archives (Navigation)",
      description: "This sidebar is your gateway. Access your conversation history, start new chats, and manage your sessions here."
    },
    {
      target: '.flex-1.overflow-y-auto', // Selector for Chat Area (Messages)
      title: "The Council Chamber",
      description: "This is where discourse happens. Your conversations with Marcus Aurelius will appear here in real-time."
    },
    {
      target: 'textarea', // Selector for Input
      title: "Your Voice",
      description: "Type your questions here, or use the microphone for voice input. You can even attach documents for analysis."
    },
    {
      target: 'button[title="Settings"]', // Selector for Settings Button
      title: "Configuration",
      description: "Adjust themes, manage data, and configure accessibility options to suit your needs."
    }
  ];
  
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isWelcomeStep = currentStepData.isWelcome;

  // Logic to calculate the spotlight position and constrain the tooltip
  const updatePosition = useCallback(() => {
    if (!isOpen || isWelcomeStep) {
        // Center the tooltip for the welcome slide
        setPosition({ 
            top: window.innerHeight / 2 - 150, // Center vertically
            left: window.innerWidth / 2 - (TOOLTIP_WIDTH / 2), // Center horizontally
            width: 0, height: 0 
        });
        setIsVisible(true);
        return;
    }

    // Handle target element positioning for non-welcome slides
    const element = document.querySelector(currentStepData.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      // Calculate Spotlight Position
      const highlight = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2)
      };

      // Calculate Tooltip Position (Constrained to Viewport)
      let tooltipTop = highlight.top + highlight.height + 20;
      let tooltipLeft = highlight.left;

      // 1. Flip Tooltip Up if it's near the bottom of the viewport
      if (tooltipTop + 200 > window.innerHeight) { 
          tooltipTop = highlight.top - 220; // 220px to accommodate card height
      }

      // 2. Clamp Tooltip to the right edge
      if (tooltipLeft + TOOLTIP_WIDTH > window.innerWidth - 20) {
          tooltipLeft = window.innerWidth - TOOLTIP_WIDTH - 20;
      }
      
      // 3. Clamp Tooltip to the left edge
      if (tooltipLeft < 20) {
          tooltipLeft = 20;
      }
      
      setPosition({
        ...highlight,
        tooltipTop: tooltipTop,
        tooltipLeft: tooltipLeft
      });
      setIsVisible(true);

    } else {
      // Fallback for missing elements
      setPosition({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150, width: 300, height: 200 });
      setIsVisible(true);
    }
  }, [isOpen, currentStep, isWelcomeStep]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
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


  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      {/* 1. Backdrop/Spotlight (Hidden for Welcome Slide) */}
      {!isWelcomeStep && (
        <div 
            className="absolute transition-all duration-500 ease-[cubic-bezier(0.25,0.4,0.25,1)] rounded-xl border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.75)]"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
              opacity: isVisible ? 1 : 0
            }}
        />
      )}
      
      {/* 2. Full Backdrop for Welcome Slide */}
      {isWelcomeStep && (
        <div className="absolute inset-0 bg-black/70 transition-opacity duration-300" onClick={handleNext} />
      )}


      {/* 3. Tooltip Card */}
      <div 
        className="absolute transition-all duration-500 ease-out z-[101]"
        style={{
          top: isWelcomeStep ? position.top : position.tooltipTop,
          left: isWelcomeStep ? position.left : position.tooltipLeft,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          width: TOOLTIP_WIDTH // Use fixed width
        }}
        role="dialog"
        aria-label={currentStepData.title}
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] w-full p-6 rounded-2xl shadow-2xl relative">
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
              {currentStepData.title}
            </h3>
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border)]">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            {currentStepData.description}
          </p>

          <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
            <button 
              onClick={onClose}
              className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || isWelcomeStep}
                className={`px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] transition-colors ${
                  currentStep === 0 || isWelcomeStep ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-primary)] text-[var(--text-primary)]'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:opacity-90 shadow-sm transition-transform active:scale-95"
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};