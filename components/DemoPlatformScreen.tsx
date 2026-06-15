import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppStage } from '../types';
import { useAnalysis } from '../src/contexts/AnalysisContext';
import { useAuth } from '../src/contexts/AuthContext';
import ReportViewer from './ReportViewer';
import { getReportResult } from '../services/storageService';

type DemoView = 'HOME' | 'EDITAIS_LIST' | 'EDITAL_PROJECTS' | 'PROJECT_DETAILS';

// Cache state module-level to persist across unmounts when navigating to ReportViewer and back
let cachedCurrentView: DemoView = 'HOME';
let cachedSelectedEdital: string | null = null;
let cachedSelectedProjectInfo: any | null = null;
let cachedProjectTab: 'Proponente' | 'Proposta' | 'Avaliação' | 'Comunicado' | 'Anotações' = 'Avaliação';
let cachedEvalSubTab: 'Proposta completa' | 'Análise de Compliance' | 'Inserir pareceres' | 'Parecer da pergunta' = 'Análise de Compliance';

export const DemoPlatformScreen: React.FC<{ 
    handleSetStage: (stage: AppStage) => void;
    groupedReports?: Record<string, any[]>;
    setSelectedReport?: (report: any) => void;
    onUpdateReport?: (report: any) => void;
}> = ({ handleSetStage, groupedReports = {}, setSelectedReport, onUpdateReport }) => {
    const { user } = useAuth();
    const [currentView, setCurrentViewState] = useState<DemoView>(cachedCurrentView);
    const [selectedEdital, setSelectedEditalState] = useState<string | null>(cachedSelectedEdital);
    const [selectedProjectInfo, setSelectedProjectInfoState] = useState<any | null>(cachedSelectedProjectInfo);
    const [projectTab, setProjectTabState] = useState<'Proponente' | 'Proposta' | 'Avaliação' | 'Comunicado' | 'Anotações'>(cachedProjectTab);
    const [evalSubTab, setEvalSubTabState] = useState<'Proposta completa' | 'Análise de Compliance' | 'Inserir pareceres' | 'Parecer da pergunta'>(cachedEvalSubTab);
    const [isLeftMenuCollapsed, setIsLeftMenuCollapsed] = useState(cachedCurrentView === 'PROJECT_DETAILS');
    const [isRightMenuCollapsed, setIsRightMenuCollapsed] = useState(cachedCurrentView === 'PROJECT_DETAILS');
    const [preloadedResults, setPreloadedResults] = useState<Record<string, any>>({});

    // Pre-fetch results when an edital is selected to avoid loading screens
    useEffect(() => {
        if (selectedEdital && groupedReports[selectedEdital]) {
            const reports = groupedReports[selectedEdital];
            reports.forEach(async (report) => {
                if (!report.result && !preloadedResults[report.id]) {
                    try {
                        const res = await getReportResult(report.id);
                        if (res) {
                            setPreloadedResults(prev => ({ ...prev, [report.id]: res }));
                        }
                    } catch (e) {
                        console.error('Failed to prefetch report', report.id, e);
                    }
                }
            });
        }
    }, [selectedEdital, groupedReports]);

    // Wrappers to update both local state and cache
    const setCurrentView = (val: DemoView) => { 
        cachedCurrentView = val; 
        setCurrentViewState(val); 
        if (val === 'PROJECT_DETAILS') {
            setIsLeftMenuCollapsed(true);
            setIsRightMenuCollapsed(true);
        } else {
            setIsLeftMenuCollapsed(false);
            setIsRightMenuCollapsed(false);
        }
    };
    const setSelectedEdital = (val: string | null) => { cachedSelectedEdital = val; setSelectedEditalState(val); };
    const setSelectedProjectInfo = (val: any | null) => { cachedSelectedProjectInfo = val; setSelectedProjectInfoState(val); };
    const setProjectTab = (val: 'Proponente' | 'Proposta' | 'Avaliação' | 'Comunicado' | 'Anotações') => { cachedProjectTab = val; setProjectTabState(val); };
    const setEvalSubTab = (val: 'Proposta completa' | 'Análise de Compliance' | 'Inserir pareceres' | 'Parecer da pergunta') => { cachedEvalSubTab = val; setEvalSubTabState(val); };

    const handleExitDemo = () => {
        handleSetStage(AppStage.SETTINGS);
    };

    const handleGoToAppDashboard = () => {
        handleSetStage(AppStage.DASHBOARD);
    };

    const renderEditaisList = () => {
        const editaisKeys = Object.keys(groupedReports);

        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <button 
                        onClick={() => setCurrentView('HOME')}
                        className="text-gray-500 dark:text-gray-400 hover:text-[#1381b8] dark:text-[#38bdf8] font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i> Voltar para Página Inicial
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 mb-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Meus Editais do Banco de Incentivados</h2>
                </div>

                {editaisKeys.length === 0 && (
                    <div className="text-gray-500 dark:text-gray-400 p-8 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        Nenhum edital analisado ainda.
                    </div>
                )}

                {editaisKeys.map((editalName, index) => {
                    const rascunhos = Math.floor(Math.random() * 200) + 10;
                    const inscritas = groupedReports[editalName].length;

                    return (
                        <div key={editalName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex overflow-hidden">
                            
                            {/* ID Tag (top left) */}
                            <div className="w-40 flex flex-col items-center justify-center p-4 border-r border-gray-100 dark:border-gray-700 relative">
                                <div className="absolute top-0 left-0 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[10px] px-2 py-1 rounded-br z-10">
                                    ID:{16000 + index}
                                </div>
                                <div className="text-center mt-6 mb-4">
                                    <span className="text-3xl font-bold text-[#cc3333]">bip</span>
                                    <div className="text-[9px] text-[#cc3333] leading-tight mt-1">Banco de<br/>Incentivados<br/>da Prosas</div>
                                </div>
                                <span className="border border-gray-300 dark:border-gray-600 rounded-full px-4 py-1 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800">
                                    Público
                                </span>
                            </div>

                            {/* Mid content */}
                            <div className="flex-1 p-6 flex flex-col justify-center">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{editalName}</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-gray-100 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                        <i className="fas fa-check text-green-500 text-opacity-50"></i> <span className="text-gray-400">Publicado</span>
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 mb-2">
                                    <i className="far fa-calendar-alt w-5 text-gray-300"></i> Inscrições contínuas
                                </div>
                                <div className="text-sm text-gray-400 mb-3">
                                    Rascunhos: <strong className="font-semibold">{rascunhos}</strong> &nbsp; 
                                    Inscritas: <strong className="font-semibold bg-blue-100 text-blue-800 px-1 rounded">{inscritas}</strong>
                                </div>
                                <div className="text-xs text-gray-400 opacity-50">
                                    Data de criação: 01/01/2026
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="w-56 p-6 flex flex-col justify-start gap-3">
                                <button 
                                    onClick={() => {
                                        setSelectedEdital(editalName);
                                        setCurrentView('EDITAL_PROJECTS');
                                    }}
                                    className="w-full border border-[#1381b8] text-[#1381b8] dark:text-[#38bdf8] hover:bg-blue-50 rounded px-4 py-2 text-sm font-medium flex justify-between items-center transition-colors"
                                >
                                    Painel Gerencial
                                    <i className="fas fa-list-alt"></i>
                                </button>
                                <button className="w-full border border-gray-300 dark:border-gray-600 text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50 rounded px-4 py-2 text-sm flex justify-between items-center transition-colors cursor-not-allowed">
                                    Ações
                                    <i className="fas fa-chevron-down text-xs"></i>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleUpdateReportDemo = (report: any) => {
        if (onUpdateReport) {
            onUpdateReport(report);
        }
        if (selectedProjectInfo && selectedProjectInfo.id === report.id) {
            setSelectedProjectInfo(report);
        }
    };

    const renderEditalProjects = () => {
        const projetos = (selectedEdital && groupedReports[selectedEdital]) ? groupedReports[selectedEdital] : [];

        return (
            <div className="flex flex-col gap-4">
                {/* Back to Editais Navigation */}
                <div className="flex items-center gap-2 mb-2">
                    <button 
                        onClick={() => setCurrentView('EDITAIS_LIST')}
                        className="text-gray-500 dark:text-gray-400 hover:text-[#1381b8] dark:text-[#38bdf8] font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i> Voltar para Editais
                    </button>
                </div>

                {/* Edital Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-[#cc3333]">bip</span>
                            <div className="text-[7px] text-[#cc3333] leading-tight">Banco de<br/>Incentivados<br/>da Prosas</div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedEdital}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Público</p>
                        </div>
                    </div>
                    <button className="border border-[#1381b8] text-[#1381b8] dark:text-[#38bdf8] px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors">
                        <i className="fas fa-cog"></i> Configurações
                    </button>
                </div>

                {/* Main Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button className="bg-[#0f6a96] dark:bg-[#0c5378] text-white px-6 py-3 font-bold text-sm">Gerenciar Propostas</button>
                        <button className="px-6 py-3 font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700">Gerenciar Etapas</button>
                        <button className="px-6 py-3 font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700">Estatísticas</button>
                        <button className="px-6 py-3 font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800/50">Agenda de Eventos</button>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex gap-4 items-center">
                        <div className="relative flex-1 max-w-sm">
                            <input type="text" placeholder="Pesquisar nome da proposta" className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-[#1381b8]" />
                            <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                        </div>
                        <button className="bg-[#1381b8] text-white px-4 py-2 rounded text-sm font-bold">Filtro por Pareceristas</button>
                        <button className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm flex items-center gap-2 font-bold whitespace-nowrap"><i className="fas fa-filter"></i> Filtro avançado</button>
                        <button className="text-gray-400 text-sm ml-auto whitespace-nowrap"><i className="fas fa-trash-alt"></i> Limpar filtro</button>
                    </div>

                    {/* Tags Layer */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
                        <span className="bg-gray-200 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">Propostas 1362</span>
                        <span className="bg-gray-200 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">Pareceristas atribuídos às propostas 4</span>
                        <span className="bg-gray-200 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">Pareceristas atribuídos às etapas 0</span>
                    </div>

                    {/* Alert */}
                    <div className="bg-[#a8e6cf] text-[#0c5945] px-4 py-2 text-xs flex justify-between items-center">
                        <div className="flex items-center gap-2"><i className="fas fa-check"></i> Links da última exportação realizada em 06/04/2026 15:41</div>
                        <a href="#" className="underline">Visualizar Links</a>
                    </div>

                    {/* Toolbar */}
                    <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-4 px-2 font-bold overflow-x-auto">
                            <span className="cursor-pointer hover:text-[#1381b8] dark:text-[#38bdf8] whitespace-nowrap"><i className="fas fa-tasks"></i> Avaliação <i className="fas fa-chevron-down text-[10px]"></i></span>
                            <span className="cursor-pointer hover:text-[#1381b8] dark:text-[#38bdf8] whitespace-nowrap"><i className="fas fa-comment-alt"></i> Enviar Comunicado</span>
                            <span className="cursor-pointer hover:text-[#1381b8] dark:text-[#38bdf8] whitespace-nowrap"><i className="fas fa-exchange-alt"></i> Alterar etapa</span>
                            <span className="cursor-pointer hover:text-[#1381b8] dark:text-[#38bdf8] whitespace-nowrap"><i className="fas fa-user"></i> Pareceristas <i className="fas fa-chevron-down text-[10px]"></i></span>
                            <span className="cursor-pointer hover:text-[#1381b8] dark:text-[#38bdf8] whitespace-nowrap"><i className="fas fa-bullhorn"></i> Divulgar <i className="fas fa-chevron-down text-[10px]"></i></span>
                            <span className="cursor-pointer hover:text-[#1381b8] dark:text-[#38bdf8] whitespace-nowrap"><i className="fas fa-tags"></i> Tags <i className="fas fa-chevron-down text-[10px]"></i></span>
                        </div>
                    </div>
                    
                    <div className="text-xs text-[#1381b8] dark:text-[#38bdf8] p-3 mt-1 bg-white dark:bg-gray-800">
                        Enviar comunicado para 1362 proposta(s).
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-t border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="p-3 w-10 text-center"><input type="checkbox" /></th>
                                    <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Status <i className="fas fa-chevron-down text-[10px]"></i></th>
                                    <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Comunicado <i className="fas fa-chevron-down text-[10px]"></i></th>
                                    <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Tags</th>
                                    <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Proposta</th>
                                    <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Proponente</th>
                                    <th className="p-3 font-bold text-[#cc3333]"><i className="fas fa-robot"></i> Análise de IA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projetos.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Nenhum projeto encontrado.
                                        </td>
                                    </tr>
                                )}
                                {projetos.map(proj => (
                                    <tr key={proj.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                                        <td className="p-3 text-center"><input type="checkbox" /></td>
                                        <td className="p-3 text-center text-gray-400">
                                            {proj.manualStatus || proj.overallStatus || preloadedResults[proj.id]?.overallStatus ? (
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                                                    (proj.manualStatus || proj.overallStatus || preloadedResults[proj.id]?.overallStatus) === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                                    (proj.manualStatus || proj.overallStatus || preloadedResults[proj.id]?.overallStatus) === 'REPROVADO' ? 'bg-red-100 text-red-700' : 
                                                    (proj.manualStatus || proj.overallStatus || preloadedResults[proj.id]?.overallStatus) === 'APROVADO COM RESSALVAS' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {(proj.manualStatus || proj.overallStatus || preloadedResults[proj.id]?.overallStatus)}
                                                </span>
                                            ) : (
                                                <i className="fas fa-clipboard-check text-lg"></i>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-gray-400"><i className="far fa-comment-alt text-lg"></i></td>
                                        <td className="p-3 text-gray-400">--</td>
                                        <td className="p-3">
                                            <button 
                                                onClick={() => {
                                                    setSelectedProjectInfo(proj);
                                                    setCurrentView('PROJECT_DETAILS');
                                                }}
                                                className="text-[#1381b8] dark:text-[#38bdf8] hover:underline font-semibold text-left"
                                            >
                                                {proj.candidateName}
                                            </button>
                                        </td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{proj.candidateName}</td>
                                        <td className="p-3">
                                            <button 
                                                onClick={() => {
                                                    setSelectedProjectInfo(proj);
                                                    setProjectTab('Avaliação');
                                                    setEvalSubTab('Análise de Compliance');
                                                    setCurrentView('PROJECT_DETAILS');
                                                }}
                                                className="bg-[#cc3333] dark:bg-red-800 hover:bg-[#a32929] text-white px-3 py-1.5 rounded text-xs font-bold transition-transform hover:scale-105 shadow-sm whitespace-nowrap flex items-center gap-1"
                                            >
                                                <i className="fas fa-search"></i> Analisar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderProjectDetails = () => {
        if (!selectedProjectInfo) return null;

        return (
            <div className="flex flex-col gap-4">
                {/* Back to Project List */}
                <div className="flex items-center gap-2 mb-2">
                    <button 
                        onClick={() => setCurrentView('EDITAL_PROJECTS')}
                        className="text-gray-500 dark:text-gray-400 hover:text-[#1381b8] dark:text-[#38bdf8] font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i> Voltar para Painel Gerencial
                    </button>
                </div>

                {/* Cover & Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                    <div className="h-32 bg-gray-300 relative overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=1000" alt="Cover" className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                    
                    <div className="px-6 pb-6 pt-16 relative flex gap-6">
                        <div className="absolute -top-16 left-6 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-md">
                            <img src="https://images.unsplash.com/photo-1507676184212-d0c30a3c3738?auto=format&fit=crop&q=80&w=200" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 ml-36">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{selectedProjectInfo.candidateName}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{selectedProjectInfo.candidateName} • Entretenimento, Comunicação e Cultura</p>
                                    <button className="text-[#1381b8] dark:text-[#38bdf8] text-xs font-bold hover:underline flex items-center gap-1">
                                        Atribuir Tags <i className="fas fa-plus-circle"></i>
                                    </button>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end max-w-sm">
                                    <button className="bg-[#1381b8] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-[#1070a0] transition-colors shadow-sm">
                                        AÇÕES <i className="fas fa-chevron-down text-xs"></i>
                                    </button>
                                    <button className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-sm px-4 py-2 border border-transparent hover:bg-blue-50 rounded flex items-center gap-2 transition-colors">
                                        <i className="fas fa-cloud-download-alt"></i> BAIXAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Row */}
                <div className="flex bg-[#a8e6cf] rounded-t-lg overflow-hidden mt-4 shadow-sm">
                    {(['Proponente', 'Proposta', 'Avaliação', 'Comunicado', 'Anotações'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setProjectTab(tab)}
                            className={`px-6 py-4 font-bold text-sm flex-1 text-center transition-colors ${projectTab === tab ? 'bg-[#0c5945] text-white' : 'text-[#0c5945] hover:bg-[#85c9b2]'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex gap-4 items-start">
                    {/* Main Content Column */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                        {projectTab === 'Avaliação' && (
                            <div className="flex flex-col h-full">
                                {/* Sub Tabs */}
                                <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 pt-4">
                                    <button 
                                        onClick={() => setEvalSubTab('Proposta completa')}
                                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${evalSubTab === 'Proposta completa' ? 'border-[#0c5945] text-[#0c5945]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'}`}
                                    >
                                        Proposta completa
                                    </button>
                                    <button 
                                        onClick={() => setEvalSubTab('Análise de Compliance')}
                                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${evalSubTab === 'Análise de Compliance' ? 'border-[#cc3333] text-[#cc3333]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'}`}
                                    >
                                        <i className="fas fa-robot"></i> Análise de Compliance
                                    </button>
                                    <button 
                                        onClick={() => setEvalSubTab('Inserir pareceres')}
                                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${evalSubTab === 'Inserir pareceres' ? 'border-[#0c5945] text-[#0c5945]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'}`}
                                    >
                                        Inserir pareceres
                                    </button>
                                    <button 
                                        onClick={() => setEvalSubTab('Parecer da pergunta')}
                                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${evalSubTab === 'Parecer da pergunta' ? 'border-[#0c5945] text-[#0c5945]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'}`}
                                    >
                                        Parecer da pergunta
                                    </button>
                                </div>
                                {/* Sub Content */}
                                <div className="flex-1 overflow-y-auto bg-[#f9fafb] dark:bg-gray-900 p-6">
                                    {evalSubTab === 'Análise de Compliance' ? (
                                        <div className="w-full">
                                            {/* Simulate Prosas specific header stats */}
                                            <div className="flex items-center gap-6 mb-6 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden">
                                                        <img src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-1">
                                                            {selectedProjectInfo.candidateName} <i className="fas fa-asterisk text-[#1381b8] dark:text-[#38bdf8] text-[8px]"></i>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {selectedProjectInfo.candidateName.toLowerCase().replace(/\s+/g, '')}@prosas.com.br
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                                                <div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                                                    <div className="font-bold text-gray-800 dark:text-gray-100">
                                                        {selectedProjectInfo.manualStatus || selectedProjectInfo.overallStatus || (selectedProjectInfo.result || preloadedResults[selectedProjectInfo.id])?.overallStatus || '--'}
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                                                <div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Score de Risco</div>
                                                    <div className="font-bold text-gray-800 dark:text-gray-100">
                                                        {(selectedProjectInfo.overallStatus === 'REPROVADO' || selectedProjectInfo.overallStatus === 'APROVADO COM RESSALVAS' || (selectedProjectInfo.result || preloadedResults[selectedProjectInfo.id])?.overallStatus === 'REPROVADO' || (selectedProjectInfo.result || preloadedResults[selectedProjectInfo.id])?.overallStatus === 'APROVADO COM RESSALVAS') ? 'ALTO' : 'BAIXO'}
                                                    </div>
                                                </div>
                                            </div>

                                            <ReportViewer 
                                                key={selectedProjectInfo.id}
                                                report={{
                                                    ...selectedProjectInfo,
                                                    result: selectedProjectInfo.result || preloadedResults[selectedProjectInfo.id]
                                                }} 
                                                onBack={() => {}} 
                                                onGoToDashboard={() => {}} 
                                                onUpdateReport={handleUpdateReportDemo}
                                                userRole={user?.role} 
                                                userName={user?.name || user?.displayName || 'Analista'}
                                                isDemoMode={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center opacity-50 flex flex-col items-center h-full justify-center">
                                            <i className="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
                                            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">Não há nada por aqui!</h3>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {projectTab === 'Proponente' && (
                            <div className="p-8 h-full flex flex-col items-start gap-6">
                                <div className="grid grid-cols-2 gap-8 w-full">
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{selectedProjectInfo.candidateName}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Pessoa Jurídica</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Razão Social</label>
                                            <p className="text-gray-800 dark:text-gray-100 font-semibold mt-1">{selectedProjectInfo.candidateName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">CNPJ</label>
                                            <p className="text-gray-800 dark:text-gray-100 font-semibold mt-1">{selectedProjectInfo.cnpj}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Sobre</label>
                                            <p className="text-gray-800 dark:text-gray-100 mt-1 min-h-[100px] bg-gray-50 dark:bg-gray-800/50 rounded p-3 border border-gray-100 dark:border-gray-700 italic opacity-50">Dados não fornecidos</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2"><i className="fas fa-envelope"></i> Email</label>
                                            <p className="text-gray-800 dark:text-gray-100 font-semibold mt-1 bg-gray-50 dark:bg-gray-800/50 p-2 rounded min-w-[200px] h-8 border border-gray-100 dark:border-gray-700"></p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2"><i className="fas fa-phone"></i> Telefone</label>
                                            <p className="text-gray-800 dark:text-gray-100 font-semibold mt-1 bg-gray-50 dark:bg-gray-800/50 p-2 rounded min-w-[200px] h-8 border border-gray-100 dark:border-gray-700"></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {projectTab !== 'Avaliação' && projectTab !== 'Proponente' && (
                             <div className="p-8 text-center opacity-50 flex flex-col items-center justify-center h-full min-h-[300px]">
                                <i className="fas fa-tools text-6xl text-gray-300 mb-4"></i>
                                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">Em desenvolvimento</h3>
                                <p className="text-sm">Os dados desta aba estarão disponíveis em breve.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Columns Menus */}
                    <div className={`${isRightMenuCollapsed ? 'w-16' : 'w-72'} flex flex-col gap-2 transition-all duration-300 relative`}>
                        <button 
                            onClick={() => setIsRightMenuCollapsed(!isRightMenuCollapsed)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#2c8a73] mb-2 self-start shadow-sm mx-auto transition-transform hover:scale-105"
                        >
                            <i className={`fas fa-chevron-${isRightMenuCollapsed ? 'left' : 'right'} text-xs`}></i>
                        </button>
                        <button className={`w-full bg-[#2c8a73] hover:bg-[#216d5a] text-white ${isRightMenuCollapsed ? 'px-0 justify-center h-11' : 'px-4 py-3'} rounded text-sm font-bold flex items-center transition-colors shadow-sm overflow-hidden`} title="Adicionar Parecer">
                            <span className="flex items-center gap-2"><i className="fas fa-file-medical w-4 text-center"></i> {!isRightMenuCollapsed && "ADICIONAR PARECER"}</span>
                            {!isRightMenuCollapsed && <i className="fas fa-chevron-down ml-auto"></i>}
                        </button>
                        <button className={`w-full bg-[#2c8a73] hover:bg-[#216d5a] text-white ${isRightMenuCollapsed ? 'px-0 justify-center h-11' : 'px-4 py-3'} rounded text-sm font-bold flex items-center transition-colors shadow-sm overflow-hidden`} title="Etapas de Análise">
                            <span className="flex items-center gap-2"><i className="fas fa-layer-group w-4 text-center"></i> {!isRightMenuCollapsed && "ETAPAS DE ANÁLISE"}</span>
                            {!isRightMenuCollapsed && <i className="fas fa-chevron-down ml-auto"></i>}
                        </button>
                        <button className={`w-full bg-[#2c8a73] hover:bg-[#216d5a] text-white ${isRightMenuCollapsed ? 'px-0 justify-center h-11' : 'px-4 py-3'} rounded text-sm font-bold flex items-center transition-colors shadow-sm overflow-hidden`} title="Valores">
                            <span className="flex items-center gap-2"><i className="fas fa-dollar-sign w-4 text-center"></i> {!isRightMenuCollapsed && "VALORES"}</span>
                            {!isRightMenuCollapsed && <i className="fas fa-chevron-down ml-auto"></i>}
                        </button>
                        <button className={`w-full bg-[#2c8a73] hover:bg-[#216d5a] text-white ${isRightMenuCollapsed ? 'px-0 justify-center h-11' : 'px-4 py-3'} rounded text-sm font-bold flex items-center transition-colors shadow-sm overflow-hidden`} title="Decisão e Divulgação">
                            <span className="flex items-center gap-2"><i className="fas fa-bullhorn w-4 text-center"></i> {!isRightMenuCollapsed && "DECISÃO E DIVULGAÇÃO"}</span>
                            {!isRightMenuCollapsed && <i className="fas fa-chevron-down ml-auto"></i>}
                        </button>
                        <button className={`w-full bg-[#2c8a73] hover:bg-[#216d5a] text-white ${isRightMenuCollapsed ? 'px-0 justify-center h-11' : 'px-4 py-3'} rounded text-sm font-bold flex items-center transition-colors shadow-sm overflow-hidden`} title="Anotações Recentes">
                            <span className="flex items-center gap-2"><i className="fas fa-comment-dots w-4 text-center"></i> {!isRightMenuCollapsed && "ANOTAÇÕES RECENTES"}</span>
                            {!isRightMenuCollapsed && <i className="fas fa-chevron-down ml-auto"></i>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderHome = () => (
        <div className="flex flex-col gap-8">
            <section>
                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Destaques</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#f1c40f] text-4xl mb-3"><i className="fas fa-envelope-open-text"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Comunicados</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Você possui <strong>resposta de um dos comunicados enviados</strong>.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#f1c40f] text-4xl mb-3"><i className="fas fa-file-medical"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Novas Evidências</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visualize as novas <strong>evidências cadastradas</strong>.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#f1c40f] text-4xl mb-3"><i className="fas fa-clipboard-list"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Propostas atribuídas</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acompanhe as <strong>atribuições</strong> realizadas à você.</p>
                    </div>
                </div>
            </section>

            {/* PROSAS SECTION (TIES INTO OUR APP) */}
            <section>
                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Prosas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-file-invoice"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Editais</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visualize seus editais e <strong>gerencie seu processo de seleção</strong>.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-chart-bar"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Monitoramento</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acompanhe a <strong>evolução dos projetos</strong>.</p>
                    </div>
                    
                    {/* NEW COMPLIANCE/AUDIT BUTTON */}
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentView('EDITAIS_LIST')}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-[#cc3333] flex flex-col items-center text-center cursor-pointer relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 bg-[#cc3333] dark:bg-red-800 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                            Novo: IA
                        </div>
                        <div className="text-[#cc3333] text-4xl mb-3 group-hover:scale-110 transition-transform"><i className="fas fa-shield-alt"></i></div>
                        <h4 className="text-[#cc3333] font-bold text-lg mb-2 leading-tight">Análise Automática / Compliance</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acesse a <strong>Inteligência da Prosas</strong> para triagem documental de candidatos.</p>
                    </motion.div>

                </div>
            </section>

            {/* DADOS PARA IMPACTO */}
            <section>
                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Dados para impacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-th-large"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Portal dos Conselhos</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acesso gratuito</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-th-large"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Portal da Lei Rouanet</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acesso gratuito</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-th-large"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Portal da Lei do Esporte</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acesso gratuito</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-th-large"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Banco de Incentivados</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Exclusivo para assinantes</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-[#1381b8] dark:text-[#38bdf8] opacity-80 text-4xl mb-3"><i className="fas fa-th-large"></i></div>
                        <h4 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg mb-2">Programa de Dados</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Exclusivo para assinantes</p>
                    </div>
                </div>
            </section>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-900 font-sans flex flex-col">
            {/* TOP HEADER */}
            <header className="bg-[#cc3333] dark:bg-red-800 text-white h-14 flex items-center justify-between px-6 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExitDemo}
                        className="bg-white/10 hover:bg-white/25 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-arrow-left"></i> Sair do Modo Demo
                    </button>
                    <span className="text-2xl font-bold italic tracking-tight">prosas</span>
                </div>
                <div className="text-sm font-bold uppercase tracking-wider">
                    {currentView === 'HOME' ? 'Dashboard' : 'Editais / Análise Automática'}
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-white dark:bg-gray-800 text-[#cc3333] font-bold text-lg">
                        P
                    </div>
                    <button className="text-white hover:text-gray-200">
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT DIV */}
            <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 py-8 gap-8">
                
                {/* LEFT SIDEBAR */}
                <aside className={`${isLeftMenuCollapsed ? 'w-16' : 'w-72'} flex-shrink-0 flex flex-col gap-4 transition-all duration-300 relative`}>
                    <button 
                        onClick={() => setIsLeftMenuCollapsed(!isLeftMenuCollapsed)}
                        className="absolute -right-3 top-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#1381b8] dark:text-[#38bdf8] z-20 shadow-sm transition-transform hover:scale-105"
                    >
                        <i className={`fas fa-chevron-${isLeftMenuCollapsed ? 'right' : 'left'} text-xs`}></i>
                    </button>

                    {/* PROFILE CARD */}
                    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col items-center transition-all duration-300 ${isLeftMenuCollapsed ? 'p-2 pb-4' : 'pb-6'}`}>
                        {isLeftMenuCollapsed ? (
                            <div className="w-10 h-10 rounded-full bg-[#cc3333] dark:bg-red-800 text-white flex items-center justify-center text-xl font-bold italic shadow-sm mt-4">
                                P
                            </div>
                        ) : (
                            <>
                                <div className="w-full h-24 bg-[#cc3333] dark:bg-red-800 relative flex justify-center">
                                    {/* Abstract background graphics could go here */}
                                    <div className="absolute -bottom-10 w-20 h-20 bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700 z-10 flex items-center justify-center shadow-sm">
                                        <div className="w-full h-full rounded-full bg-[#cc3333] dark:bg-red-800 text-white flex items-center justify-center text-4xl font-bold italic">
                                            P
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-14 text-center">
                                    <h2 className="text-[#1381b8] dark:text-[#38bdf8] font-bold text-lg">PROSAS</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1">PATROCINADOR - ID: 621</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* SIDEBAR BUTTONS */}
                    <button 
                        onClick={() => setCurrentView('HOME')}
                        className={`${currentView === 'HOME' ? 'bg-[#0f6a96] dark:bg-[#0c5378]' : 'bg-[#1381b8]'} hover:bg-[#1070a0] text-white ${isLeftMenuCollapsed ? 'py-3 px-0 justify-center h-11' : 'py-3 px-4'} rounded font-bold text-sm text-left flex items-center gap-3 transition-colors shadow-sm overflow-hidden`} title="Página Inicial"
                    >
                        <i className="fas fa-home w-4 text-center"></i>
                        {!isLeftMenuCollapsed && "PÁGINA INICIAL"}
                    </button>
                    <button className={`bg-[#1381b8] hover:bg-[#1070a0] text-white ${isLeftMenuCollapsed ? 'py-3 px-0 justify-center h-11' : 'py-3 px-4'} rounded font-bold text-sm text-left flex items-center gap-3 transition-colors shadow-sm overflow-hidden`} title="Atualizar Meu Cadastro">
                        <i className="fas fa-pencil-alt w-4 text-center"></i>
                        {!isLeftMenuCollapsed && "ATUALIZAR MEU CADASTRO"}
                    </button>
                    <button className={`bg-[#1381b8] hover:bg-[#1070a0] text-white ${isLeftMenuCollapsed ? 'py-3 px-0 justify-center h-11' : 'py-3 px-4'} rounded font-bold text-sm text-left flex items-center gap-3 transition-colors shadow-sm overflow-hidden`} title="Cadastrar Edital">
                        <i className="fas fa-plus w-4 text-center"></i>
                        {!isLeftMenuCollapsed && "CADASTRAR EDITAL"}
                    </button>
                    <button className={`bg-[#1381b8] hover:bg-[#1070a0] text-white ${isLeftMenuCollapsed ? 'py-3 px-0 justify-center h-11' : 'py-3 px-4'} rounded font-bold text-sm text-left flex items-center gap-3 transition-colors shadow-sm overflow-hidden`} title="Cadastrar Monitoramento">
                        <i className="fas fa-plus w-4 text-center"></i>
                        {!isLeftMenuCollapsed && "CADASTRAR MONITORAMENTO"}
                    </button>
                    <button className={`bg-[#1381b8] hover:bg-[#1070a0] text-white ${isLeftMenuCollapsed ? 'py-3 px-0 justify-center h-11' : 'py-3 px-4'} rounded font-bold text-sm text-left flex items-center gap-3 transition-colors shadow-sm overflow-hidden`} title="Agenda de Eventos">
                        <i className="far fa-calendar-alt w-4 text-center"></i>
                        {!isLeftMenuCollapsed && "AGENDA DE EVENTOS"}
                    </button>
                </aside>

                {/* RIGHT MAIN AREA */}
                <main className="flex-1 flex flex-col gap-8">
                    {currentView === 'HOME' && renderHome()}
                    {currentView === 'EDITAIS_LIST' && renderEditaisList()}
                    {currentView === 'EDITAL_PROJECTS' && renderEditalProjects()}
                    {currentView === 'PROJECT_DETAILS' && renderProjectDetails()}
                </main>
            </div>
            
            {/* FLOATING HELP BUTTON */}
            <div className="fixed bottom-6 right-6">
                <button className="bg-[#0f6b53] hover:bg-[#0c5945] text-white p-3 rounded-full flex items-center gap-2 font-bold shadow-lg transition-transform hover:scale-105">
                    <i className="fab fa-whatsapp text-2xl"></i>
                    Ajuda
                </button>
            </div>
            
        </div>
    );
};
