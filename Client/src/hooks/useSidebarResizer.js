import { useState, useEffect, useCallback, useRef } from 'react';
import { clamp } from 'lodash';

/**
 * Manages the dynamic resizing of the sidebar with performance optimizations.
 * Uses requestAnimationFrame to prevent layout thrashing.
 */
export const useSidebarResizer = (defaultWidth = 288, minWidth = 240, maxWidth = 480) => {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
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
          // Lodash clamp replaces Math.max(min, Math.min(val, max))
          const newWidth = clamp(mouseEvent.clientX, minWidth, maxWidth);
          setSidebarWidth(newWidth);
        });
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {
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

  return { sidebarWidth, startResizing, isResizing };
};