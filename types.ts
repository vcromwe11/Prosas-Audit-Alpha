
export interface OrganizationData {
  cnpj: string;
  foundationDate: string; // DD/MM/AAAA
  legalStatus: 'SEM FINS LUCRATIVOS' | 'COM FINS LUCRATIVOS' | 'INCERTO';
  representativeName: string;
}

export interface AnalysisPoint {
  title: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  evidence: string;
  justification: string;
  sourceDocument?: string; // Novo campo para rastreabilidade
}

export interface AuditResult {
  candidateName: string;
  organizationData: OrganizationData;
  overallStatus: 'APROVADO' | 'REPROVADO' | 'RESSALVAS';
  summary: string;
  points: AnalysisPoint[];
}

export interface CandidateAnalysis {
  slotId: number;
  id: string;
  candidateName: string;
  files: File[];
  rawText: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  result?: AuditResult;
  error?: string;
}

export interface DocumentAuthRule {
  id: string;
  questionPrefix: string; // Novo campo para o prefixo da questão (ex: "1.1")
  documentType: string;
  dataToScrape: string;
  formatRegex: string;
  validationRule: string;
  approvalTrigger: string;
  rejectionTrigger: string;
}

export interface AuditContext {
  editalTitle: string;
  regulationText: string;
  formTemplateText: string;
  miscFilesText: string;
  criteriaText: string; 
  referenceDate: string; // Data do edital/prazo de inscrição
  authRules: DocumentAuthRule[];
  isReady: boolean;
}

export enum AppStage {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  ANALYSIS_SETUP = 'ANALYSIS_SETUP',
  ANALYSIS_RUN = 'ANALYSIS_RUN',
  REPORT_VIEW = 'REPORT_VIEW',
  SETTINGS = 'SETTINGS',
  SEARCH = 'SEARCH'
}

export interface PdfPage {
  pageNumber: number;
  text: string;
  fileName?: string;
}

// Persistence Types
export interface SavedReport {
  id: string;
  editalName: string;
  candidateName: string;
  cnpj: string;
  timestamp: number;
  result: AuditResult;
  manualStatus?: 'EM ANÁLISE' | 'APROVADO COM RESSALVAS' | 'REPROVADO' | 'APROVADO';
  userNotes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
}
