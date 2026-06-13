import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Tooltip: React.FC<{ text: string; children: React.ReactNode; enabled: boolean; position?: 'top' | 'right' }> = ({ text, children, enabled, position = 'right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  };

  const handleMouseEnter = () => {
    if (!enabled) return;
    updatePosition();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const tooltipElement = createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, ...(position === 'right' ? { x: -5 } : { y: 5 }) }}
          animate={{ opacity: 1, scale: 1, ...(position === 'right' ? { x: 0 } : { y: 0 }) }}
          exit={{ opacity: 0, scale: 0.95, ...(position === 'right' ? { x: -5 } : { y: 5 }) }}
          className="fixed z-[99999] px-3 py-2 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-xl whitespace-nowrap pointer-events-none border border-gray-700 dark:border-gray-200"
          style={{
            ...(position === 'top' 
              ? {
                  top: coords.top - 8,
                  left: coords.left + coords.width / 2,
                  transform: 'translate(-50%, -100%)',
                } 
              : {
                  top: coords.top + coords.height / 2,
                  left: coords.left + coords.width + 8,
                  transform: 'translateY(-50%)',
                })
          }}
        >
          {text}
          <div className={`absolute border-4 border-transparent ${
            position === 'right'
              ? 'top-1/2 right-full -translate-y-1/2 border-r-gray-800 dark:border-r-gray-100'
              : 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 dark:border-t-gray-100'
          }`} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <div ref={triggerRef} className="relative inline-block w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
      {children}
      {tooltipElement}
    </div>
  );
};
