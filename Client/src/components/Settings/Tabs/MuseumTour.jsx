import { useState, useEffect, useCallback, useRef } from 'react';
import { MuseumGuideModal } from '../../History/MuseumGuideModal';
import { get } from 'lodash';
import clsx from 'clsx';

/**
 * MuseumTour Component.
 * Uses the MuseumGuideModal as the Welcome Slide.
 */
export const MuseumTour = ({ isOpen, onClose, isMobileOpen, setIsMobileOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isSidebarAnimating, setIsSidebarAnimating] = useState(false);

  // State to hold the steps fetched from JSON
  const [steps, setSteps] = useState([]);

  const TOOLTIP_WIDTH = 320;
  const observerRef = useRef(null);

  // Fetch steps on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchSteps = async () => {
      try {
        const response = await fetch('/data/tour-steps.json', { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setSteps(data);
        } else {
          console.error("Failed to load TourSteps.json");
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching tour steps:", error);
        }
      }
    };
    fetchSteps();
    return () => controller.abort();
  }, []);

  // Safe access to data using Lodash
  const currentStepData = get(steps, `[${currentStep}]`, {});
  const isWelcomeStep = get(currentStepData, 'isWelcome', false);
  const isLastStep = currentStep === steps.length - 1;

  // Callback
  const updatePosition = useCallback(() => {
    // Safety check inside the hook
    if (steps.length === 0) return;

    if (!isOpen || isWelcomeStep || isSidebarAnimating) {
      setIsVisible(true);
      return;
    }

    const targetSelector = get(currentStepData, 'target');
    const element = targetSelector ? document.querySelector(targetSelector) : null;

    // Dynamic positioning: Calculate spotlight position around the target element
    // This must recalculate on: resize, scroll, sidebar animation, or window changes
    // getBoundingClientRect gives us viewport-relative coordinates in real-time
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
      const placement = get(currentStepData, 'placement', 'bottom');

      const isMobile = window.innerWidth < 768;

      if (placement === 'right') {
        tooltipLeft = highlight.left + highlight.width + 20;
        tooltipTop = highlight.top + 20;
      } else if (placement === 'top') {
        if (isMobile) {
          tooltipLeft = (window.innerWidth - TOOLTIP_WIDTH) / 2;
          tooltipTop = Math.max(20, highlight.top - 280);
        } else {
          tooltipLeft = highlight.left;
          tooltipTop = highlight.top - 200;
        }
      } else {
        tooltipLeft = highlight.left;
        tooltipTop = highlight.top + highlight.height + 180;
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
  }, [isOpen, isWelcomeStep, currentStepData, steps.length, isSidebarAnimating]);

  useEffect(() => {
    if (steps.length === 0) return;

    if (isOpen) {
      updatePosition();
      // ResizeObserver fires when ANY element changes size (including CSS transitions)
      // requestAnimationFrame ensures we update on the next paint cycle (60fps smooth)
      // This catches sidebar animations, font loading, and even browser zoom changes
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
  }, [isOpen, currentStep, updatePosition, steps.length]);

  useEffect(() => {
    if (!isOpen || !setIsMobileOpen || steps.length === 0) return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const targetSelector = get(currentStepData, 'target');

    if (targetSelector && (targetSelector === 'aside' || targetSelector.startsWith('aside '))) {
      setIsSidebarAnimating(true);
      setIsMobileOpen(true);
      setTimeout(() => {
        setIsSidebarAnimating(false);
        updatePosition();
      }, 350);
    } else if (!isWelcomeStep && targetSelector) {
      setIsSidebarAnimating(true);
      setIsMobileOpen(false);
      setTimeout(() => {
        setIsSidebarAnimating(false);
        updatePosition();
      }, 350);
    }
  }, [isOpen, currentStep, currentStepData, isWelcomeStep, setIsMobileOpen, steps.length, updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (setIsMobileOpen && window.innerWidth < 768) {
        setIsMobileOpen(false);
      }
      onClose();
      setTimeout(() => setCurrentStep(0), 300);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // RENDER LOGIC
  if (steps.length === 0) return null;
  if (!isOpen) return null;

  if (isWelcomeStep) {
    const handleWelcomeClose = () => {
      if (setIsMobileOpen && window.innerWidth < 768) {
        setIsMobileOpen(false);
      }
      onClose();
    };

    return (
      <MuseumGuideModal isOpen={ true } onClose={ handleWelcomeClose } onStartTour={ handleNext }/>
    );
  }
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      <div className="absolute transition-all duration-300 ease-out rounded-xl border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.75)]" style={{ top: position.top, left: position.left, width: position.width, height: position.height, opacity: isVisible ? 1 : 0 }}/>
      <div
        className="absolute transition-all duration-300 ease-out z-[101]"
        style={{ top: position.tooltipTop, left: position.tooltipLeft, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)', width: TOOLTIP_WIDTH }}
        role="dialog"
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] w-full p-6 rounded-2xl shadow-2xl relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
              { get(currentStepData, 'title', 'Tour') }
            </h3>
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border)]">
              { currentStep + 1 } / { steps.length }
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            { get(currentStepData, 'description', '') }
          </p>
          <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
            <button onClick={ () => {
              if (setIsMobileOpen && window.innerWidth < 768) {
                setIsMobileOpen(false);
              }
              onClose();
            }} className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors">
              Skip
            </button>
            <div className="flex gap-2">
              <button onClick={ handlePrev } className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
                Back
              </button>
              <button onClick={ handleNext } className={ clsx("px-4 py-1.5 text-xs font-medium rounded-lg text-white shadow-sm transition-transform active:scale-95", "bg-[var(--accent)] hover:opacity-90") }>
                { isLastStep ? 'Finish' : 'Next' }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};