import React from 'react';
import { motion } from 'motion/react';
import { SavedReport, AppStage } from '../types';

interface SearchScreenProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allReports: SavedReport[];
  appSettings: { compactMode: boolean; [key: string]: any };
  setSelectedReport: (report: SavedReport) => void;
  handleSetStage: (stage: AppStage) => void;
  setReportToDelete: (report: SavedReport) => void;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  searchQuery,
  setSearchQuery,
  allReports,
  appSettings,
  setSelectedReport,
  handleSetStage,
  setReportToDelete,
  setIsDeleteModalOpen,
}) => {
  return (
    <motion.div
        key="search"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="max-w-6xl mx-auto"
    >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Busca de Análises</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input 
                    type="text" 
                    placeholder="Buscar por nome do projeto, edital ou CNPJ..." 
                    className="w-full pl-10 pr-4 py-3 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-prosas-blue transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxLength={200}
                />
            </div>
        </div>

        {searchQuery.trim() !== '' && (
            <div className="bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        <tr>
                            <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Organização</th>
                            <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Edital</th>
                            <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>CNPJ</th>
                            <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}>Status</th>
                            <th className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'}`}></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {allReports.filter(report => {
                            const query = searchQuery.toLowerCase();
                            return report.candidateName.toLowerCase().includes(query) || 
                                   report.editalName.toLowerCase().includes(query) || 
                                   (report.cnpj && report.cnpj.toLowerCase().includes(query));
                        }).map(report => (
                            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => { setSelectedReport(report); handleSetStage(AppStage.REPORT_VIEW); }}>
                                <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} font-medium text-gray-800 dark:text-gray-100`}>{report.candidateName}</td>
                                <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400`}>{report.editalName}</td>
                                <td className={`px-6 ${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400`}>{report.cnpj || '-'}</td>
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
                                    <i className="fas fa-chevron-right text-gray-300"></i>
                                </td>
                            </tr>
                        ))}
                        {allReports.filter(report => {
                            const query = searchQuery.toLowerCase();
                            return report.candidateName.toLowerCase().includes(query) || 
                                   report.editalName.toLowerCase().includes(query) || 
                                   (report.result?.organizationData?.cnpj && report.result.organizationData.cnpj.toLowerCase().includes(query));
                        }).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                    Nenhum resultado encontrado para "{searchQuery}".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
        {searchQuery.trim() === '' && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                <p>Digite algo acima para buscar nas análises salvas.</p>
            </div>
        )}
    </motion.div>
  );
};
