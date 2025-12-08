import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Manages the dynamic resizing of the sidebar with performance optimizations.
 * Uses requestAnimationFrame to prevent layout thrashing.
 */
export const useSidebarResizer = (defaultWidth = 288, minWidth = 240, maxWidth = 480) => {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const requestRef = useRef(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  const resize = useCallback(
    (mouseEvent) => {
      if (isResizing) {

        // Throttle updates using requestAnimationFrame
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        requestRef.current = requestAnimationFrame(() => {
          const newWidth = mouseEvent.clientX;
          if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
          }
        });
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {

      // Add listeners to window to handle dragging even if mouse leaves sidebar area
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);

      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, resize, stopResizing]);

  return { sidebarWidth, startResizing, isResizing, sidebarRef };
};