import React from 'react';
import { motion } from 'motion/react';
import { SavedReport, AppStage } from '../types';
import { getEditalSettings, updateReport } from '../services/storageService';
import { verifyIdAvailability } from '../utils/idValidator';

interface DashboardScreenProps {
  onUpdateReport?: (report: SavedReport) => void;
  selectedDashboardEdital: string | null;
  groupedReports: Record<string, SavedReport[]>;
  appSettings: { compactMode: boolean; [key: string]: any };
  setSelectedReport: (report: SavedReport) => void;
  handleSetStage: (stage: AppStage) => void;
  setReportToDelete: (report: SavedReport) => void;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  userRole?: 'admin' | 'analyst' | 'viewer';
  onLoadMore?: () => void;
  onNewAnalysis: (editalName?: string) => void;
  onViewContextText: (title: string, text: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  selectedDashboardEdital,
  groupedReports,
  appSettings,
  setSelectedReport,
  handleSetStage,
  setReportToDelete,
  setIsDeleteModalOpen,
  userRole,
  onLoadMore,
  onNewAnalysis,
  onViewContextText,
  onUpdateReport
}) => {
  const allReports = selectedDashboardEdital ? (groupedReports[selectedDashboardEdital] || []) : Object.values(groupedReports).flat();

  const [sortKey, setSortKey] = React.useState<'candidateName' | 'editalName' | 'timestamp' | 'status' | 'editalId' | 'propostaId' | 'default'>('default');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | 'default'>('default');
  const [currentSettings, setCurrentSettings] = React.useState<any>(null);
  
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editEditalId, setEditEditalId] = React.useState<string>('');
  const [editPropostaId, setEditPropostaId] = React.useState<string>('');

  const handleSaveIds = (report: SavedReport) => {
      if (onUpdateReport) {
          let finalPropostaId = editPropostaId;
          let finalEditalId = editEditalId;
          const globalAllReports = Object.values(groupedReports).flat() as SavedReport[];

          // Check for duplicate Proposta ID using our utility function
          if (finalPropostaId && finalPropostaId.trim() !== '') {
              const { isAvailable, nextSuggestedId } = verifyIdAvailability(
                  'proposta',
                  finalPropostaId,
                  report.id,
                  report.editalName,
                  globalAllReports
              );
              if (!isAvailable) {
                  if (window.confirm(`Este ID de Proposta (${finalPropostaId}) já está sendo usado por outro projeto. Deseja usar o próximo ID sequencial disponível (${nextSuggestedId})?`)) {
                      finalPropostaId = nextSuggestedId;
                  } else {
                      return;
                  }
              }
          }

          // Check for duplicate Edital ID using our utility function
          if (finalEditalId && finalEditalId.trim() !== '') {
              const { isAvailable, nextSuggestedId } = verifyIdAvailability(
                  'edital',
                  finalEditalId,
                  report.id,
                  report.editalName,
                  globalAllReports
              );
              if (!isAvailable) {
                  if (window.confirm(`Este ID de Edital (${finalEditalId}) já está sendo usado por outro edital. Deseja usar o próximo ID sequencial disponível (${nextSuggestedId})?`)) {
                      finalEditalId = nextSuggestedId;
                  } else {
                      return;
                  }
              }
          }

          // If the edital ID changed, update all reports for this edital
          if (finalEditalId !== report.editalId) {
              updateEditalIdCache(report.editalName, finalEditalId);
              const reportsInEdital = globalAllReports.filter(r => r.editalName === report.editalName);
              reportsInEdital.forEach(r => {
                  if (r.id === report.id) {
                      onUpdateReport({ ...r, editalId: finalEditalId, propostaId: finalPropostaId });
                  } else {
                      onUpdateReport({ ...r, editalId: finalEditalId });
                  }
              });
          } else {
              onUpdateReport({
                  ...report,
                  editalId: finalEditalId,
                  propostaId: finalPropostaId
              });
          }
      }
      setEditingId(null);
  };
  


  React.useEffect(() => {
      let isMounted = true;
      if (selectedDashboardEdital) {
          getEditalSettings(selectedDashboardEdital).then(settings => {
              if (isMounted) setCurrentSettings(settings);
          });
      } else {
          setCurrentSettings(null);
      }
      return () => { isMounted = false; };
  }, [selectedDashboardEdital]);

  const handleSortClick = (field: 'candidateName' | 'editalName' | 'timestamp' | 'status' | 'editalId' | 'propostaId') => {
    if (sortKey === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortKey('default');
        setSortOrder('default');
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortKey(field);
      setSortOrder('asc');
    }
  };

  const sortedReports = React.useMemo(() => {
    const list = [...allReports];
    
    if (sortKey === 'default' || sortOrder === 'default') {
      return list.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    return list.sort((a, b) => {
      if (sortKey === 'candidateName') {
        const valA = a.candidateName || '';
        const valB = b.candidateName || '';
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB, 'pt', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt', { sensitivity: 'base' });
      }
      
      if (sortKey === 'editalName') {
        const valA = a.editalName || '';
        const valB = b.editalName || '';
        return sortOrder === 'asc'
          ? valA.localeCompare(valB, 'pt', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt', { sensitivity: 'base' });
      }
      
      if (sortKey === 'timestamp') {
        return sortOrder === 'asc'
          ? a.timestamp - b.timestamp
          : b.timestamp - a.timestamp;
      }
      
      if (sortKey === 'status') {
        const statusA = a.manualStatus || a.overallStatus || '';
        const statusB = b.manualStatus || b.overallStatus || '';
        return sortOrder === 'asc'
          ? statusA.localeCompare(statusB, 'pt', { sensitivity: 'base' })
          : statusB.localeCompare(statusA, 'pt', { sensitivity: 'base' });
      }
      
      if (sortKey === 'editalId') {
        const valA = a.editalId || '';
        const valB = b.editalId || '';
        return sortOrder === 'asc'
          ? valA.localeCompare(valB, 'pt', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt', { sensitivity: 'base' });
      }

      if (sortKey === 'propostaId') {
        const valA = a.propostaId || '';
        const valB = b.propostaId || '';
        return sortOrder === 'asc'
          ? valA.localeCompare(valB, 'pt', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt', { sensitivity: 'base' });
      }
      
      return 0;
    });
  }, [allReports, sortKey, sortOrder]);

  const renderSortIcon = (field: 'candidateName' | 'editalName' | 'timestamp' | 'status' | 'editalId' | 'propostaId') => {
    if (sortKey === field) {
      if (sortOrder === 'asc') {
        return <i className="fas fa-sort-up ml-1.5 text-prosas-blue"></i>;
      } else if (sortOrder === 'desc') {
        return <i className="fas fa-sort-down ml-1.5 text-prosas-blue"></i>;
      }
    }
    return <i className="fas fa-sort ml-1.5 text-gray-300 dark:text-gray-600 opacity-40 group-hover:opacity-100 transition-opacity"></i>;
  };

  return (
    <motion.div
        key="dashboard"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="max-w-6xl mx-auto"
    >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {selectedDashboardEdital ? `Visão Geral: ${selectedDashboardEdital}` : 'Visão Geral das Análises'}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3">
                {selectedDashboardEdital ? (
                    <>
                        <button
                            onClick={() => onNewAnalysis(selectedDashboardEdital)}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded shadow-sm text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-plus-circle"></i> Nova análise deste edital
                        </button>
                        <button
                            onClick={() => {
                                if (currentSettings?.context.regulationText) {
                                    onViewContextText(`Regulamento - ${selectedDashboardEdital}`, currentSettings.context.regulationText);
                                } else {
                                    onNewAnalysis(selectedDashboardEdital);
                                }
                            }}
                            className={`px-4 py-2 border rounded shadow-sm text-sm font-bold transition-colors flex items-center gap-2 ${
                                currentSettings?.context.regulationText 
                                ? "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-prosas-blue dark:hover:text-blue-400" 
                                : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            title={currentSettings?.context.regulationText ? "Ver regulamento" : "Regulamento não configurado. Clique para adicionar."}
                        >
                            <i className="fas fa-file-alt"></i> Regulamento
                        </button>
                        <button
                            onClick={() => {
                                if (currentSettings?.context.formTemplateText) {
                                    onViewContextText(`Formulário - ${selectedDashboardEdital}`, currentSettings.context.formTemplateText);
                                } else {
                                    onNewAnalysis(selectedDashboardEdital);
                                }
                            }}
                            className={`px-4 py-2 border rounded shadow-sm text-sm font-bold transition-colors flex items-center gap-2 ${
                                currentSettings?.context.formTemplateText 
                                ? "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-prosas-blue dark:hover:text-blue-400" 
                                : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            title={currentSettings?.context.formTemplateText ? "Ver formulário" : "Formulário não configurado. Clique para adicionar."}
                        >
                            <i className="fas fa-file-alt"></i> Formulário
                        </button>
                    </>
                ) : (
                    <>
                    <button
                        onClick={() => onNewAnalysis()}
                        className="px-4 py-2 bg-prosas-blue text-white rounded shadow text-sm font-bold hover:bg-prosas-blueDark transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Nova Análise
                    </button>

                    </>
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total de Projetos</span>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                    {allReports.length}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Editais Ativos</span>
                <div className="text-3xl font-bold text-prosas-blue mt-2">
                    {selectedDashboardEdital ? 1 : Object.keys(groupedReports).length}
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Taxa de Aprovação</span>
                <div className="text-3xl font-bold text-green-600 mt-2">
                    {(() => {
                        if (!allReports.length) return '0%';
                        const approved = allReports.filter(r => (r.manualStatus || r.overallStatus) === 'APROVADO').length;
                        return Math.round((approved / allReports.length) * 100) + '%';
                    })()}
                </div>
            </div>
        </div>

        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Análises Recentes</h2>
        <div className="bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 transition-colors duration-200">
                    <tr>
                        <th 
                            className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200`}
                            onClick={() => handleSortClick('candidateName')}
                        >
                            <div className="flex items-center gap-1">
                                <span>Organização</span>
                                {renderSortIcon('candidateName')}
                            </div>
                        </th>
                        <th 
                            className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200`}
                            onClick={() => handleSortClick('editalName')}
                        >
                            <div className="flex items-center gap-1">
                                <span>Edital</span>
                                {renderSortIcon('editalName')}
                            </div>
                        </th>
                        <th 
                            className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200`}
                            onClick={() => handleSortClick('timestamp')}
                        >
                            <div className="flex items-center gap-1">
                                <span>Data</span>
                                {renderSortIcon('timestamp')}
                            </div>
                        </th>
                        <th 
                            className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200 text-gray-500 dark:text-gray-400`}
                            onClick={() => handleSortClick('editalId')}
                        >
                            <div className="flex items-center gap-1">
                                <span>ID Edital</span>
                                {renderSortIcon('editalId')}
                            </div>
                        </th>
                        <th 
                            className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200 text-gray-500 dark:text-gray-400`}
                            onClick={() => handleSortClick('propostaId')}
                        >
                            <div className="flex items-center gap-1">
                                <span>ID Proposta</span>
                                {renderSortIcon('propostaId')}
                            </div>
                        </th>
                        <th 
                            className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200`}
                            onClick={() => handleSortClick('status')}
                        >
                            <div className="flex items-center gap-1">
                                <span>Status</span>
                                {renderSortIcon('status')}
                            </div>
                        </th>
                        <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sortedReports.map(report => (
                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => { setSelectedReport(report); handleSetStage(AppStage.REPORT_VIEW); }}>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} font-medium text-gray-800 dark:text-gray-100`}>{report.candidateName}</td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400`}>{report.editalName}</td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>{new Date(report.timestamp).toLocaleDateString()}</td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400`} onClick={(e) => e.stopPropagation()}>
                                {editingId === report.id ? (
                                    <input 
                                        type="text" 
                                        value={editEditalId} 
                                        onChange={e => setEditEditalId(e.target.value)} 
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" 
                                        placeholder="ID Edital" 
                                    />
                                ) : (
                                    report.editalId || '-'
                                )}
                            </td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400`} onClick={(e) => e.stopPropagation()}>
                                {editingId === report.id ? (
                                    <input 
                                        type="text" 
                                        value={editPropostaId} 
                                        onChange={e => setEditPropostaId(e.target.value)} 
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" 
                                        placeholder="ID Proposta" 
                                    />
                                ) : (
                                    report.propostaId || '-'
                                )}
                            </td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    (report.manualStatus || report.overallStatus) === 'APROVADO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                    (report.manualStatus || report.overallStatus) === 'REPROVADO' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                                    (report.manualStatus || report.overallStatus) === 'APROVADO COM RESSALVAS' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        (report.manualStatus || report.overallStatus) === 'APROVADO' ? 'bg-green-500' :
                                        (report.manualStatus || report.overallStatus) === 'REPROVADO' ? 'bg-red-500' : 
                                        (report.manualStatus || report.overallStatus) === 'APROVADO COM RESSALVAS' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}></span>
                                    {report.manualStatus || report.overallStatus}
                                </span>
                            </td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-right space-x-3`}>
                                {userRole !== 'viewer' && (
                                    <>
                                        {editingId === report.id ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveIds(report);
                                                }}
                                                className="text-green-500 hover:text-green-600 transition-colors mr-2"
                                                title="Salvar IDs"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditEditalId(report.editalId || '');
                                                    setEditPropostaId(report.propostaId || '');
                                                    setEditingId(report.id);
                                                }}
                                                className="text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors mr-2"
                                                title="Editar IDs"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReportToDelete(report);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                                            title="Excluir Análise"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </>
                                )}
                                <i className="fas fa-chevron-right text-gray-300"></i>
                            </td>
                        </tr>
                    ))}
                    {allReports.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                Nenhuma análise encontrada.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            {onLoadMore && allReports.length > 0 && allReports.length % 50 === 0 && (
                <div className="flex justify-center p-4 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={onLoadMore}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-prosas-blue dark:hover:border-prosas-blue text-sm font-bold text-gray-600 dark:text-gray-300 py-2 px-6 rounded shadow-sm hover:shadow transition-all"
                    >
                        Carregar Mais Resultados
                    </button>
                </div>
            )}
        </div>
    </motion.div>
  );
};
