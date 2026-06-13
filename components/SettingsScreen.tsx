import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PROMPTS } from '../prompts';
import { GlobalPrompt, UserProfile, AppStage } from '../types';
import { subscribeToGlobalPrompts, updateGlobalPrompt, updateUserProfile } from '../services/storageService';
import { useAnalysis } from '../src/contexts/AnalysisContext';
import UserManagementScreen from './UserManagementScreen';
import { useAuthGuard } from '../src/hooks/useAuthGuard';

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
  
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'advanced' | 'about'>('general');
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

        {/* Advanced Section */}
        {activeTab === 'advanced' && user?.role === 'admin' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
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
    </motion.div>
  );
};
