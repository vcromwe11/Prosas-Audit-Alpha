import React, { useState, useEffect, useMemo } from 'react';
import { CandidateAnalysis, SavedReport } from '../types';

interface Props {
  project: CandidateAnalysis;
  index: number;
  criteriaText: string;
  hasAuthRules: boolean;
  onDelete: () => void;
  onTrigger: () => void;
  onTriggerWithAuth: () => void;
  onCancel: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRepoSelect?: () => void;
  onReset: () => void;
  onViewReport: (report: SavedReport) => void;
}

const ProjectCard: React.FC<Props> = ({ 
    project, 
    index, 
    criteriaText,
    hasAuthRules,
    onDelete,
    onTrigger,
    onTriggerWithAuth,
    onCancel,
    onFileSelect,
    onRepoSelect,
    onReset,
    onViewReport
}) => {
  // Extrai os critérios para visualização (apenas os títulos)
  const criteriaList = useMemo(() => {
      const regex = /^\d+\.\s+(.+?)(?::|\n|$)/gm;
      const matches = [];
      let match;
      while ((match = regex.exec(criteriaText)) !== null) {
          matches.push(match[1].trim());
      }
      return matches.length > 0 ? matches : ["Análise Geral", "Documentação", "Regras", "Conclusão"];
  }, [criteriaText]);

  // Estado da Simulação
  const [activeCriterionIndex, setActiveCriterionIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);

  useEffect(() => {
      let stageInterval: any;
      let progressInterval: any;
      
      if (project.status === 'analyzing') {
          setActiveCriterionIndex(0);
          setStageProgress(0);
          
          // Avança a etapa a cada 4 segundos
          stageInterval = setInterval(() => {
              setActiveCriterionIndex(prev => {
                  if (prev < criteriaList.length - 1) {
                      setStageProgress(0); // Reset progress for new stage
                      return prev + 1;
                  }
                  return prev;
              });
          }, 4000);

          // Anima a barra de progresso da etapa atual
          progressInterval = setInterval(() => {
              setStageProgress(prev => {
                  if (prev >= 95) return 95; // Segura no 95% até a próxima etapa
                  return prev + 5;
              });
          }, 200); // 5% a cada 200ms = 100% em 4 segundos

      } else {
          // Se acabou (erro ou sucesso), para a simulação
          clearInterval(stageInterval);
          clearInterval(progressInterval);
      }
      return () => {
          clearInterval(stageInterval);
          clearInterval(progressInterval);
      };
  }, [project.status, criteriaList.length]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border flex flex-col h-full overflow-hidden relative transition-all duration-300 hover:shadow-lg ${
        project.status === 'error' ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-700'
    }`}>
        
        {/* Card Header */}
        <div className={`p-4 border-b flex justify-between items-start ${
            project.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    project.status === 'error' ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                    {project.status === 'error' ? '!' : index + 1}
                </div>
                <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded mb-1 inline-block uppercase tracking-wider ${
                            project.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                            project.status === 'analyzing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 
                            project.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                            {project.status === 'completed' ? 'FINALIZADO' : 
                            project.status === 'analyzing' ? 'EM ANÁLISE' : 
                            project.status === 'error' ? 'FALHA' : 'PENDENTE'}
                        </span>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate w-48" title={project.candidateName || "Novo Candidato"}>
                            {project.candidateName || "Novo Candidato"}
                        </h3>
                </div>
            </div>
            <button onClick={onDelete} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90 p-1" title="Remover Slot">
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
        
        {/* Card Body */}
        <div className="p-6 flex-grow flex flex-col items-center justify-center relative w-full">
            
            {/* PENDING */}
            {project.status === 'pending' && (
                <div className="text-center w-full animate-fade-in">
                    {project.files && project.files.length > 0 ? (
                        <div>
                            <div className="mb-6">
                                <i className="fas fa-file-pdf text-4xl text-red-500 mb-2"></i>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{project.files.length} arquivo(s)</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-[200px] mx-auto">{project.files[0].name}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={onTrigger}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                                    title="Inicia a verificação de conformidade do projeto com o edital"
                                >
                                    <i className="fas fa-play"></i> Iniciar Análise Padrão
                                </button>
                                {hasAuthRules && (
                                    <button 
                                        onClick={onTriggerWithAuth}
                                        className="w-full bg-prosas-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                                        title="Usa os módulos configurados para análise"
                                    >
                                        <i className="fas fa-bolt"></i> Análise Otimizada/Validada
                                    </button>
                                )}
                            </div>
                            <button onClick={onReset} className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline transition-all active:scale-95">
                                Trocar arquivos
                            </button>
                        </div>
                    ) : (
                        <div>
                            <i className="fas fa-cloud-upload-alt text-gray-300 dark:text-gray-600 text-4xl mb-3"></i>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Proposta (PDFs ou ZIP)</p>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-prosas-blue dark:hover:border-prosas-blue text-gray-600 dark:text-gray-300 font-bold py-2 px-4 rounded transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 text-sm w-full" title="Carregar os arquivos do projeto enviados pelo candidato">
                                    <input type="file" accept="application/pdf,.zip" multiple onChange={onFileSelect} className="hidden" />
                                    <i className="fas fa-upload"></i> Upload
                                </label>
                                {onRepoSelect && (
                                    <button onClick={onRepoSelect} className="bg-blue-50 dark:bg-blue-900/20 text-prosas-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm font-bold py-2 px-4 rounded transition-all active:scale-[0.98] w-full flex items-center justify-center gap-2 border border-transparent">
                                        <i className="fas fa-folder-open"></i> Repositório
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ANALYZING (Barra de Progresso HONESTA) */}
            {project.status === 'analyzing' && (
                <div className="w-full text-left animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        {project.analysisPhase === 'WAITING' || !project.analysisPhase ? (
                            <span className="text-xs font-bold text-gray-500 animate-pulse">
                                <i className="fas fa-spinner fa-spin mr-1"></i> Preparando...
                            </span>
                        ) : project.analysisPhase === 'AUTH' ? (
                            <span className="text-xs font-bold text-yellow-600 animate-pulse">
                                <i className="fas fa-file-signature mr-1"></i> Executando Scripts de Autenticação...
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-prosas-blue animate-pulse">
                                <i className="fas fa-microchip mr-1"></i> Análise de IA em Andamento...
                            </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                             {project.analysisPhase === 'AUTH' && project.currentAuthTask ? project.currentAuthTask : 'Processando...'}
                        </span>
                    </div>

                    {/* Barra de progresso dinâmica */}
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div 
                            className={`${project.analysisPhase === 'AUTH' ? 'bg-yellow-500' : 'bg-prosas-blue'} h-1.5 rounded-full transition-all duration-200 ease-out relative overflow-hidden`}
                            style={{ width: `${stageProgress}%` }}
                        >
                             <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Lista de verificação NEUTRA (sem check verde falso) */}
                    {(!project.partialStream && project.analysisPhase !== 'AI_PROMPT') && (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {criteriaList.map((criterion, idx) => (
                            <div key={idx} className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                                idx === activeCriterionIndex ? 'text-prosas-blue font-bold' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                                {/* Ícone muda de bolinha para spinner, mas NUNCA para check verde enquanto carrega */}
                                <i className={`fas ${
                                    idx === activeCriterionIndex ? 'fa-circle-notch fa-spin' : 'fa-circle'
                                } text-[8px]`}></i>
                                <span className="truncate">{criterion}</span>
                            </div>
                        ))}
                    </div>
                    )}
                    
                    {project.partialStream && (
                        <div className="mt-2 h-32 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 font-mono text-[10px] text-gray-600 dark:text-gray-400 opacity-80 flex flex-col justify-end">
                            <span className="whitespace-pre-wrap">{project.partialStream.slice(-500)}</span>
                            <span className="animate-pulse font-bold">_</span>
                        </div>
                    )}

                    <div className="mt-4 text-[10px] text-gray-400 dark:text-gray-500 text-center italic border-t border-gray-100 dark:border-gray-700 pt-2">
                        Aguarde, a IA está analisando o conteúdo real...
                    </div>
                    <button 
                        onClick={onCancel}
                        className="mt-4 w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2 px-4 rounded shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-xs border border-red-100 dark:border-red-900/30"
                    >
                        <i className="fas fa-times"></i> Cancelar Análise
                    </button>
                </div>
            )}

            {/* COMPLETED (Resultado REAL) */}
            {project.status === 'completed' && project.result && (
                <div className="text-center w-full animate-fade-in flex flex-col h-full">
                    <div className="mb-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-2 ${
                            project.result.overallStatus === 'APROVADO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                            project.result.overallStatus === 'REPROVADO' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                            <i className={`fas ${project.result.overallStatus === 'APROVADO' ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                            {project.result.overallStatus}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 px-2" title={project.result.summary}>{project.result.summary}</p>
                    </div>

                    {/* Mini Checklist REAL (Resultados da IA) */}
                    <div className="flex-grow bg-gray-50 dark:bg-gray-800/50 rounded p-2 text-left overflow-y-auto custom-scrollbar max-h-40 mb-3 border border-gray-100 dark:border-gray-700">
                         {project.result.points.map((point, idx) => (
                             <div key={idx} className="flex items-start gap-2 mb-1.5 last:mb-0">
                                 <div className="mt-0.5">
                                     {point.status === 'OK' && <i className="fas fa-check text-green-500 dark:text-green-400 text-[10px]"></i>}
                                     {point.status === 'ERROR' && <i className="fas fa-times text-red-500 dark:text-red-400 text-[10px]"></i>}
                                     {point.status === 'WARNING' && <i className="fas fa-exclamation text-yellow-500 dark:text-yellow-400 text-[10px]"></i>}
                                 </div>
                                 <div className="text-[10px] leading-tight">
                                     <span className={`font-bold ${point.status === 'ERROR' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{point.title}</span>
                                     {point.status !== 'OK' && (
                                         <p className="text-gray-500 dark:text-gray-400 mt-0.5">{point.justification}</p>
                                     )}
                                 </div>
                             </div>
                         ))}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full mt-auto">
                        <button 
                            onClick={() => onViewReport({
                                id: project.id,
                                editalName: "Edital", 
                                candidateName: project.candidateName,
                                cnpj: project.result!.organizationData.cnpj,
                                timestamp: Date.now(),
                                result: project.result!
                            })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-prosas-blue dark:hover:border-prosas-blue hover:text-prosas-blue dark:hover:text-prosas-blue text-gray-600 dark:text-gray-300 font-bold py-2 rounded text-xs transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md"
                            title="Abre a visualização detalhada para auditar o parecer e emitir uma nota manual"
                        >
                            Ver Relatório Completo
                        </button>
                        <button 
                            onClick={onTrigger}
                            className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold py-2 rounded text-xs transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            title="Roda a análise com IA do zero, descartando o resultado atual"
                        >
                            <i className="fas fa-redo"></i> Refazer Análise
                        </button>
                    </div>
                </div>
            )}

            {/* ERROR */}
            {project.status === 'error' && (
                <div className="text-center text-red-600 dark:text-red-400 p-2 animate-pulse">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-server text-3xl"></i>
                    </div>
                    <p className="text-sm font-bold mb-1">Interrupção na Análise</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mb-4 px-2">{project.error}</p>
                    <button 
                        onClick={onTrigger}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                    >
                        <i className="fas fa-sync-alt mr-1"></i> Tentar Novamente
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProjectCard;