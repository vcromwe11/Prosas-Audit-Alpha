import { useState, useEffect, useMemo } from 'react';
import { AppSettings, AppStage } from '../types';

export const useAppSettings = (stage: AppStage) => {
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
        try {
          const parsed = JSON.parse(saved);
          
          const obsoleteModels = ['gemini-3.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-pro-exp-0205'];
          if (obsoleteModels.includes(parsed.aiModel)) {
              parsed.aiModel = 'gemini-2.5-flash';
              localStorage.setItem('prosas_app_settings', JSON.stringify(parsed));
          }
          if (obsoleteModels.includes(parsed.aiModelEconomico)) {
              parsed.aiModelEconomico = 'gemini-2.5-flash';
              localStorage.setItem('prosas_app_settings', JSON.stringify(parsed));
          }
          if (obsoleteModels.includes(parsed.aiModelPotente)) {
              parsed.aiModelPotente = 'gemini-2.5-flash';
              localStorage.setItem('prosas_app_settings', JSON.stringify(parsed));
          }

          return { theme: 'classic', visualTheme: 'classic', ...parsed };
        } catch (e) {}
      }
    }
    return {
      theme: 'classic',
      visualTheme: 'classic',
      isBoldText: false,
      maxConcurrentSlots: 5,
      autoSaveDrive: false,
      compactMode: false,
      showTooltips: true,
      aiModel: 'gemini-2.5-flash',
      extractTextLocal: false,
      maxAiRetries: 3
    };
  });

  const [analysisMode, setAnalysisMode] = useState<'IA_COMPLETA' | 'IA_OTIMIZADA'>('IA_COMPLETA');
  const isOtimizada = analysisMode === 'IA_OTIMIZADA';
  
  const colorsStyle = useMemo(() => {
      const visualThemeKey = appSettings.visualTheme || 'classic';
      return {
          accentText: isOtimizada ? 'text-emerald-600 dark:text-emerald-400' : (visualThemeKey === 'warm' ? 'text-amber-600 dark:text-amber-400' : visualThemeKey === 'cool' ? 'text-cyan-600 dark:text-cyan-400' : visualThemeKey === 'mono' ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-prosas-blue'),
          accentTextHover: isOtimizada ? 'hover:text-emerald-500 dark:hover:text-emerald-400' : (visualThemeKey === 'warm' ? 'hover:text-amber-500 dark:hover:text-amber-400' : visualThemeKey === 'cool' ? 'hover:text-cyan-500/90 dark:hover:text-cyan-400' : visualThemeKey === 'mono' ? 'hover:text-gray-700 dark:hover:text-gray-300' : 'hover:text-prosas-blue dark:hover:text-prosas-blue'),
          accentBg: isOtimizada ? 'bg-emerald-600 dark:bg-emerald-500' : (visualThemeKey === 'warm' ? 'bg-amber-600 dark:bg-amber-500' : visualThemeKey === 'cool' ? 'bg-cyan-600 dark:bg-cyan-500' : visualThemeKey === 'mono' ? 'bg-gray-950 dark:bg-white text-white dark:text-black font-semibold' : 'bg-prosas-blue'),
          accentBgHover: isOtimizada ? 'hover:bg-emerald-700 dark:hover:bg-emerald-600' : (visualThemeKey === 'warm' ? 'hover:bg-amber-700 dark:hover:bg-amber-600' : visualThemeKey === 'cool' ? 'hover:bg-cyan-700 dark:hover:bg-cyan-600' : visualThemeKey === 'mono' ? 'hover:bg-gray-800 dark:hover:bg-gray-100' : 'hover:bg-prosas-blueDark'),
          accentBgLight: isOtimizada ? 'bg-emerald-50 dark:bg-emerald-950/20' : (visualThemeKey === 'warm' ? 'bg-amber-50 dark:bg-amber-950/20' : visualThemeKey === 'cool' ? 'bg-cyan-50 dark:bg-cyan-950/20' : visualThemeKey === 'mono' ? 'bg-gray-100 dark:bg-gray-900/50' : 'bg-blue-50 dark:bg-blue-900/10'),
          accentBgLightIcon: isOtimizada ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-650 dark:text-emerald-400' : (visualThemeKey === 'warm' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : visualThemeKey === 'cool' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-550' : visualThemeKey === 'mono' ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'bg-blue-100 dark:bg-blue-900/30 text-prosas-blue'),
          accentBorder: isOtimizada ? 'border-emerald-500' : (visualThemeKey === 'warm' ? 'border-amber-500' : visualThemeKey === 'cool' ? 'border-cyan-500' : visualThemeKey === 'mono' ? 'border-gray-950 dark:border-gray-100' : 'border-prosas-blue'),
          accentHoverBorder: isOtimizada ? 'hover:border-emerald-500 dark:hover:border-emerald-500' : (visualThemeKey === 'warm' ? 'hover:border-amber-500 dark:hover:border-amber-500' : visualThemeKey === 'cool' ? 'hover:border-cyan-500 dark:hover:border-cyan-500' : visualThemeKey === 'mono' ? 'hover:border-gray-950 dark:hover:border-gray-100' : 'hover:border-prosas-blue dark:hover:border-prosas-blue'),
          accentFocusRing: isOtimizada ? 'focus:ring-emerald-500' : (visualThemeKey === 'warm' ? 'focus:ring-amber-500' : visualThemeKey === 'cool' ? 'focus:ring-cyan-500' : visualThemeKey === 'mono' ? 'focus:ring-gray-950 dark:focus:ring-gray-100' : 'focus:ring-prosas-blue'),
          accentCardSelectedBg: isOtimizada ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/10' : (visualThemeKey === 'warm' ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/10' : visualThemeKey === 'cool' ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/10' : visualThemeKey === 'mono' ? 'border-gray-850 dark:border-gray-200 bg-gray-100 dark:bg-gray-800/40' : 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'),
          accentCardSelectedText: isOtimizada ? 'text-emerald-700 dark:text-emerald-450' : (visualThemeKey === 'warm' ? 'text-amber-700 dark:text-amber-450' : visualThemeKey === 'cool' ? 'text-cyan-700 dark:text-cyan-450' : visualThemeKey === 'mono' ? 'text-gray-900 dark:text-gray-100' : 'text-blue-700 dark:text-blue-400')
      };
  }, [appSettings.visualTheme, isOtimizada]);

  useEffect(() => {
    localStorage.setItem('prosas_app_settings', JSON.stringify(appSettings));
    if (appSettings.isBoldText) {
      document.body.classList.add('font-medium');
    } else {
      document.body.classList.remove('font-medium');
    }

    if (stage === AppStage.DEMO_PLATFORM) {
      document.body.classList.remove('theme-modern', 'theme-warm', 'theme-cool', 'theme-mono');
    } else {
      if (appSettings.theme === 'modern') {
        document.body.classList.add('theme-modern');
      } else {
        document.body.classList.remove('theme-modern');
      }
      document.body.classList.remove('theme-warm', 'theme-cool', 'theme-mono');
      const visualThemeKey = appSettings.visualTheme || 'classic';
      if (visualThemeKey === 'warm') {
        document.body.classList.add('theme-warm');
      } else if (visualThemeKey === 'cool') {
        document.body.classList.add('theme-cool');
      } else if (visualThemeKey === 'mono') {
        document.body.classList.add('theme-mono');
      }
    }
  }, [appSettings, stage]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return {
    isDarkMode,
    setIsDarkMode,
    appSettings,
    setAppSettings,
    analysisMode,
    setAnalysisMode,
    isOtimizada,
    colorsStyle
  };
};
