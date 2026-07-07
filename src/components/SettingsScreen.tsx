import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PROMPTS } from '../prompts';
import { GlobalPrompt, UserProfile, AppStage } from '../types';
import { subscribeToGlobalPrompts, updateGlobalPrompt, updateUserProfile } from '../services/storageService';
import { useAnalysis } from '../contexts/AnalysisContext';
import UserManagementScreen from './UserManagementScreen';
import { useAuthGuard } from '../hooks/useAuthGuard';

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
  
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'advanced' | 'about' | 'honeypot'>('general');
  const [honeypotStage, setHoneypotStage] = useState(0);
  const [honeypotLoadingCompleted, setHoneypotLoadingCompleted] = useState(false);
  const [honeypotLoadingDuration, setHoneypotLoadingDuration] = useState(2.5);
  const [honeypotGif, setHoneypotGif] = useState("https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif");
  const [honeypotAddress, setHoneypotAddress] = useState("");
  
  const honeypotGifs = [
      "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
      "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif"
  ];

  const generateFakeAddress = (state: string) => {
      const defaultState = state || "RJ";
      const cities: Record<string, string[]> = {
          "SP": ["São Paulo", "Campinas", "Guarulhos"],
          "RJ": ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
          "MG": ["Belo Horizonte", "Uberlândia", "Contagem"]
      };
      const cityList = cities[defaultState] || ["Brasília", "Curitiba", "Fortaleza"];
      const city = cityList[Math.floor(Math.random() * cityList.length)];
      const streets = ["Rua das Acácias", "Av. dos Piratas", "Travessa do Hack", "Rodovia do Sucesso", "Beco do Código", "Alameda dos Anjos"];
      const street = streets[Math.floor(Math.random() * streets.length)];
      return `${street}, ${Math.floor(Math.random() * 1000) + 1} - ${city}/${defaultState}`;
  };

  const triggerHoneypotLoad = (duration: number) => {
      setHoneypotLoadingDuration(duration);
      setHoneypotStage(1);
      setHoneypotLoadingCompleted(false);
      
      let newGif;
      do {
          newGif = honeypotGifs[Math.floor(Math.random() * honeypotGifs.length)];
      } while (newGif === honeypotGif && honeypotGifs.length > 1);
      
      setHoneypotGif(newGif);
      
      if (!honeypotAddress) {
          setHoneypotAddress(generateFakeAddress(profileForm.state));
      }
  };

  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const { checkPermission } = useAuthGuard();

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
      if (!checkPermission('admin_action')) {
          alert('Ação não autorizada. Apenas administradores podem alterar prompts.');
          return;
      }
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
          const safeData = { ...profileForm };
          // Ensures role is not sent to avoid permission errors
          if ('role' in safeData) {
              delete (safeData as any).role;
          }
          await updateUserProfile(user.uid, safeData);
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

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
                onClick={() => setActiveTab('general')}
                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'general'
                        ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
                <i className="fas fa-sliders-h mr-2"></i>Geral
            </button>
            {user && (
                <button
                    onClick={() => setActiveTab('users')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'users'
                            ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                    <i className="fas fa-users-cog mr-2"></i>{user.role === 'admin' ? "Gerenciar Usuários" : "Usuários Autorizados"}
                </button>
            )}
            {user?.role === 'admin' && (
                <button
                    onClick={() => setActiveTab('advanced')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'advanced'
                            ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                    <i className="fas fa-code mr-2"></i>Avançado
                </button>
            )}
            <button
                onClick={() => setActiveTab('about')}
                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'about'
                        ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
                <i className="fas fa-info-circle mr-2"></i>Sobre
            </button>
            <button
                onClick={() => { setActiveTab('honeypot'); setHoneypotStage(0); }}
                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'honeypot'
                        ? 'border-gray-500 text-gray-700 dark:border-gray-400 dark:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                title="Diagnóstico do sistema e volumes locais"
            >
                <i className="fas fa-server mr-2 opacity-70"></i><span className="opacity-70">System Diagnostics</span>
            </button>
        </div>
        
        {activeTab === 'general' && (
            <>
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

                <div className="mt-8 pt-6 border-t border-gray-150 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2 text-sm">
                        <i className="fas fa-palette text-amber-500"></i> Temas Visuais (Modo de Customização Estilo IDE)
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
                        Selecione paletas de cores experimentais adicionais para simular e experimentar a identidade visual da plataforma em diferentes ambientes (inspirado nas customizações de temas do RStudio ou Jupyter Notebook).
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'classic', name: 'Azul Prosas (Default)', icon: 'fa-circle-nodes', bgGradient: 'from-blue-500 to-indigo-600', desc: 'Identidade azul clássica, clean e recomendada pela marca.' },
                          { id: 'warm', name: 'Pôr do Sol Quente', icon: 'fa-sun', bgGradient: 'from-amber-550 to-orange-600', desc: 'Base de tons aconchegantes baseados em âmbar, sienna e terracota.' },
                          { id: 'cool', name: 'Nórdico Glacial', icon: 'fa-snowflake', bgGradient: 'from-cyan-500 to-teal-600', desc: 'Paleta fria científica com tons de ciano, ardósia e oceano ártico.' },
                          { id: 'mono', name: 'Brutalista Noir', icon: 'fa-moon', bgGradient: 'from-gray-800 to-black', desc: 'Visual minimalista editorial, de alto contraste e cinza puro.' }
                        ].map((t) => {
                            const isSelected = (appSettings.visualTheme || 'classic') === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setAppSettings((prev: any) => ({ ...prev, visualTheme: t.id }))}
                                    className={`text-left p-4 rounded-lg border-2 transition-all flex items-start gap-3 relative ${
                                        isSelected 
                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50/10 dark:bg-blue-900/10 shadow-sm font-bold' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-transparent'
                                    }`}
                                >
                                    <div className={`p-2 rounded bg-gradient-to-r ${t.bgGradient} text-white mt-0.5 shadow-sm flex items-center justify-center h-8 w-8`}>
                                        <i className={`fas ${t.icon} text-sm text-center`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-gray-800 dark:text-gray-200">{t.name}</span>
                                            {isSelected && (
                                                <span className="text-[8px] tracking-wide font-black bg-blue-105 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1 py-0.2 rounded border border-blue-200/50">ATIVO</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-1 leading-snug">{t.desc}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-blue-500 dark:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow">
                                            <i className="fas fa-check"></i>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
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
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Modo Econômico de Tokens (Markdown)</h3>
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-yellow-900/50 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">NOVO</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Extrai o texto dos PDFs dos candidatos localmente antes de enviar para a IA. Economiza MUITOS tokens, mas perde detalhes visuais (carimbos, tabelas complexas).</p>
                    </div>
                    <button 
                        onClick={() => setAppSettings((prev: any) => ({ ...prev, extractTextLocal: !prev.extractTextLocal }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.extractTextLocal ? 'bg-prosas-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.extractTextLocal ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Tentativas de Análise (Retries)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Número máximo de vezes que a IA tentará analisar um documento em caso de erro antes de desistir (1 a 5).</p>
                    </div>
                    <input 
                        type="number"
                        min="1"
                        max="5"
                        value={appSettings.maxAiRetries || 3}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 3;
                            setAppSettings((prev: any) => ({ ...prev, maxAiRetries: Math.min(Math.max(val, 1), 5) }));
                        }}
                        className="w-20 p-2 text-sm border border-gray-200 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
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

        </div>
        </>
        )}

        {activeTab === 'users' && (
            <UserManagementScreen />
        )}

        {activeTab === 'about' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        <i className="fas fa-info-circle text-prosas-blue mr-2"></i>Sobre o Sistema
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                            Bem-vindo ao sistema de auditoria e análise documental inteligente. Esta aplicação foi desenvolvida para realizar a <strong>análise processual de editais</strong> e atuar como um centro de gestão do conhecimento. Usando Inteligência Artificial, a plataforma extrai dados críticos, avalia critérios de elegibilidade e ajuda a classificar a viabilidade técnica, otimizando drasticamente o fluxo de trabalho de equipes.
                        </p>
                        
                        <h3 className="text-md font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Principais Funcionalidades da Plataforma</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    id: 'ia',
                                    icon: 'fas fa-plus-circle',
                                    iconClass: 'bg-blue-100 dark:bg-blue-900/30 text-prosas-blue',
                                    title: 'Nova Análise (Motor de IA)',
                                    shortDesc: 'Extração automática de requisitos, cronograma e contrapartidas através da leitura de manuais e editais em PDF.',
                                    longDesc: 'O Motor de IA é o núcleo analítico do sistema. Com acesso central a arquivos (e integração com a nuvem), a IA lê o PDF integralmente e localiza seções-chave. A principal utilidade disso é a velocidade: em segundos você terá listado num formato de checklist o que sua instituição precisa providenciar de documentação e até que data, eliminando o dia inteiro lendo um documento espesso de 60 páginas.'
                                },
                                {
                                    id: 'drive',
                                    icon: 'fab fa-google-drive',
                                    iconClass: 'bg-green-100 dark:bg-green-900/30 text-green-600',
                                    title: 'Integração Google Drive',
                                    shortDesc: 'Conecta e busca recursos na nuvem do Google de forma protegida para leitura da IA.',
                                    longDesc: 'Em breve um detalhamento oficial será disponibilizado.'
                                },
                                {
                                    id: 'repo',
                                    icon: 'fas fa-folder-open',
                                    iconClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                                    title: 'Repositório em Nuvem',
                                    shortDesc: 'Gerenciador de arquivos completo. Criação de pastas em sub-níveis, visualização de documentos e movimentação simplificada.',
                                    longDesc: 'Em breve um detalhamento oficial será disponibilizado.'
                                },
                                {
                                    id: 'ideas',
                                    icon: 'fas fa-lightbulb',
                                    iconClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                                    title: 'Ideias e Notas',
                                    shortDesc: 'Caderno de rascunhos digital para prototipar ideias, fazer avaliações pontuais e armazenar blocos de texto formatado.',
                                    longDesc: 'Em breve um detalhamento oficial será disponibilizado.'
                                },
                                {
                                    id: 'dashboard',
                                    icon: 'fas fa-chart-pie',
                                    iconClass: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
                                    title: 'Dashboard & Busca',
                                    shortDesc: 'Uma visão gerencial do funil de aprovação com buscas textuais precisas que varrem toda a base histórica do sistema.',
                                    longDesc: 'Em breve um detalhamento oficial será disponibilizado.'
                                },
                                {
                                    id: 'admin',
                                    icon: 'fas fa-users-cog',
                                    iconClass: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                                    title: 'Administração de Sistema',
                                    shortDesc: 'Controle seguro de usuários autorizados e regras globais, moldando a IA de acordo com os critérios institucionais.',
                                    longDesc: 'Em breve um detalhamento oficial será disponibilizado.'
                                }
                            ].map((feature) => {
                                const isExpanded = expandedFeature === feature.id;
                                return (
                                    <motion.div 
                                        layout
                                        key={feature.id}
                                        onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                                        className={`flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors overflow-hidden ${isExpanded ? 'md:col-span-2 border-prosas-blue dark:border-blue-500 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <motion.div layout="position" className="flex items-start gap-3 w-full">
                                            <div className={`mt-1 p-2 rounded-lg flex items-center justify-center w-8 h-8 shrink-0 ${feature.iconClass}`}>
                                                <i className={feature.icon}></i>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{feature.title}</h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{feature.shortDesc}</p>
                                            </div>
                                            <div className="shrink-0 text-gray-400 self-center px-2">
                                                <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} transition-transform`}></i>
                                            </div>
                                        </motion.div>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    layout="position"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-1">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                            {feature.longDesc}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-800 mt-6 shadow-sm">
                        <h3 className="text-md font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                            <i className="fas fa-route"></i> Fluxo de Trabalho (Como Utilizar)
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-blue-800 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shadow-sm">1</div>
                                <div>
                                    <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">Processamento do Edital</h5>
                                    <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                        Navegue até <strong>Nova Análise</strong>. Forneça o arquivo PDF de um novo programa de financiamento ou copielo. A Inteligência Artificial fará a avaliação de risco, classificando itens complexos e traçando viabilidade. 
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-blue-800 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shadow-sm">2</div>
                                <div>
                                    <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">Guarda e Compartilhamento de Anexos</h5>
                                    <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                        Assim que você salva a análise inicial, entre no <strong>Repositório</strong>, crie uma estrutura de pastas para organização da instituição correspondente e armazene lá todos os termos de referência e planilhas exigidas.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-blue-800 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shadow-sm">3</div>
                                <div>
                                    <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">Desdobramento da Estratégia</h5>
                                    <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                        Utilize a área de <strong>Ideias e Notas</strong> para formular rascunhos ricos do projeto sem ter que abrir o Word. Você constrói orçamentos hipotéticos antes de formalizar em sistema.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-blue-800 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shadow-sm">4</div>
                                <div>
                                    <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">Acompanhamento Transparente</h5>
                                    <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                        Visite o painel <strong>Visão Geral</strong> para auditar quais tipos de aprovações têm prioridade ou qual histórico já foi atendido. Toda a nuvem de equipes vê a mesma verdade dos documentos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        
        {/* AI Workflow Section */}
        {activeTab === 'ai_workflow' && user?.role === 'admin' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="fas fa-microchip text-prosas-blue"></i> Fluxo de IA e Modelos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Visão detalhada de como a Inteligência Artificial é orquestrada no sistema para garantir precisão e eficiência.
                    </p>
                </div>
                <div className="p-6 space-y-8">
                    
                    {/* Stage 1: Edital Extraction */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="font-bold text-lg">1</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Extração de Regras (Mapeamento do Edital)
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                    Gemini 2.5 Flash / 1.5 Pro
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                A IA lê o texto integral do edital para extrair as exigências documentais, os prazos e criar os <strong>Módulos de Validação</strong>. 
                                Requer um modelo com janela de contexto ampla e alta capacidade de raciocínio lógico para compreender leis, anexos e exceções.
                            </p>
                        </div>
                    </div>

                    {/* Stage 2: Triage */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <span className="font-bold text-lg">2</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Triagem e Distribuição de Documentos
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                    Gemini 1.5 Flash
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Quando os documentos do candidato chegam, este modelo ágil e de baixo custo analisa a massa de arquivos (PDFs misturados) e 
                                "separa o joio do trigo". Ele identifica qual página ou arquivo corresponde a qual Módulo (ex: "Isto é o Cartão CNPJ", "Isto é a CND"),
                                descartando páginas irrelevantes e reduzindo o "ruído" para a próxima etapa.
                            </p>
                        </div>
                    </div>

                    {/* Stage 3: Module Analysis */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <span className="font-bold text-lg">3</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Validação Específica por Módulo
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                    Modelo Selecionado (Padrão: Gemini 2.5 Flash)
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Com os documentos já filtrados e separados, cada Módulo aciona a IA <strong>apenas com o documento que lhe compete</strong> e a sua regra específica.
                                Isso evita que o Módulo de "Cartão CNPJ" se confunda lendo páginas do "Estatuto Social", garantindo altíssima precisão e evitando falsos positivos.
                                O modelo para esta etapa pode ser escolhido na aba Avançado.
                            </p>
                        </div>
                    </div>

                    {/* Stage 4: Orchestration */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <span className="font-bold text-lg">4</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Orquestração e Parecer Final
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    Gemini 2.5 Flash
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                O orquestrador recebe os laudos de todos os Módulos individuais, consolida as informações da organização (como nome e status do CNPJ) 
                                e gera o formato estruturado JSON final ("APROVADO", "REPROVADO" ou "RESSALVAS") apresentado no painel.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        )}

        {/* Advanced Section */}
        {activeTab === 'advanced' && user?.role === 'admin' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="fas fa-code text-prosas-blue"></i> Configurações Avançadas
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Modelo de Inteligência Artificial</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Selecione o modelo do Gemini que será utilizado para as análises e extração de dados. Modelos mais avançados possuem maior custo e limites de cota mais estritos.
                        </p>
                        <select 
                            value={appSettings.aiModel || 'gemini-2.5-flash'}
                            onChange={(e) => setAppSettings((prev: any) => ({ ...prev, aiModel: e.target.value }))}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block w-full p-2.5"
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido, Menor Custo, Ótimo para Triagem)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Raciocínio Complexo, Maior Custo)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Nova Geração, Rápido, Excelente Custo-Benefício)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Padrão, Otimizado para Alta Performance)</option>
                        </select>
                    </div>

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
        {activeTab === 'honeypot' && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden font-mono p-6 min-h-[400px]"
            >
                <div className="mb-4 text-gray-700 dark:text-gray-300 text-lg border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                    <i className="fas fa-network-wired mr-3 text-xl"></i> 
                    <span className="font-bold tracking-widest uppercase text-sm">Diagnóstico do Sistema & Logs</span>
                </div>
                
                {honeypotStage === 0 && (
                    <div className="space-y-6 mt-6">
                        <p className="text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-800">
                            Aviso: Acesso a volumes persistentes e configurações de ambiente em formato bruto. Não modifique essas variáveis a menos que instruído pelos administradores do sistema.
                        </p>
                        <div className="border border-gray-200 dark:border-gray-700 p-0 bg-gray-50 dark:bg-gray-900 rounded shadow-inner text-sm">
                            <div className="flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 p-4 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700" onClick={() => triggerHoneypotLoad(1.5)}>
                                <span className="font-bold text-gray-700 dark:text-gray-300"><i className="fas fa-folder text-blue-500 mr-3"></i> /var/log/mongodb</span>
                                <span className="text-gray-400 dark:text-gray-500">14 Itens</span>
                            </div>
                            <div className="flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 p-4 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700" onClick={() => triggerHoneypotLoad(3.0)}>
                                <span className="font-bold text-gray-700 dark:text-gray-300"><i className="fas fa-file-code text-yellow-500 mr-3"></i> env_config.json</span>
                                <span className="text-gray-400 dark:text-gray-500">2.1 KB</span>
                            </div>
                            <div className="flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 p-4 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700" onClick={() => triggerHoneypotLoad(4.5)}>
                                <span className="font-bold text-gray-700 dark:text-gray-300"><i className="fas fa-database text-purple-500 mr-3"></i> session_cache.db</span>
                                <span className="text-gray-400 dark:text-gray-500">4.2 MB</span>
                            </div>
                            <div className="flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 p-4 cursor-pointer transition-colors" onClick={() => triggerHoneypotLoad(6.0)}>
                                <span className="font-bold text-gray-700 dark:text-gray-300"><i className="fas fa-key text-red-400 mr-3"></i> auth_tokens_v2.pem</span>
                                <span className="text-gray-400 dark:text-gray-500">Leitura Apenas</span>
                            </div>
                        </div>
                    </div>
                )}

                {honeypotStage === 1 && (
                    <div className="space-y-6 mt-12 px-8">
                        <p className={`text-sm text-center font-bold text-gray-600 dark:text-gray-400 ${honeypotLoadingCompleted ? '' : 'animate-pulse'}`}>
                            {honeypotLoadingCompleted ? 'Descriptografia da camada inicial concluída.' : 'Montando volumes seguros e decodificando nós...'}
                        </p>
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }} 
                                animate={{ width: honeypotLoadingCompleted ? "100%" : "100%" }} 
                                transition={{ duration: honeypotLoadingDuration, ease: "easeInOut" }} 
                                className={`h-full ${honeypotLoadingCompleted ? 'bg-green-500' : 'bg-blue-500'} rounded-full`} 
                                onAnimationComplete={() => setHoneypotLoadingCompleted(true)}
                            />
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-col gap-1 mt-4">
                            <p>Lendo blocos de armazenamento local...</p>
                            {honeypotLoadingCompleted && <p>Estabelecendo conexão socket crua...</p>}
                        </div>
                        
                        {honeypotLoadingCompleted && (
                            <div className="flex justify-center mt-6">
                                <button 
                                    onClick={() => {
                                        setHoneypotStage(2);
                                        setHoneypotLoadingCompleted(false);
                                    }}
                                    className="bg-prosas-blue hover:bg-blue-600 text-white px-6 py-2 rounded shadow font-bold font-sans transition-colors"
                                >
                                    Confirmar visualização
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {honeypotStage === 2 && (
                    <div className="space-y-6 mt-12 px-8">
                        <p className={`text-sm text-center font-bold text-red-500 ${honeypotLoadingCompleted ? '' : 'animate-pulse'}`}>
                            {honeypotLoadingCompleted ? 'ALERTA DE SEGURANÇA MÁXIMA DESABILITADO.' : 'Carregando arquivos restritos do sistema core...'}
                        </p>
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }} 
                                animate={{ width: "100%" }} 
                                transition={{ duration: honeypotLoadingDuration * 0.4, ease: "easeInOut" }} 
                                className={`h-full ${honeypotLoadingCompleted ? 'bg-red-600' : 'bg-red-400'} rounded-full`} 
                                onAnimationComplete={() => setHoneypotLoadingCompleted(true)}
                            />
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 mt-6">
                            <p className="text-red-700 dark:text-red-400 text-sm font-bold">⚠️ ATENÇÃO: Nível de Acesso ROOT atingido.</p>
                            <p className="text-red-600 dark:text-red-300 text-xs mt-1">Os dados que serão exibidos a seguir contêm segredos corporativos, senhas de acesso a banco de dados e APIs confidenciais. Qualquer vazamento causará danos irreparáveis aos sistemas, resultando na perda do seu emprego e da nossa dignidade computacional.</p>
                        </div>
                        
                        {honeypotLoadingCompleted && (
                            <div className="flex justify-center mt-6">
                                <button 
                                    onClick={() => {
                                        setHoneypotStage(3);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded shadow-lg font-bold font-sans transition-colors ring-4 ring-red-500/30 uppercase tracking-widest text-sm"
                                >
                                    Tem certeza absoluta?
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {honeypotStage === 3 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center p-4 space-y-6 mt-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center tracking-tight uppercase">Terminal Invadido!</h2>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-4">
                            <div className="relative">
                                <img 
                                    src={honeypotGif} 
                                    alt="Hacker" 
                                    className="rounded-xl shadow-2xl border-4 border-green-500 max-w-[250px] sm:max-w-[300px]" 
                                />
                                <div className="absolute -bottom-4 -right-4 text-5xl">🏴‍☠️</div>
                            </div>
                            
                            <div className="flex flex-col items-center bg-[#F4EBD0] border-4 border-[#8B5A2B] p-6 rounded-sm shadow-xl max-w-[250px] transform rotate-2">
                                <div className="text-[#8B5A2B] font-black text-4xl mb-4 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
                                    WANTED
                                </div>
                                <div className="border-[3px] border-[#8B5A2B] p-1 bg-[#E8DCC0] mb-4 shadow-sm w-36 h-36">
                                    <img 
                                        src={user?.photoURL || 'https://api.dicebear.com/7.x/identicon/svg?seed=question'}
                                        alt="User Silhouette"
                                        className="w-full h-full object-cover grayscale mix-blend-multiply opacity-80"
                                    />
                                </div>
                                <div className="text-center space-y-2 text-[#5C3A21]" style={{ fontFamily: 'Georgia, serif' }}>
                                    <p className="font-bold text-xl uppercase tracking-wider">{profileForm.name || 'Usuário Anônimo'}</p>
                                    <p className="text-sm font-medium border-t-2 border-b-2 border-[#8B5A2B] py-1 inline-block">Visto Por Último Em:</p>
                                    <p className="text-xs font-bold font-mono tracking-tight bg-white/50 px-2 py-1 rounded">{honeypotAddress}</p>
                                    <p className="text-xl font-black mt-3">REWARD: $50,000</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-3 mt-6">
                            <p className="text-xl text-green-500 dark:text-green-400 font-bold tracking-tight font-mono">Arghh! Você descobriu o nosso tesouro!</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed font-sans">
                                Não há senhas vazadas da AWS, Google Cloud ou cartões de crédito aqui. Sorria, você está sendo monitorado. Hack the planet! 💻✨
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => { setActiveTab('general'); }} 
                            className="mt-8 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded shadow-sm font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-sans"
                        >
                            Esconder as Provas & Voltar
                        </button>
                    </motion.div>
                )}
            </motion.div>
        )}
    </motion.div>
  );
};
