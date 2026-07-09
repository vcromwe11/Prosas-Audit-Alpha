import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`px-4 py-3 rounded shadow-lg flex items-center gap-3 text-sm font-bold min-w-[250px] max-w-sm border ${
                t.type === 'success' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/80 dark:text-green-100 dark:border-green-700' :
                t.type === 'error' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/80 dark:text-red-100 dark:border-red-700' :
                t.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/80 dark:text-yellow-100 dark:border-yellow-700' :
                'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/80 dark:text-blue-100 dark:border-blue-700'
              }`}
            >
                {t.type === 'success' && <i className="fas fa-check-circle text-green-500"></i>}
                {t.type === 'error' && <i className="fas fa-exclamation-circle text-red-500"></i>}
                {t.type === 'warning' && <i className="fas fa-exclamation-triangle text-yellow-500"></i>}
                {t.type === 'info' && <i className="fas fa-info-circle text-blue-500"></i>}
              <p className="flex-1 whitespace-pre-wrap">{t.message}</p>
              <button 
                onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
