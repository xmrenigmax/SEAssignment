import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for typewriter text effect.
 * Gradually reveals text character by character.
 *
 * @param {string} text - The full text to display
 * @param {number} speed - Delay between characters in milliseconds (default: 8)
 * @param {boolean} startTyping - Whether to start the typing animation
 * @returns {string} The currently visible portion of the text
 */
export const useTypewriter = (text, speed = 8, startTyping = true) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (!text || !startTyping) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
        timerRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
      }
    };

    timerRef.current = setTimeout(typeNextChar, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, speed, startTyping]);

  return { displayedText, isComplete };
};
