import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PROMPTS } from '../prompts';
import { GlobalPrompt, UserProfile, AppStage } from '../types';
import { subscribeToGlobalPrompts, updateGlobalPrompt, updateUserProfile } from '../services/storageService';
import { useAnalysis } from '../contexts/AnalysisContext';

interface SettingsScreenProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  appSettings: {
    isBoldText: boolean;
    theme: string;
    maxConcurrentSlots: number;
    autoSaveDrive: boolean;
    compactMode: boolean;
    showTooltips: boolean;
    [key: string]: any;
  };
  setAppSettings: React.Dispatch<React.SetStateAction<any>>;
  user: UserProfile | null;
  handleSetStage: (stage: AppStage) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  isDarkMode,
  setIsDarkMode,
  appSettings,
  setAppSettings,
  user,
  handleSetStage
}) => {
  const [globalPrompts, setGlobalPrompts] = useState<Record<string, string>>({});
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || user?.displayName || '',
    state: user?.state || '',
    company: user?.company || '',
    jobFunction: user?.jobFunction || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || user.displayName || '',
        state: user.state || '',
        company: user.company || '',
        jobFunction: user.jobFunction || ''
      });
    }
  }, [user]);

  useEffect(() => {
    // Pre-fill with hardcoded prompts, then override with DB
    const initialPrompts: Record<string, string> = { ...PROMPTS };
    setGlobalPrompts(initialPrompts);

    const unsubscribe = subscribeToGlobalPrompts((prompts) => {
        const merged = { ...initialPrompts };
        prompts.forEach(p => {
            if (p.text) merged[p.key] = p.text;
        });
        setGlobalPrompts(merged);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (key: string, text: string) => {
      setEditingPrompt(key);
      setEditingText(text);
  };

  const handleSavePrompt = async (key: string) => {
      if (!editingText.trim()) return;
      await updateGlobalPrompt(key, editingText);
      setEditingPrompt(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.uid) return;
      setIsSavingProfile(true);
      setProfileMsg('');
      try {
          await updateUserProfile(user.uid, profileForm);
          setProfileMsg('Perfil atualizado com sucesso!');
          setTimeout(() => setProfileMsg(''), 3000);
      } catch (error) {
          setProfileMsg('Erro ao atualizar perfil.');
      } finally {
          setIsSavingProfile(false);
      }
  };

  return (
    <motion.div
        key="settings"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="max-w-4xl mx-auto pb-12"
    >
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configurações</h1>
            <button
                onClick={() => handleSetStage(AppStage.DEMO_PLATFORM)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow-sm flex items-center gap-2 text-sm font-bold transition-all"
            >
                <i className="fas fa-desktop"></i>
                Modo Demonstração (Portal)
            </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200 mb-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Meus Dados Cadastrais</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                            <input 
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                            <input 
                                type="text"
                                value={profileForm.state}
                                onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                                placeholder="Ex: SP, RJ, MG"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Empresa / Instituição</label>
                            <input 
                                type="text"
                                value={profileForm.company}
                                onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cargo / Função</label>
                            <input 
                                type="text"
                                value={profileForm.jobFunction}
                                onChange={(e) => setProfileForm({...profileForm, jobFunction: e.target.value})}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            type="submit" 
                            disabled={isSavingProfile}
                            className="bg-prosas-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50"
                        >
                            {isSavingProfile ? <i className="fas fa-spinner fa-spin"></i> : "Salvar Perfil"}
                        </button>
                        {profileMsg && (
                            <span className={`text-sm font-bold ${profileMsg.includes('Erro') ? 'text-red-500' : 'text-green-500'}`}>
                                {profileMsg}
                            </span>
                        )}
                    </div>
                </form>
            </div>
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Aparência</h2>
                
                <div className="flex items-center justify-between py-3">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Modo Escuro</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Alterna entre o tema claro e escuro.</p>
                    </div>
                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Texto em Negrito</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aumenta o peso da fonte para melhor legibilidade.</p>
                    </div>
                    <button 
                        onClick={() => setAppSettings((prev: any) => ({ ...prev, isBoldText: !prev.isBoldText }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.isBoldText ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.isBoldText ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Layout Moderno</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Alterna para um design com maior contraste e bordas arredondadas.</p>
                    </div>
                    <button 
                        onClick={() => setAppSettings((prev: any) => ({ ...prev, theme: prev.theme === 'modern' ? 'classic' : 'modern' }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.theme === 'modern' ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.theme === 'modern' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Análise e Desempenho</h2>
                
                <div className="flex items-center justify-between py-3">
                    <div className="w-2/3">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Limite de Projetos Simultâneos</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Define quantos projetos podem ser analisados ao mesmo tempo. Valores altos podem causar lentidão.</p>
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <select 
                            value={appSettings.maxConcurrentSlots}
                            onChange={(e) => setAppSettings((prev: any) => ({ ...prev, maxConcurrentSlots: Number(e.target.value) }))}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block p-2.5"
                        >
                            <option value={1}>1 Projeto</option>
                            <option value={3}>3 Projetos</option>
                            <option value={5}>5 Projetos (Recomendado)</option>
                            <option value={10}>10 Projetos</option>
                            <option value={20}>20 Projetos (Avançado)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Auto-Salvar no Drive</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Salva automaticamente o contexto da análise no Google Drive.</p>
                    </div>
                    <button 
                        onClick={() => setAppSettings((prev: any) => ({ ...prev, autoSaveDrive: !prev.autoSaveDrive }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.autoSaveDrive ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.autoSaveDrive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Modo Compacto</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reduz o espaçamento da interface para mostrar mais informações na tela.</p>
                    </div>
                    <button 
                        onClick={() => setAppSettings((prev: any) => ({ ...prev, compactMode: !prev.compactMode }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.compactMode ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Dicas de Interface (Tooltips)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Exibir descrições ao passar o mouse sobre botões interativos.</p>
                    </div>
                    <button 
                        onClick={() => setAppSettings((prev: any) => ({ ...prev, showTooltips: !prev.showTooltips }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.showTooltips ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.showTooltips ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Advanced Section */}
            {user?.role === 'admin' && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="fas fa-code text-prosas-blue"></i> Configurações Avançadas
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Prompts da IA (Repositório Mestre)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Estas são as instruções base que a IA utiliza. Alterações feitas aqui refletirão para <strong>todos os usuários</strong> do sistema.
                        </p>
                        
                        <div className="space-y-6">
                            {Object.entries(globalPrompts).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</label>
                                        {user?.role === 'admin' && editingPrompt !== key && (
                                            <button 
                                                onClick={() => handleEditClick(key, value as string)}
                                                className="text-xs text-prosas-blue hover:underline font-bold"
                                            >
                                                Editar
                                            </button>
                                        )}
                                    </div>
                                    
                                    {editingPrompt === key ? (
                                        <div className="space-y-2">
                                            <textarea 
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-800 p-3 rounded border border-prosas-blue focus:ring-2 focus:ring-prosas-blue font-mono text-[10px] text-gray-800 dark:text-gray-100 min-h-[300px]"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => setEditingPrompt(null)}
                                                    className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={() => handleSavePrompt(key)}
                                                    className="px-3 py-1 text-xs font-bold bg-prosas-blue text-white rounded hover:bg-blue-600 shadow-sm"
                                                >
                                                    Salvar Alteração Global
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-[10px] text-gray-600 dark:text-gray-400 max-h-48 overflow-y-auto whitespace-pre-wrap shadow-inner relative group">
                                            {value}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    </motion.div>
  );
};
