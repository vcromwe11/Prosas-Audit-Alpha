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
    }, 1500); // Aguarda por algum tempo antes de mostrar
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
          initial={{ opacity: 0, y: position === 'top' ? 5 : 0, x: position === 'right' ? -5 : 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[99999] bg-gray-900 text-white text-[10px] p-2 rounded shadow-2xl whitespace-pre-wrap pointer-events-none"
          style={{
            ...(position === 'top' 
              ? {
                  top: coords.top - 8, // 8px para a seta/margem
                  left: coords.left + coords.width / 2,
                  transform: 'translate(-50%, -100%)',
                  width: 'max-content',
                  maxWidth: '320px'
                } 
              : {
                  top: coords.top + coords.height / 2,
                  left: coords.left + coords.width + 8, // 8px de margem
                  transform: 'translateY(-50%)',
                  width: 'max-content',
                  maxWidth: '200px'
                })
          }}
        >
          {text}
          {/* Setas do Tooltip */}
          {position === 'top' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          )}
          {position === 'right' && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          )}
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
