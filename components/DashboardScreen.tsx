import React from 'react';
import { motion } from 'motion/react';
import { SavedReport, AppStage } from '../types';

interface DashboardScreenProps {
  selectedDashboardEdital: string | null;
  groupedReports: Record<string, SavedReport[]>;
  appSettings: { compactMode: boolean; [key: string]: any };
  setSelectedReport: (report: SavedReport) => void;
  handleSetStage: (stage: AppStage) => void;
  setReportToDelete: (report: SavedReport) => void;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  userRole?: 'admin' | 'analyst' | 'viewer';
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  selectedDashboardEdital,
  groupedReports,
  appSettings,
  setSelectedReport,
  handleSetStage,
  setReportToDelete,
  setIsDeleteModalOpen,
  userRole
}) => {
  const allReports = selectedDashboardEdital ? (groupedReports[selectedDashboardEdital] || []) : Object.values(groupedReports).flat();

  return (
    <motion.div
        key="dashboard"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="max-w-6xl mx-auto"
    >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            {selectedDashboardEdital ? `Visão Geral: ${selectedDashboardEdital}` : 'Visão Geral das Análises'}
        </h1>
        
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
                        const approved = allReports.filter(r => (r.manualStatus || r.result.overallStatus) === 'APROVADO').length;
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
                        <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Organização</th>
                        <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Edital</th>
                        <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Data</th>
                        <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Status</th>
                        <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {allReports.sort((a,b) => b.timestamp - a.timestamp).map(report => (
                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => { setSelectedReport(report); handleSetStage(AppStage.REPORT_VIEW); }}>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} font-medium text-gray-800 dark:text-gray-100`}>{report.candidateName}</td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400`}>{report.editalName}</td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>{new Date(report.timestamp).toLocaleDateString()}</td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    (report.manualStatus || report.result.overallStatus) === 'APROVADO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                    (report.manualStatus || report.result.overallStatus) === 'REPROVADO' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                                    (report.manualStatus || report.result.overallStatus) === 'APROVADO COM RESSALVAS' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        (report.manualStatus || report.result.overallStatus) === 'APROVADO' ? 'bg-green-500' :
                                        (report.manualStatus || report.result.overallStatus) === 'REPROVADO' ? 'bg-red-500' : 
                                        (report.manualStatus || report.result.overallStatus) === 'APROVADO COM RESSALVAS' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}></span>
                                    {report.manualStatus || report.result.overallStatus}
                                </span>
                            </td>
                            <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-right space-x-3`}>
                                {userRole !== 'viewer' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReportToDelete(report);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                    title="Excluir Análise"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                                )}
                                <i className="fas fa-chevron-right text-gray-300"></i>
                            </td>
                        </tr>
                    ))}
                    {allReports.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                Nenhuma análise encontrada.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </motion.div>
  );
};
