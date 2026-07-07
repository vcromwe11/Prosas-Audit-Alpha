
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
  analysisPhase?: 'WAITING' | 'AUTH' | 'AI_PROMPT' | 'DONE';
  currentAuthTask?: string;
  result?: AuditResult;
  partialStream?: string;
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

export interface DocumentPromptModule {
  id: string;
  documentType: string;
  description: string;
  promptInstructions: string;
  isActive: boolean;
}

export interface AuditContext {
  editalTitle: string;
  regulationText: string;
  formTemplateText: string;
  miscFilesText: string;
  criteriaText: string; 
  referenceDate: string; // Data do edital/prazo de inscrição
  authRules: DocumentAuthRule[];
  promptModules?: DocumentPromptModule[];
  isReady: boolean;
}

export enum AppStage {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  ANALYSIS_SETUP = 'ANALYSIS_SETUP',
  ANALYSIS_RUN = 'ANALYSIS_RUN',
  REPORT_VIEW = 'REPORT_VIEW',
  SETTINGS = 'SETTINGS',
  SEARCH = 'SEARCH',
  IDEAS = 'IDEAS',
  DEMO_PLATFORM = 'DEMO_PLATFORM',
  REPOSITORY = 'REPOSITORY'
}

export interface RepositoryFolder {
  id: string;
  parentId?: string | null;
  name: string;
  userId: string;
  createdAt: number;
}

export interface RepositoryFile {
  id: string;
  folderId: string;
  name: string;
  userId: string;
  storagePath: string; // Left here for backwards compatibility
  size: number;
  type: string;
  createdAt: number;
  chunkCount?: number;
}

export interface PdfPage {
  pageNumber: number;
  text: string;
  fileName?: string;
}

// Persistence Types
export interface StoredPrompt {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export interface SavedReport {
  id: string;
  userId?: string;
  editalName: string;
  candidateName: string;
  cnpj: string;
  timestamp: number;
  result?: AuditResult; // now optional because of lazy loading
  overallStatus?: string; // added to store status natively
  manualStatus?: 'EM ANÁLISE' | 'APROVADO COM RESSALVAS' | 'REPROVADO' | 'APROVADO';
  userNotes?: string;
  promptId?: string;
  evaluatedBy?: string;
  evaluatedAt?: number;
  documentHash?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'developer' | 'analyst' | 'viewer';
  state?: string;
  company?: string;
  jobFunction?: string;
  temporaryPassword?: string;
}

export interface IdeaComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Idea {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  timestamp: number;
  comments: IdeaComment[];
}

export interface GlobalPrompt {
  id: string;
  key: string;
  text: string;
  updatedBy: string;
  timestamp: number;
}

export interface AppSettings {
  theme: 'standard' | 'modern';
  isBoldText: boolean;
  maxConcurrentSlots: number;
  autoSaveDrive: boolean;
  compactMode: boolean;
  showTooltips: boolean;
  aiModel?: string;
}
