import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, Idea } from '../types';

interface UIContextType {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isIdeaModalOpen: boolean;
  setIsIdeaModalOpen: (open: boolean) => void;
  selectedIdea: Idea | null;
  setSelectedIdea: (idea: Idea | null) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  isExportMenuOpen: boolean;
  setIsExportMenuOpen: (open: boolean) => void;
  exportSuccessMsg: string;
  setExportSuccessMsg: (msg: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prosas_app_settings');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return {
      theme: 'standard' as const,
      isBoldText: false,
      maxConcurrentSlots: 5,
      autoSaveDrive: false,
      compactMode: false,
      showTooltips: true
    };
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('prosas_app_settings', JSON.stringify(appSettings));
    if (appSettings.isBoldText) {
      document.documentElement.classList.add('font-bold');
    } else {
      document.documentElement.classList.remove('font-bold');
    }
    
    if (appSettings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
    
    if (appSettings.theme === 'modern') {
      document.documentElement.classList.add('theme-modern');
    } else {
      document.documentElement.classList.remove('theme-modern');
    }
  }, [appSettings]);

  return (
    <UIContext.Provider value={{
      isDarkMode, setIsDarkMode,
      appSettings, setAppSettings,
      isSidebarCollapsed, setIsSidebarCollapsed,
      isIdeaModalOpen, setIsIdeaModalOpen,
      selectedIdea, setSelectedIdea,
      isDeleteModalOpen, setIsDeleteModalOpen,
      isExportMenuOpen, setIsExportMenuOpen,
      exportSuccessMsg, setExportSuccessMsg
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
