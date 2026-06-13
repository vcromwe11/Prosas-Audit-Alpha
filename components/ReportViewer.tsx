
import React, { useState, useEffect } from 'react';
import { SavedReport, AnalysisPoint } from '../types';
import html2pdf from 'html2pdf.js';
import { getPrompt } from '../services/storageService';

export interface Props {
  report: SavedReport;
  onBack: () => void;
  onGoToDashboard: () => void;
  onUpdateReport?: (updatedReport: SavedReport) => void;
  userRole?: 'admin' | 'analyst' | 'viewer';
  userName?: string;
  isDemoMode?: boolean;
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'OK') return <i className="fas fa-check-circle text-green-500 text-xl"></i>;
  if (status === 'ERROR') return <i className="fas fa-times-circle text-red-500 text-xl"></i>;
  return <i className="fas fa-exclamation-circle text-yellow-500 text-xl"></i>;
};

const AccordionItem: React.FC<{ point: AnalysisPoint, forceOpen?: boolean }> = ({ point, forceOpen }) => {
  // Always open on print
  const [isOpen, setIsOpen] = useState(false);
  const effectivelyOpen = isOpen || forceOpen;

  return (
    <div className="border-b border-gray-100 last:border-0 break-inside-avoid">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${effectivelyOpen ? 'bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={point.status} />
          <div>
            <div className="text-sm font-medium text-gray-700">{point.title}</div>
            {/* Show Source Document in Header if closed */}
            {!effectivelyOpen && point.sourceDocument && (
               <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                   <i className="fas fa-file-pdf"></i> {point.sourceDocument}
               </div>
            )}
          </div>
        </div>
        <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${effectivelyOpen ? 'rotate-180' : ''} print:hidden`}></i>
      </div>
      
      {/* Logic: If open OR if printing, show content */}
      <div className={`p-4 pl-11 bg-gray-50 text-sm animate-fade-in ${effectivelyOpen ? 'block' : 'hidden'} print:block print:bg-white`}>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Justificativa</span>
                   <p className="text-gray-800 leading-relaxed">{point.justification}</p>
               </div>
               
               <div>
                   {point.sourceDocument && (
                       <div className="mb-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Fonte do Dado</span>
                           <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-blue-600 font-medium">
                               <i className="fas fa-file-pdf"></i> {point.sourceDocument}
                           </span>
                       </div>
                   )}
               </div>
           </div>

           {point.evidence && (
             <div className="bg-white p-3 rounded border-l-4 border-l-prosas-blue border-y border-r border-gray-200 mt-3 print:border-gray-300 shadow-sm">
                <span className="text-[10px] font-bold text-prosas-blue uppercase flex items-center gap-1 mb-1">
                  <i className="fas fa-quote-left"></i> Evidência Extraída (Verbatim)
                </span>
                <p className="font-mono text-gray-600 text-xs italic whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    "{point.evidence}"
                </p>
             </div>
           )}
      </div>
    </div>
  );
};

const ReportViewer: React.FC<Props> = ({ report, onBack, onGoToDashboard, onUpdateReport, userRole, userName, isDemoMode }) => {
  const { result } = report;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isManualEvalOpen, setIsManualEvalOpen] = useState(false);
  
  const [isEditingEval, setIsEditingEval] = useState(!report.manualStatus && !report.userNotes);
  const [draftStatus, setDraftStatus] = useState(report.manualStatus || '');
  const [draftNotes, setDraftNotes] = useState(report.userNotes || '');
  const [promptText, setPromptText] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  if (!result || typeof result !== 'object' || !result.organizationData) {
    return (
      <div className="p-8 text-center text-red-500 bg-white rounded-lg shadow-sm border border-red-200 max-w-2xl mx-auto mt-10">
        <i className="fas fa-exclamation-triangle text-4xl mb-4 text-red-400"></i>
        <h2 className="text-xl font-bold text-gray-800">Relatório Corrompido ou Incompleto</h2>
        <p className="mt-2 text-gray-600 text-sm">Houve um erro ao processar ou salvar esta análise (possivelmente devido a uma falha na IA ou timeout). Os dados esperados não estão presentes.</p>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={onBack} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 transition-colors">
            <i className="fas fa-arrow-left mr-2"></i> Voltar
          </button>
          {onGoToDashboard && (
            <button onClick={onGoToDashboard} className="px-4 py-2 bg-prosas-blue text-white font-bold rounded hover:bg-prosas-blueDark transition-colors">
              Ir para Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    setDraftStatus(report.manualStatus || '');
    setDraftNotes(report.userNotes || '');
    setIsEditingEval((!report.manualStatus && !report.userNotes) && userRole !== 'viewer');
  }, [report.id, report.manualStatus, report.userNotes, userRole]);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (report.promptId) {
        setIsLoadingPrompt(true);
        const prompt = await getPrompt(report.promptId);
        if (prompt) {
          setPromptText(prompt.text);
        } else {
          setPromptText(null);
        }
        setIsLoadingPrompt(false);
      } else {
        setPromptText(null);
      }
    };
    fetchPrompt();
  }, [report.promptId]);

  const handleSaveEval = () => {
    if (onUpdateReport) {
      onUpdateReport({
        ...report,
        manualStatus: draftStatus as any,
        userNotes: draftNotes,
        evaluatedBy: userName || 'Usuário Desconhecido',
        evaluatedAt: Date.now()
      });
      setIsEditingEval(false);
    }
  };

  const handleDeleteEval = () => {
    if (onUpdateReport) {
      onUpdateReport({
        ...report,
        manualStatus: null as any,
        userNotes: null as any,
        evaluatedBy: null as any,
        evaluatedAt: null as any
      });
      setDraftStatus('');
      setDraftNotes('');
      setIsEditingEval(true);
    }
  };

  const handlePrint = () => {
    setIsGeneratingPdf(true);
    
    setTimeout(() => {
      const element = document.getElementById('report-content');
      if (!element) {
        setIsGeneratingPdf(false);
        return;
      }
      
      const opt = {
        margin:       10,
        filename:     `Relatorio_${report.candidateName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPdf(false);
      }).catch((err: any) => {
        console.error("PDF generation error:", err);
        setIsGeneratingPdf(false);
      });
    }, 500);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `report_${report.candidateName.replace(/\s+/g, '_')}_${report.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div id="report-content" className={`animate-fade-in mx-auto pb-10 print:pb-0 print:max-w-none print:w-full ${isDemoMode ? 'w-full' : 'max-w-5xl'}`}>
      {!isDemoMode && (
        <>
          {/* Header Actions */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden" data-html2canvas-ignore>
            <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded text-xs font-bold hover:bg-yellow-600 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                    <i className="fas fa-sync-alt"></i> Refazer Análise
                </button>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={handleExportJSON}
                 className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 shadow-sm hover:shadow transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
               >
                 <i className="fas fa-file-code"></i> JSON
               </button>
               <button 
                 onClick={handlePrint}
                 disabled={isGeneratingPdf}
                 className="px-4 py-2 bg-prosas-blue text-white rounded text-xs font-bold hover:bg-prosas-blueDark flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
               >
                 {isGeneratingPdf ? (
                   <><i className="fas fa-spinner fa-spin"></i> Preparando PDF...</>
                 ) : (
                   <><i className="fas fa-print"></i> Imprimir / PDF</>
                 )}
               </button>
            </div>
          </div>

          {/* Main Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:shadow-none print:border-none print:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl print:border print:border-gray-300">
                  <i className="fas fa-building"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{result.candidateName}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>{result.organizationData.cnpj}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{report.editalName}</span>
                  </div>
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
                 (report.manualStatus || result.overallStatus) === 'APROVADO' ? 'bg-green-50 border-green-200 text-green-700' :
                 (report.manualStatus || result.overallStatus) === 'REPROVADO' ? 'bg-red-50 border-red-200 text-red-700' : 
                 (report.manualStatus || result.overallStatus) === 'APROVADO COM RESSALVAS' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-blue-50 border-blue-200 text-blue-700'
              } print:bg-white print:border-black print:text-black`}>
                 <i className={`fas ${
                     (report.manualStatus || result.overallStatus) === 'APROVADO' ? 'fa-check' : 
                     (report.manualStatus || result.overallStatus) === 'REPROVADO' ? 'fa-times' : 
                     (report.manualStatus || result.overallStatus) === 'APROVADO COM RESSALVAS' ? 'fa-exclamation-triangle' : 'fa-clock'
                 }`}></i>
                 <span className="font-bold tracking-wide">{report.manualStatus || result.overallStatus}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-100 print:grid-cols-2 print:gap-4">
               <div>
                  <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Fundação</span>
                  <span className="text-gray-800 font-medium">{result.organizationData.foundationDate || '-'}</span>
               </div>
               <div>
                  <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Natureza Jurídica</span>
                  <span className="text-gray-800 font-medium">{result.organizationData.legalStatus}</span>
               </div>
               <div className="md:col-span-2">
                  <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Representante Legal</span>
                  <span className="text-gray-800 font-medium">{result.organizationData.representativeName || '-'}</span>
               </div>
            </div>

            {/* Summary Box */}
            <div className="mt-6 bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap print:bg-white print:border-gray-300">
               <span className="font-bold text-gray-900 block mb-1">Resumo da Análise:</span>
               {result.summary}
            </div>
          </div>
        </>
      )}

      {/* Manual Evaluation Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 print:shadow-none print:border-none print:p-0 overflow-hidden">
        <div 
          className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:hidden"
          onClick={() => setIsManualEvalOpen(!isManualEvalOpen)}
        >
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <i className="fas fa-edit text-prosas-blue"></i> Avaliação Manual (Parecer)
          </h3>
          <i className={`fas fa-chevron-${isManualEvalOpen ? 'up' : 'down'} text-gray-400`}></i>
        </div>
        
        {/* Print Header (Only visible on print) */}
        <h3 className="hidden print:block font-bold text-gray-800 mb-4 border-b border-gray-800 pb-2">Parecer do Avaliador</h3>

        {(isManualEvalOpen || true) && ( // We will use CSS to hide it when not open, but keep it in DOM for print
          <div className={`px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 print:border-none print:block ${isManualEvalOpen ? 'block' : 'hidden'}`}>
            {(isEditingEval && userRole !== 'viewer') ? (
              <div className="space-y-4 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-2">Sugestão de Parecer</label>
                    <select
                      value={draftStatus}
                      onChange={(e) => setDraftStatus(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block p-2.5 outline-none transition-colors"
                    >
                      <option value="">(Manter Status da IA)</option>
                      <option value="EM ANÁLISE">Em Análise</option>
                      <option value="APROVADO COM RESSALVAS">Aprovado com Ressalvas</option>
                      <option value="APROVADO">Aprovado</option>
                      <option value="REPROVADO">Reprovado</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-2">Justificativa / Anotações</label>
                    <textarea
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      placeholder="Insira suas observações e anotações sobre este projeto..."
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block p-2.5 min-h-[100px] resize-y outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {(!report.manualStatus && !report.userNotes) ? null : (
                    <button 
                      onClick={() => {
                        setDraftStatus(report.manualStatus || '');
                        setDraftNotes(report.userNotes || '');
                        setIsEditingEval(false);
                      }}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    onClick={handleSaveEval}
                    className="px-4 py-2 bg-prosas-blue text-white rounded text-xs font-bold hover:bg-prosas-blueDark shadow-sm transition-all transform active:scale-95 flex items-center gap-2"
                  >
                    <i className="fas fa-save"></i> Salvar Parecer
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded border border-gray-200 dark:border-gray-700 relative group">
                {userRole !== 'viewer' && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                  <button 
                    onClick={() => setIsEditingEval(true)}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-prosas-blue flex items-center justify-center shadow-sm transition-colors"
                    title="Editar Parecer"
                  >
                    <i className="fas fa-pen text-xs"></i>
                  </button>
                  <button 
                    onClick={handleDeleteEval}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-500 flex items-center justify-center shadow-sm transition-colors"
                    title="Excluir Parecer"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
                )}
                
                <div className="mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mr-2">Sugestão de Parecer:</span>
                  {report.manualStatus ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      report.manualStatus === 'APROVADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      report.manualStatus === 'REPROVADO' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      report.manualStatus === 'APROVADO COM RESSALVAS' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {report.manualStatus}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-800 dark:text-gray-200 italic">(Mantido status da IA)</span>
                  )}
                </div>
                
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block mb-1">Justificativa:</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {report.userNotes || <span className="italic text-gray-400">Nenhuma justificativa informada.</span>}
                  </p>
                </div>
                
                {report.evaluatedBy && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-prosas-blue flex items-center justify-center text-[10px] text-white font-bold">
                        {report.evaluatedBy.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Auditado por <strong>{report.evaluatedBy}</strong> em {report.evaluatedAt ? new Date(report.evaluatedAt).toLocaleString() : 'data desconhecida'}
                    </span>
                </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accordion List - Validations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-gray-800 print:px-0">
            <h3 className="font-bold text-gray-800">Validações de Documentos</h3>
            <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 print:border-gray-400">
               {result.points.length} itens verificados
            </span>
         </div>
         <div className="print:block">
            {result.points.map((point, idx) => (
              <AccordionItem key={idx} point={point} forceOpen={isGeneratingPdf} />
            ))}
         </div>
      </div>

      {/* Prompt Display */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-gray-800 print:px-0">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-terminal text-gray-500"></i> Prompt Utilizado na Análise
            </h3>
         </div>
         <div className="p-6">
            {isLoadingPrompt ? (
              <div className="text-sm text-gray-500 italic flex items-center gap-2">
                <i className="fas fa-spinner fa-spin"></i> Carregando prompt...
              </div>
            ) : promptText ? (
              <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono">
                {promptText}
              </pre>
            ) : (
              <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded border border-gray-200">
                A função de visualização do prompt não está disponível para esta análise ou o prompt não pôde ser recuperado.
              </div>
            )}
         </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400 print:mt-12 print:text-right">
        Relatório gerado automaticamente em {new Date(report.timestamp).toLocaleString()} • ID: {report.id}
      </div>
    </div>
  );
};

export default ReportViewer;
