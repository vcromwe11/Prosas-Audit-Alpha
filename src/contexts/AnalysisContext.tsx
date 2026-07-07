import React, { createContext, useContext, useState, useRef } from 'react';
import { AuditContext, CandidateAnalysis, SavedReport, AppStage } from '../types';

export const DEFAULT_DOCUMENT_CRITERIA = `
1. IDENTIFICAÇÃO DO PROJETO E DO PROPONENTE:
   - Nome do projeto e proponente.
   - CNPJ da organização na base de dados e no cartão CNPJ.

2. CONFORMIDADE COM REGULAMENTO:
   - Os objetivos do projeto estão alinhados com as diretrizes do regulamento?
   - O orçamento solicitado está dentro do limite estipulado no edital?
   - O prazo de execução está adequado ao calendário do edital?
   - O projeto atende ao público-alvo prioritário (se houver)?

3. DOCUMENTAÇÃO INSTITUCIONAL (CHECHLIST):
   - Cartão CNPJ (ativo e data de emissão).
   - Estatuto Social atualizado.
   - Ata de eleição da diretoria vigente.
   - Comprovantes de regularidade (CNDs) - Opcional dependendo da fase.

4. ANÁLISE DE VEDAÇÕES (CRITÉRIOS DE DESCLASSIFICAÇÃO IMEDIATA):
   - O projeto possui viés político-partidário ou religioso?
   - Há inconsistência grave no orçamento (ex: 100% de taxa administrativa)?
   - Falta de algum documento obrigatório descrito no item 3?
`.trim();

interface AnalysisContextType {
  stage: AppStage;
  setStage: (stage: AppStage) => void;
  previousStage: AppStage;
  setPreviousStage: (stage: AppStage) => void;
  loadingContext: boolean;
  setLoadingContext: (loading: boolean) => void;
  isGeneratingCriteria: boolean;
  setIsGeneratingCriteria: (loading: boolean) => void;
  context: AuditContext;
  setContext: React.Dispatch<React.SetStateAction<AuditContext>>;
  candidates: CandidateAnalysis[];
  setCandidates: React.Dispatch<React.SetStateAction<CandidateAnalysis[]>>;
  allReports: SavedReport[];
  setAllReports: React.Dispatch<React.SetStateAction<SavedReport[]>>;
  groupedReports: Record<string, SavedReport[]>;
  setGroupedReports: React.Dispatch<React.SetStateAction<Record<string, SavedReport[]>>>;
  selectedReport: SavedReport | null;
  setSelectedReport: (report: SavedReport | null) => void;
  reportToDelete: SavedReport | null;
  setReportToDelete: (report: SavedReport | null) => void;
  isInitialReportsLoad: React.MutableRefObject<boolean>;
  handleSetStage: (newStage: AppStage) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stage, setStage] = useState<AppStage>(AppStage.LOGIN);
  const [previousStage, setPreviousStage] = useState<AppStage>(AppStage.DASHBOARD);
  
  const [loadingContext, setLoadingContext] = useState(false);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);
  const [context, setContext] = useState<AuditContext>({
    editalTitle: '',
    regulationText: '',
    formTemplateText: '',
    miscFilesText: '',
    criteriaText: DEFAULT_DOCUMENT_CRITERIA,
    referenceDate: '',
    authRules: [],
    isReady: false
  });
  
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
  
  const [allReports, setAllReports] = useState<SavedReport[]>([]);
  const [groupedReports, setGroupedReports] = useState<Record<string, SavedReport[]>>({});
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  
  const isInitialReportsLoad = useRef(true);

  const handleSetStage = (newStage: AppStage) => {
    setPreviousStage(stage);
    setStage(newStage);
  };

  return (
    <AnalysisContext.Provider value={{
      stage, setStage, previousStage, setPreviousStage,
      loadingContext, setLoadingContext,
      isGeneratingCriteria, setIsGeneratingCriteria,
      context, setContext,
      candidates, setCandidates,
      allReports, setAllReports,
      groupedReports, setGroupedReports,
      selectedReport, setSelectedReport,
      reportToDelete, setReportToDelete,
      isInitialReportsLoad,
      handleSetStage
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const ctx = useContext(AnalysisContext);
  if (ctx === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return ctx;
};
